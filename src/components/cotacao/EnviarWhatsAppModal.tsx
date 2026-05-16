"use client";

import { useEffect, useState } from "react";
import { XIcon, WhatsAppIcon } from "@/components/icons";
import { gerarMensagemTexto } from "@/lib/whatsapp-message";
import type { Cliente, Cotacao } from "@/types";

type Props = {
  cotacao: Cotacao;
  cliente: Cliente;
  open: boolean;
  onClose: () => void;
};

function abrirWhatsApp(telefone: string, mensagem: string) {
  const digits = telefone.replace(/\D/g, "");
  const numero = digits.startsWith("55") ? digits : `55${digits}`;
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function EnviarWhatsAppModal({ cotacao, cliente, open, onClose }: Props) {
  const [mensagem, setMensagem] = useState("");

  // Telefone: prioriza whatsapp cadastrado, depois telefone, depois campos do formulário
  const telefone =
    cliente.whatsapp ||
    cliente.telefone ||
    cotacao.detalhes.whatsapp ||
    cotacao.detalhes.celular ||
    "";

  // Reinicia a mensagem toda vez que o modal abre
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing derived state when modal opens
      setMensagem(gerarMensagemTexto(cotacao, cliente));
    }
  }, [open, cotacao, cliente]);

  if (!open) return null;

  function handleEnviar() {
    if (!telefone) return;
    abrirWhatsApp(telefone, mensagem);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-[var(--hub-radius-lg)] border border-[var(--hub-border)] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--hub-border)] px-6 py-4">
          <div className="flex items-center gap-2">
            <WhatsAppIcon className="h-5 w-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-bold text-[var(--hub-blue-dark)]">
                Enviar por WhatsApp
              </h2>
              <p className="text-xs text-[var(--hub-text-muted)]">
                {cliente.nome}
                {telefone ? (
                  <span className="ml-1 font-medium text-[var(--hub-text-primary)]">
                    · {telefone}
                  </span>
                ) : (
                  <span className="ml-1 text-red-500">· sem telefone cadastrado</span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--hub-radius)] p-1.5 text-[var(--hub-text-muted)] transition-colors hover:bg-[var(--hub-bg-subtle)] hover:text-[var(--hub-text-secondary)]"
            aria-label="Fechar"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <label
            htmlFor="wa-msg"
            className="mb-2 block text-sm font-medium text-[var(--hub-text-primary)]"
          >
            Mensagem (editavel antes de enviar)
          </label>
          <textarea
            id="wa-msg"
            rows={14}
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            className="w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-3 py-2.5 font-mono text-sm text-[var(--hub-text-primary)] focus:border-[var(--hub-blue)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--hub-blue)]"
          />
          <p className="mt-2 text-xs text-[var(--hub-text-muted)]">
            O texto acima sera enviado como mensagem no WhatsApp. Edite a vontade antes de enviar.
            Lembre-se de anexar o PDF manualmente na conversa.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-[var(--hub-border)] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--hub-text-primary)] transition-colors hover:bg-[var(--hub-bg-subtle)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleEnviar}
            disabled={!telefone || !mensagem.trim()}
            className="inline-flex items-center gap-2 rounded-[var(--hub-radius)] bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Abrir WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
