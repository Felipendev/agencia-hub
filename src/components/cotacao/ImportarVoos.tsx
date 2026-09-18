"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FlightImportResult } from "@/lib/flight-plan";

export function ImportarVoos({ onImport }: { onImport: (result: FlightImportResult) => void }) {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const active = useRef<AbortController | null>(null);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => () => active.current?.abort(), []);
  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [busy]);
  function cancel() {
    active.current?.abort(); active.current = null;
    setBusy(false);
    setMessage("Leitura cancelada. Nenhuma opção foi adicionada. Você pode escolher outro arquivo ou continuar manualmente.");
  }
  async function upload() {
    if (!file || !token || active.current) return;
    if (file.size > 4 * 1024 * 1024) { setMessage("Envie um arquivo de até 4 MB."); return; }
    const controller = new AbortController(); active.current = controller; setBusy(true); setSeconds(0); setMessage("");
    try {
      const body = new FormData(); body.append("file", file);
      const response = await fetch("/api/app/flight-imports", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body, signal: controller.signal });
      const result = await response.json();
      if (controller.signal.aborted || active.current !== controller) return;
      if (!response.ok) throw new Error(result.error || "Não foi possível ler o arquivo.");
      const parsed = result as FlightImportResult;
      if (!parsed.extraction || !Array.isArray(parsed.extraction.offers)) throw new Error("Resposta de leitura inválida.");
      onImport(parsed);
      setMessage(parsed.extraction.offers.length
        ? `${parsed.cached ? "Leitura anterior reutilizada. " : ""}${parsed.extraction.offers.length} opção(ões) adicionada(s). Confira os dados abaixo.`
        : "Nenhuma oferta reconhecida. Preencha manualmente ou envie outra imagem.");
    } catch (error) {
      if (!controller.signal.aborted && active.current === controller) setMessage(error instanceof Error ? error.message : "Falha na leitura. Continue manualmente.");
    } finally {
      if (active.current === controller) { active.current = null; setBusy(false); }
    }
  }
  return <Card>
    <h2 className="font-semibold">Importar oferta de voo</h2>
    <p className="mt-1 text-sm text-[var(--hub-text-secondary)]">Envie PDF, PNG ou JPEG de até 4 MB; PDF com até 5 páginas. A leitura cria opções editáveis; nada é salvo na cotação até você conferir e salvar.</p>
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <label className="text-sm">Arquivo da oferta
        <input className="ml-2 max-w-full text-sm" type="file" accept="application/pdf,image/png,image/jpeg" disabled={busy}
          onChange={(e) => { setFile(e.target.files?.[0] ?? null); setMessage(""); }} />
      </label>
      <Button type="button" onClick={() => void upload()} disabled={!file || !token || busy}>{busy ? "Lendo oferta…" : "Ler arquivo"}</Button>
    </div>
    {busy && <div role="status" aria-live="polite" className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-center gap-3"><span aria-hidden="true" className="h-5 w-5 animate-spin motion-reduce:animate-none rounded-full border-2 border-blue-200 border-t-blue-700" /><p className="font-medium">Lendo {file?.name} · {seconds}s</p></div>
      <p className="mt-2 text-sm">Aguarde o envio e a identificação dos voos. Depois, as opções aparecerão abaixo para revisão. Isso pode levar até um minuto.</p>
      <Button type="button" variant="danger" className="mt-3" onClick={cancel}>Cancelar leitura</Button>
      <p className="mt-2 text-xs">Cancelar descarta o resultado nesta tela. Uma leitura já enviada ao provedor ainda pode ser cobrada.</p>
    </div>}
    {!token && <p className="mt-2 text-sm">Entre na sua conta para importar. O preenchimento manual está disponível.</p>}
    {message && <p role="status" className="mt-3 text-sm">{message}</p>}
  </Card>;
}
