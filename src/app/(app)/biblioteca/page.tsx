"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Material = { id: string; title: string; category: string; kind: string; url?: string; body?: string; filename?: string };
const categories: Record<string, string> = { BAGAGEM: "Bagagem", IMIGRACAO: "Imigração", FORMULARIO: "Formulários", CONTRATO: "Contratos", AGENCIA: "Documentos da agência", NOTA_FISCAL: "Nota fiscal", OUTROS: "Outros" };
const invoice = "MODELO DE NOTA FISCAL — DOCUMENTO DE APOIO\n\nAgência: [nome]\nCNPJ: [CNPJ]\nEndereço: [endereço]\nCliente: [nome / razão social]\nCPF/CNPJ: [documento]\nData: [data]\nDescrição do serviço: [descrição]\nValor: R$ [valor]\nObservações: [observações]\n\nPreencha este modelo para organizar os dados. A emissão e a validade fiscal dependem do serviço de emissão utilizado pela agência.";
const empty = { title: "", category: "OUTROS", kind: "LINK", url: "", body: "" };

export default function BibliotecaPage() {
  const { token } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loaded, setLoaded] = useState(false);
  const base = getAgenciaHubApiBaseUrl();

  async function request(path = "", init?: RequestInit) {
    if (!base || !token) throw new Error("Conecte-se ao sistema para acessar a biblioteca da agência.");
    const response = await fetch(`${base}/library${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, ...init?.headers } });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.message || "Não foi possível acessar a biblioteca. Tente novamente.");
    }
    return response;
  }
  useEffect(() => {
    if (!base || !token) return;
    const controller = new AbortController();
    fetch(`${base}/library`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(async (r) => { if (!r.ok) throw new Error("Não foi possível carregar a biblioteca."); return r.json() as Promise<Material[]>; })
      .then((rows) => { setMaterials(rows); setLoaded(true); })
      .catch((e: Error) => { if (e.name !== "AbortError") setError(e.message); });
    return () => controller.abort();
  }, [base, token]);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      let init: RequestInit;
      let path = editing ? `/${editing}` : "";
      if (form.kind === "FILE" && (!editing || file)) {
        if (!file || file.size > 5 * 1024 * 1024) throw new Error("Escolha um arquivo de até 5 MB.");
        const data = new FormData(); data.set("title", form.title); data.set("category", form.category); data.set("file", file);
        init = { method: editing ? "PUT" : "POST", body: data };
        path = editing ? `/${editing}/file` : "/files";
      } else init = { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) };
      const saved: Material = await (await request(path, init)).json();
      setNotice(editing ? "Material atualizado." : "Material adicionado.");
      setMaterials((rows) => [...rows.filter((r) => r.id !== saved.id), saved]); setLoaded(true); setEditing(null); setForm(empty); setFile(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Erro ao salvar."); } finally { setBusy(false); }
  }
  async function download(row: Material) {
    setError("");
    try {
      const blob = row.kind === "FILE" ? await (await request(`/${row.id}/download`)).blob() : new Blob([row.body ?? ""], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = row.filename || `${row.title}.txt`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setError(e instanceof Error ? e.message : "Erro ao baixar."); }
  }
  async function remove(row: Material) {
    if (!window.confirm(`Excluir “${row.title}” da biblioteca da agência?`)) return;
    setBusy(true); setError(""); setNotice("");
    try { await request(`/${row.id}`, { method: "DELETE" }); setMaterials((rows) => rows.filter((r) => r.id !== row.id)); if (editing === row.id) { setEditing(null); setForm(empty); setFile(null); } setNotice("Material excluído."); }
    catch (e) { setError(e instanceof Error ? e.message : "Erro ao excluir."); } finally { setBusy(false); }
  }
  const visible = materials.filter((r) => (!category || r.category === category) && `${r.title} ${r.filename ?? ""}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")));
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-semibold">Biblioteca da agência</h1><p className="text-sm text-muted-foreground">Links, formulários, arquivos e modelos compartilhados com sua equipe.</p></div>
    {(error || !base) && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error || "A biblioteca precisa de conexão com o serviço da agência para salvar e carregar materiais."}</p>}
    {notice && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    <p className="text-sm text-muted-foreground">Os links oficiais também podem ser editados ou excluídos na lista de materiais. Consulte sempre as regras atuais nos sites de origem.</p>
    <form onSubmit={save} className="space-y-4 rounded-xl border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{editing ? "Editar material" : "Adicionar material"}</h2><Button type="button" variant="secondary" disabled={busy} onClick={() => { setEditing(null); setFile(null); setForm({ ...empty, title: "Modelo de nota fiscal", kind: "TEMPLATE", category: "NOTA_FISCAL", body: invoice }); }}>Usar modelo de NF</Button></div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-1 text-sm">Título<Input required maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
        <label className="space-y-1 text-sm">Categoria<select className="h-10 w-full rounded-md border bg-white px-3" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{Object.entries(categories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="space-y-1 text-sm">Tipo<select disabled={!!editing} className="h-10 w-full rounded-md border bg-white px-3" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}><option value="LINK">Link</option><option value="FILE">Arquivo</option><option value="TEMPLATE">Modelo editável</option></select></label>
      </div>
      {form.kind === "LINK" && <label className="block space-y-1 text-sm">Endereço do site<Input required type="url" maxLength={2048} placeholder="https://" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></label>}
      {form.kind === "FILE" && <label className="block space-y-1 text-sm">{editing ? "Substituir arquivo (opcional, até 5 MB)" : "Arquivo (até 5 MB)"}<Input key={editing ?? "new-file"} type="file" required={!editing} accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />{editing && <span className="text-xs text-muted-foreground">Sem um novo arquivo, o documento atual será mantido.</span>}</label>}
      {form.kind === "TEMPLATE" && <label className="block space-y-1 text-sm">Conteúdo do modelo<textarea required maxLength={20000} rows={12} className="w-full rounded-md border p-3" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></label>}
      <div className="flex gap-2"><Button disabled={busy || !token || !base} type="submit">{busy ? "Salvando…" : editing ? "Salvar alterações" : "Salvar material"}</Button>{editing && <Button type="button" variant="secondary" disabled={busy} onClick={() => { setEditing(null); setForm(empty); setFile(null); }}>Cancelar edição</Button>}</div>
    </form>
    <section className="space-y-4"><div className="flex flex-wrap gap-3"><Input aria-label="Buscar materiais" placeholder="Buscar materiais" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" /><select aria-label="Filtrar categoria" className="rounded-md border bg-white px-3" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Todas as categorias</option>{Object.entries(categories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
      {visible.length === 0 && <p className="text-sm text-muted-foreground">{loaded ? "Nenhum material encontrado. Adicione os documentos e links da agência acima." : error || !base ? "Os materiais estarão disponíveis quando a conexão for restabelecida." : "Carregando biblioteca…"}</p>}
      <div className="grid gap-4 md:grid-cols-2">{visible.map((row) => <article key={row.id} className="space-y-3 rounded-xl border bg-white p-5"><div><p className="text-xs text-muted-foreground">{categories[row.category]} · {row.kind === "LINK" ? "Link" : row.kind === "FILE" ? "Arquivo" : "Modelo editável"}</p><h3 className="font-semibold">{row.title}</h3>{row.filename && <p className="text-sm text-muted-foreground">{row.filename}</p>}</div><div className="flex flex-wrap gap-2">{row.kind === "LINK" && row.url && /^https?:\/\//i.test(row.url) ? <a href={row.url} target="_blank" rel="noopener noreferrer" className="rounded-md border px-3 py-2 text-sm">Abrir site</a> : <Button variant="secondary" onClick={() => download(row)}>Baixar {row.kind === "TEMPLATE" ? "modelo" : "arquivo"}</Button>}<Button variant="secondary" disabled={busy} onClick={() => { setEditing(row.id); setFile(null); setNotice(""); setForm({ title: row.title, category: row.category, kind: row.kind, url: row.url ?? "", body: row.body ?? "" }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Editar</Button><Button variant="secondary" disabled={busy} onClick={() => remove(row)}>Excluir</Button></div></article>)}</div>
    </section>
  </div>;
}
