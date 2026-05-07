"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { isValidSolicitacaoSlug } from "@/lib/solicitacao-slug";
import { generateId } from "@/lib/format";
import { useAuth } from "@/contexts/auth-context";
import type { LinkSocialItem, LinkSocialTipo, SolicitacaoPublicaConfig } from "@/types/solicitacao-publica";

const TIPOS_LINK: { id: LinkSocialTipo; label: string }[] = [
  { id: "whatsapp",   label: "WhatsApp"    },
  { id: "instagram",  label: "Instagram"   },
  { id: "facebook",   label: "Facebook"    },
  { id: "email",      label: "E-mail"      },
  { id: "site",       label: "Site"        },
  { id: "formulario", label: "Formulario"  },
  { id: "outro",      label: "Outro"       },
];

export function AbaFormulario() {
  const toast = useToast();
  const { token } = useAuth();
  const [config, setConfig] = useState<SolicitacaoPublicaConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/app/solicitacao-config?slug=demo", {
        credentials: "include",
        headers,
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { config: SolicitacaoPublicaConfig };
      setConfig(data.config);
    } catch { setError("Nao foi possivel carregar as configuracoes."); }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  async function handleSave() {
    if (!config) return;
    if (!isValidSolicitacaoSlug(config.slug)) {
      setError("Slug invalido: letras minusculas, numeros e hifen (2-64 chars).");
      return;
    }
    setSaving(true); setError(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/app/solicitacao-config", {
        method: "PUT", credentials: "include",
        headers,
        body: JSON.stringify({ config }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; config?: SolicitacaoPublicaConfig };
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      if (data.config) setConfig(data.config);
      toast.success("Formulario salvo!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally { setSaving(false); }
  }

  function addLink() {
    if (!config) return;
    setConfig({ ...config, linksSociais: [...config.linksSociais, { id: generateId(), tipo: "whatsapp", url: "" }] });
  }
  function updateLink(id: string, patch: Partial<LinkSocialItem>) {
    if (!config) return;
    setConfig({ ...config, linksSociais: config.linksSociais.map((l) => l.id === id ? { ...l, ...patch } : l) });
  }
  function removeLink(id: string) {
    if (!config) return;
    setConfig({ ...config, linksSociais: config.linksSociais.filter((l) => l.id !== id) });
  }
  function onLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !config) return;
    if (file.size > 400 * 1024) { setError("Imagem muito grande. Use ate 400 KB."); return; }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") setConfig({ ...config, logoDataUrl: reader.result }); };
    reader.readAsDataURL(file);
  }

  if (!config) return <Card><p className="p-4 text-sm text-slate-500">{error ?? "Carregando..."}</p></Card>;

  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/solicitacao/${config.slug}` : "";

  return (
    <div className="space-y-4">
      {/* Link publico */}
      <Card>
        <div className="p-1 space-y-2">
          <p className="text-sm font-semibold text-[var(--hub-blue-dark)]">Link publico do formulario</p>
          <div className="flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
            <code className="flex-1 break-all text-xs text-slate-700">{publicUrl}</code>
            <button type="button" onClick={() => navigator.clipboard.writeText(publicUrl).then(() => toast.success("Copiado!"))}
              className="shrink-0 rounded border border-sky-300 bg-white px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-50">
              Copiar
            </button>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer"
              className="shrink-0 rounded border border-sky-300 bg-white px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-50">
              Abrir
            </a>
          </div>
        </div>
      </Card>

      {/* Config */}
      <Card>
        <div className="space-y-4 p-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="fc-slug">Slug (identificador)</Label>
              <Input id="fc-slug" value={config.slug} className="font-mono"
                onChange={(e) => setConfig({ ...config, slug: e.target.value.trim() })} />
              <p className="mt-1 text-xs text-slate-400">Letras minusculas, numeros e hifen.</p>
            </div>
            <div>
              <Label htmlFor="fc-marca">Nome da marca</Label>
              <Input id="fc-marca" value={config.nomeMarca}
                onChange={(e) => setConfig({ ...config, nomeMarca: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="fc-titulo">Titulo da pagina</Label>
              <Input id="fc-titulo" value={config.tituloPagina}
                onChange={(e) => setConfig({ ...config, tituloPagina: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="fc-intro">Texto introdutorio</Label>
              <Textarea id="fc-intro" rows={3} value={config.textoIntro}
                onChange={(e) => setConfig({ ...config, textoIntro: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Logo (max 400 KB)</Label>
              <Input type="file" accept="image/*" className="mt-1 text-sm" onChange={onLogoFile} />
              {config.logoDataUrl && (
                <div className="mt-2 flex items-center gap-3">
                  <img src={config.logoDataUrl} alt="Logo" className="h-10 rounded border" />
                  <button type="button" className="text-xs text-red-600 hover:underline"
                    onClick={() => setConfig({ ...config, logoDataUrl: null })}>
                    Remover
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Links sociais */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--hub-blue-dark)]">Links de contato</p>
              <button type="button" onClick={addLink}
                className="rounded border border-[var(--hub-border)] bg-white px-3 py-1 text-xs font-medium hover:bg-slate-50">
                + Adicionar
              </button>
            </div>
            <div className="space-y-2">
              {config.linksSociais.map((l) => (
                <div key={l.id} className="grid gap-2 rounded-lg border border-slate-200 p-2 sm:grid-cols-[140px_1fr_auto]">
                  <Select value={l.tipo} onChange={(e) => updateLink(l.id, { tipo: e.target.value as LinkSocialTipo })}>
                    {TIPOS_LINK.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </Select>
                  <Input placeholder="https://..." value={l.url} onChange={(e) => updateLink(l.id, { url: e.target.value })} />
                  <button type="button" onClick={() => removeLink(l.id)}
                    className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100">
                    Remover
                  </button>
                </div>
              ))}
              {config.linksSociais.length === 0 && <p className="text-xs text-slate-400">Nenhum link cadastrado.</p>}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end pt-2">
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
