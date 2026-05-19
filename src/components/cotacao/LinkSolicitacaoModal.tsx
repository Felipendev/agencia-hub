"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { IconX } from "@/components/icons";
import { generateId } from "@/lib/format";
import { isUuid } from "@/lib/api/quotation-mapper";
import { isValidSolicitacaoSlug } from "@/lib/solicitacao-slug";
import { useAuth } from "@/contexts/auth-context";
import type {
  LinkSocialItem,
  LinkSocialTipo,
  SolicitacaoPublicaConfig,
} from "@/types/solicitacao-publica";

const TIPOS_LINK: { id: LinkSocialTipo; label: string }[] = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "email", label: "E-mail" },
  { id: "site", label: "Site" },
  { id: "formulario", label: "Formulário / doc." },
  { id: "outro", label: "Outro" },
];

const LOCAL_CONFIG_KEY = "agencia-hub-solicitacao-config";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Código público do vendedor (não é o UUID) — anexado ao link para atribuição. */
  sellerPublicCode?: string | null;
};

export function LinkSolicitacaoModal({
  open,
  onClose,
  sellerPublicCode,
}: Props) {
  const { token, user } = useAuth();
  const [view, setView] = useState<"main" | "customize">("main");
  const [config, setConfig] = useState<SolicitacaoPublicaConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const slugPart = (config?.slug ?? "").trim();
    if (!slugPart) return "";
    let url = `${window.location.origin}/solicitacao/${encodeURIComponent(slugPart)}`;
    // Only append ?seller= when there's a proper opaque code (never expose UUIDs)
    if (sellerPublicCode?.trim()) {
      url += `?seller=${encodeURIComponent(sellerPublicCode.trim())}`;
    }
    return url;
  }, [config?.slug, sellerPublicCode, user?.id]);

  const isSalesAgent = user?.accountKind === "SALES_AGENT";

  const loadConfig = useCallback(async () => {
    setLoadError(null);
    // SALES_AGENT cannot access agency config — read from localStorage cache only
    if (isSalesAgent) {
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(LOCAL_CONFIG_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as SolicitacaoPublicaConfig;
            if (parsed?.slug) { setConfig(parsed); return; }
          }
        } catch { /* ignore */ }
      }
      return;
    }
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/app/solicitacao-config", {
        credentials: "include",
        headers,
      });
      if (res.status === 401) {
        setLoadError("Faça login no painel para carregar a personalização.");
        return;
      }
      if (!res.ok) throw new Error("Falha ao carregar");
      const data = (await res.json()) as { config: SolicitacaoPublicaConfig };
      setConfig(data.config);
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(data.config));
      }
    } catch {
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(LOCAL_CONFIG_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as SolicitacaoPublicaConfig;
            if (parsed?.slug) setConfig(parsed);
          }
        } catch {
          /* ignore */
        }
      }
      setLoadError("Não foi possível carregar as configurações.");
    }
  }, [token, isSalesAgent]);

  useEffect(() => {
    if (!open) {
      setView("main");
      setCopied(false);
      return;
    }
    void loadConfig();
  }, [open, loadConfig]);

  async function handleSave() {
    if (!config) return;
    setSaveError(null);
    if (!isValidSolicitacaoSlug(config.slug)) {
      setSaveError(
        "Identificador do link: use apenas letras minúsculas, números e hífen (2–64 caracteres).",
      );
      return;
    }
    setSaving(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/app/solicitacao-config", {
        method: "PUT",
        credentials: "include",
        headers,
        body: JSON.stringify({ config }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        config?: SolicitacaoPublicaConfig;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Erro ao salvar");
      }
      if (data.config) {
        setConfig(data.config);
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(data.config));
        }
      }
      setView("main");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setSaveError("Não foi possível copiar. Copie manualmente.");
    }
  }

  function addLink() {
    if (!config) return;
    const item: LinkSocialItem = {
      id: generateId(),
      tipo: "whatsapp",
      url: "",
    };
    setConfig({
      ...config,
      linksSociais: [...config.linksSociais, item],
    });
  }

  function updateLink(id: string, patch: Partial<LinkSocialItem>) {
    if (!config) return;
    setConfig({
      ...config,
      linksSociais: config.linksSociais.map((l) =>
        l.id === id ? { ...l, ...patch } : l,
      ),
    });
  }

  function removeLink(id: string) {
    if (!config) return;
    setConfig({
      ...config,
      linksSociais: config.linksSociais.filter((l) => l.id !== id),
    });
  }

  function onLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !config) return;
    if (file.size > 400 * 1024) {
      setSaveError("Imagem muito grande. Use até 400 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") {
        setConfig({ ...config, logoDataUrl: r });
        setSaveError(null);
      }
    };
    reader.readAsDataURL(file);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4">
      <div className="my-8 w-full max-w-lg rounded-[var(--hub-radius-xl)] border border-[var(--hub-border)] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--hub-border)] px-5 py-4">
          <h2 className="text-lg font-bold text-[var(--hub-blue-dark)]">
            {view === "main"
              ? "Link para solicitação de cotação"
              : "Personalizar página pública"}
          </h2>
          <button
            type="button"
            className="rounded-[var(--hub-radius)] p-2 text-[var(--hub-text-secondary)] hover:bg-[var(--hub-bg-subtle)]"
            onClick={onClose}
            aria-label="Fechar"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {view === "main" ? (
          <div className="space-y-4 px-5 py-4">
            <div className="rounded-[var(--hub-radius-lg)] border border-sky-200 bg-sky-50 px-4 py-3">
              <p className="text-sm font-semibold text-[var(--hub-blue-dark)]">
                Link principal da agência
              </p>
              <p className="mt-2 break-all font-mono text-xs text-[var(--hub-text-primary)]">
                {publicUrl || "Carregando identificador…"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="text-sm"
                  onClick={() => void copyLink()}
                  disabled={!publicUrl}
                >
                  {copied ? "Copiado!" : "Copiar link"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="text-sm"
                  onClick={() => publicUrl && window.open(publicUrl, "_blank", "noopener")}
                  disabled={!publicUrl}
                >
                  Abrir em nova aba
                </Button>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-[var(--hub-text-secondary)]">
              Compartilhe este link com seus clientes para receber solicitações de cotação diretamente no painel.
            </p>

            {!isSalesAgent && (
              <Button
                type="button"
                className="w-full text-sm"
                onClick={() => setView("customize")}
              >
                Personalizar o formulário
              </Button>
            )}

            {loadError ? (
              <p className="text-sm text-amber-700">{loadError}</p>
            ) : null}
          </div>
        ) : (
          <div className="max-h-[calc(100vh-10rem)] space-y-4 overflow-y-auto px-5 py-4">
            {config ? (
              <>
                <div>
                  <Label htmlFor="ls-slug">Identificador do link (slug)</Label>
                  <Input
                    id="ls-slug"
                    value={config.slug}
                    onChange={(e) => {
                      const v = e.target.value
                        .trim()
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "");
                      setConfig({ ...config, slug: v });
                    }}
                    placeholder="ex.: minha-agencia"
                    className="mt-1 font-mono text-sm"
                  />
                  <p className="mt-1 text-xs text-[var(--hub-text-muted)]">
                    URL pública: /solicitacao/[identificador] — letras minúsculas,
                    números e hífen.
                  </p>
                </div>
                <div>
                  <Label htmlFor="ls-marca">Nome exibido (marca)</Label>
                  <Input
                    id="ls-marca"
                    value={config.nomeMarca}
                    onChange={(e) =>
                      setConfig({ ...config, nomeMarca: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="ls-tit">Título da página</Label>
                  <Input
                    id="ls-tit"
                    value={config.tituloPagina}
                    onChange={(e) =>
                      setConfig({ ...config, tituloPagina: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="ls-intro">Texto introdutório</Label>
                  <Textarea
                    id="ls-intro"
                    rows={3}
                    value={config.textoIntro}
                    onChange={(e) =>
                      setConfig({ ...config, textoIntro: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Logo (imagem)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    className="mt-1 text-sm"
                    onChange={onLogoFile}
                  />
                  {config.logoDataUrl ? (
                    <div className="mt-2 flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element -- Data URL */}
                      <img
                        src={config.logoDataUrl}
                        alt="Logo"
                        className="h-10 rounded border"
                      />
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => setConfig({ ...config, logoDataUrl: null })}
                      >
                        Remover imagem
                      </button>
                    </div>
                  ) : null}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--hub-blue-dark)]">
                      Ícones de contato (links)
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      className="text-xs"
                      onClick={addLink}
                    >
                      Adicionar
                    </Button>
                  </div>
                  <ul className="mt-2 space-y-2">
                    {config.linksSociais.map((l) => (
                      <li
                        key={l.id}
                        className="grid gap-2 rounded-[var(--hub-radius)] border border-[var(--hub-border)] p-2 sm:grid-cols-[1fr_1fr_auto]"
                      >
                        <Select
                          value={l.tipo}
                          onChange={(e) =>
                            updateLink(l.id, {
                              tipo: e.target.value as LinkSocialTipo,
                            })
                          }
                        >
                          {TIPOS_LINK.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.label}
                            </option>
                          ))}
                        </Select>
                        <Input
                          placeholder="https://…"
                          value={l.url}
                          onChange={(e) =>
                            updateLink(l.id, { url: e.target.value })
                          }
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          className="text-xs text-red-700"
                          onClick={() => removeLink(l.id)}
                        >
                          Remover
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>

                {saveError ? (
                  <p className="text-sm text-red-600">{saveError}</p>
                ) : null}

                <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--hub-border)] pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setView("main")}
                  >
                    Voltar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={saving}
                  >
                    {saving ? "Salvando…" : "Salvar"}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-[var(--hub-text-secondary)]">Carregando…</p>
            )}
          </div>
        )}

        {view === "main" ? (
          <div className="flex justify-end border-t border-[var(--hub-border)] px-5 py-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Fechar
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
