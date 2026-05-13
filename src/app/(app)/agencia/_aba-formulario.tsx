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

const LOCAL_CONFIG_KEY = "agencia-hub-solicitacao-config";
const AUTOSAVE_DEBOUNCE_MS = 1200;

export function AbaFormulario() {
  const toast = useToast();
  const { token, user } = useAuth();
  const [config, setConfig] = useState<SolicitacaoPublicaConfig | null>(null);
  const [lastSavedConfig, setLastSavedConfig] = useState<SolicitacaoPublicaConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [statusNow, setStatusNow] = useState<number>(Date.now());
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const loadLocalConfig = () => {
      if (typeof window === "undefined") return;
      try {
        const raw = localStorage.getItem(LOCAL_CONFIG_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as SolicitacaoPublicaConfig;
        if (parsed?.slug) setConfig(parsed);
      } catch {
        // Ignore local parse errors
      }
    };

    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/app/solicitacao-config", {
        credentials: "include",
        headers,
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { config: SolicitacaoPublicaConfig };
      setConfig(data.config);
      setLastSavedConfig(data.config);
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(data.config));
      }
    } catch {
      loadLocalConfig();
      setError("Não foi possível carregar as configurações.");
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const handleSave = useCallback(async () => {
    if (!config) return;
    if (!isValidSolicitacaoSlug(config.slug)) {
      setError("O identificador do link deve conter apenas letras minúsculas, números e hífen, com 2 a 64 caracteres. Exemplo: minha-agencia");
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
      if (data.config) {
        setConfig(data.config);
        setLastSavedConfig(data.config);
        setLastSavedAt(Date.now());
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(data.config));
        }
      }
      toast.success("Formulario salvo!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally { setSaving(false); }
  }, [config, token, toast]);

  useEffect(() => {
    const timer = setInterval(() => setStatusNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!config || !lastSavedConfig) return;
    if (saving) return;
    if (JSON.stringify(config) === JSON.stringify(lastSavedConfig)) return;
    if (!isValidSolicitacaoSlug(config.slug)) return;
    if (!config.tituloPagina?.trim()) return;

    const timeout = setTimeout(() => {
      void handleSave();
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [config, lastSavedConfig, saving, handleSave]);

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

  const publicUrl =
    typeof window !== "undefined" ?
      (() => {
        let u = `${window.location.origin}/solicitacao/${config.slug}`;
        if (user?.role === "SELLER" && user.linkPublicCode?.trim()) {
          u += `?vendedor=${encodeURIComponent(user.linkPublicCode.trim())}`;
        }
        return u;
      })()
    : "";
  const hasUnsavedChanges =
    !!lastSavedConfig && JSON.stringify(config) !== JSON.stringify(lastSavedConfig);
  const savedAgoText = (() => {
    if (!lastSavedAt) return "Ainda não salvo";
    const diffSec = Math.max(0, Math.floor((statusNow - lastSavedAt) / 1000));
    if (diffSec < 5) return "Salvo agora";
    if (diffSec < 60) return `Salvo há ${diffSec}s`;
    const diffMin = Math.floor(diffSec / 60);
    return `Salvo há ${diffMin}min`;
  })();

  return (
    <div className="space-y-4">
      {/* Link publico + Preview */}
      <Card>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--hub-blue-dark)]">Link público do formulário</p>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--hub-blue)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[var(--hub-blue-dark)] transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              Visualizar formulário
            </a>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
            <code className="flex-1 break-all text-xs text-slate-700">{publicUrl}</code>
            <button type="button" onClick={() => navigator.clipboard.writeText(publicUrl).then(() => toast.success("Link copiado!"))}
              className="shrink-0 rounded border border-sky-300 bg-white px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100 transition-colors">
              Copiar link
            </button>
          </div>
        </div>
      </Card>

      {/* Config */}
      <Card>
        <div className="space-y-4 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="fc-slug">Identificador do link público</Label>
              <Input id="fc-slug" value={config.slug} className="font-mono"
                placeholder="ex: minha-agencia"
                onChange={(e) => setConfig({ ...config, slug: e.target.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') })} />
              <p className="mt-1 text-xs text-slate-400">Usado na URL do formulário público. Apenas letras minúsculas, números e hífen.</p>
            </div>
            <div>
              <Label htmlFor="fc-marca">Nome da marca</Label>
              <Input id="fc-marca" value={config.nomeMarca}
                onChange={(e) => setConfig({ ...config, nomeMarca: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="fc-titulo">Título da página</Label>
              <Input id="fc-titulo" value={config.tituloPagina}
                onChange={(e) => setConfig({ ...config, tituloPagina: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="fc-intro">Texto introdutório</Label>
              <Textarea id="fc-intro" rows={3} value={config.textoIntro}
                onChange={(e) => setConfig({ ...config, textoIntro: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Logo do formulário</Label>
              <p className="mb-2 text-xs text-slate-400">
                Por padrão, o formulário usa a logo da agência. Envie uma imagem aqui apenas se quiser usar uma logo diferente no formulário público.
              </p>
              <Input type="file" accept="image/*" className="text-sm" onChange={onLogoFile} />
              {config.logoDataUrl && (
                <div className="mt-2 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- Data URL from user upload */}
                  <img src={config.logoDataUrl} alt="Logo" className="h-10 rounded border" />
                  <button type="button" className="text-xs text-red-600 hover:underline"
                    onClick={() => setConfig({ ...config, logoDataUrl: null })}>
                    Remover (usar logo da agência)
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
            <div className="flex items-center gap-3">
              <p className={`text-xs ${error ? "text-red-600" : "text-slate-500"}`}>
                {saving ? "Salvando..." : error ? "Erro ao salvar" : hasUnsavedChanges ? "Alterações pendentes" : savedAgoText}
              </p>
              <Button type="button" onClick={() => void handleSave()} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
