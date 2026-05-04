"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useData } from "@/contexts/data-context";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditIcon } from "@/components/icons";
import { formatBRL, formatDateBR } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";
import {
  ATENDIMENTO_STATUS_LABELS,
  CLIENTE_STATUS_LABELS,
} from "@/lib/constants";
import { TimelineView } from "@/components/timeline/TimelineView";
import { BackButton } from "@/components/ui/back-button";
import { EditarClienteModal } from "@/components/cliente/EditarClienteModal";

export default function ClienteDetalhePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { clientes, atendimentos, isReady } = useData();
  const [editOpen, setEditOpen] = useState(false);

  const cliente = clientes.find((c) => c.id === id);
  const atendDoCliente = atendimentos.filter((a) => a.clienteId === id);

  if (!isReady) {
    return <p className="text-sm text-slate-600">Carregando…</p>;
  }

  if (!cliente) {
    return (
      <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <BackButton href="/clientes" label="Clientes" />
        <p className="font-medium">Cliente não encontrado.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <BackButton href="/clientes" label="Clientes" />
            <h1 className="mt-4 text-2xl font-bold text-[var(--hub-blue-dark)]">
              {cliente.nome}
            </h1>
            <p className="mt-1 text-slate-600">
              Cadastrado em {formatDateBR(cliente.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone="warning">{CLIENTE_STATUS_LABELS[cliente.status]}</Badge>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2"
            >
              <EditIcon className="h-4 w-4" />
              Editar cliente
            </Button>
          </div>
        </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Dados de contato</CardTitle>
          <dl className="mt-4 space-y-3 text-sm">
            {/* E-mail */}
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">E-mail</dt>
              <dd>
                {cliente.email ? (
                  <a
                    href={`mailto:${cliente.email}`}
                    className="font-medium text-[var(--hub-blue)] hover:underline"
                  >
                    {cliente.email}
                  </a>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </dd>
            </div>

            {/* Telefone */}
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Telefone</dt>
              <dd>
                {cliente.telefone ? (
                  <a
                    href={`tel:${cliente.telefone.replace(/\D/g, "")}`}
                    className="hover:underline"
                  >
                    {cliente.telefone}
                  </a>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </dd>
            </div>

            {/* WhatsApp */}
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">WhatsApp</dt>
              <dd>
                {(() => {
                  const waNum = cliente.whatsapp || cliente.telefone;
                  const waUrl = waNum ? whatsappLink(waNum) : null;
                  return waUrl ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-emerald-600 hover:underline"
                    >
                      {/* WhatsApp icon inline */}
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4 fill-current"
                        aria-hidden="true"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      {cliente.whatsapp || cliente.telefone}
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  );
                })()}
              </dd>
            </div>

            {/* Rede social */}
            {cliente.redeSocial && (
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500">Rede social</dt>
                <dd className="text-slate-700">{cliente.redeSocial}</dd>
              </div>
            )}

            {/* Site */}
            {cliente.site && (
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500">Site</dt>
                <dd>
                  <a
                    href={cliente.site.startsWith("http") ? cliente.site : `https://${cliente.site}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--hub-blue)] hover:underline"
                  >
                    {cliente.site}
                  </a>
                </dd>
              </div>
            )}

            {/* Destino de interesse */}
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Destino de interesse</dt>
              <dd className="text-slate-700">{cliente.destinoInteresse || "—"}</dd>
            </div>

            {/* Canal de venda */}
            {cliente.canalVenda && (
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500">Canal de venda</dt>
                <dd className="capitalize text-slate-700">
                  {cliente.canalVenda.replace(/_/g, " ")}
                </dd>
              </div>
            )}

            {/* Data de nascimento */}
            {cliente.dataNascimento && (
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500">Nascimento</dt>
                <dd className="text-slate-700">{formatDateBR(cliente.dataNascimento)}</dd>
              </div>
            )}

            {/* Contato de emergência */}
            {(cliente.emergenciaNome || cliente.emergenciaTelefone) && (
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500">Emergência</dt>
                <dd className="text-slate-700">
                  {cliente.emergenciaNome}
                  {cliente.emergenciaTelefone && (
                    <span className="ml-2 text-slate-500">
                      · {cliente.emergenciaTelefone}
                    </span>
                  )}
                </dd>
              </div>
            )}

            {/* Observações */}
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Observações</dt>
              <dd className="whitespace-pre-wrap text-slate-700">
                {cliente.observacoes || <span className="text-slate-400">—</span>}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <CardTitle>Atendimentos vinculados</CardTitle>
            <Link
              href={`/atendimentos?clienteId=${cliente.id}`}
              className="text-sm font-medium text-[var(--hub-yellow)] hover:underline"
            >
              + Novo atendimento
            </Link>
          </div>
          {atendDoCliente.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhum atendimento ainda.{" "}
              <Link
                href={`/atendimentos?clienteId=${cliente.id}`}
                className="font-medium text-[var(--hub-blue)] underline"
              >
                Cadastrar oportunidade
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-[var(--hub-border)]">
              {atendDoCliente.map((a) => (
                <li key={a.id} className="py-3 first:pt-0">
                  <p className="font-medium text-[var(--hub-blue-dark)]">
                    {a.titulo}
                  </p>
                  <p className="text-xs text-slate-500">
                    {a.destino} · viagem prevista{" "}
                    {formatDateBR(a.dataPrevistaViagem)}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge tone="muted">
                      {ATENDIMENTO_STATUS_LABELS[a.status]}
                    </Badge>
                    <span className="text-sm font-semibold tabular-nums text-slate-800">
                      {formatBRL(a.valorEstimado)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <TimelineView entityType="cliente" entityId={cliente.id} />
      </Card>
    </div>

    <EditarClienteModal
      cliente={cliente}
      open={editOpen}
      onClose={() => setEditOpen(false)}
    />
  </>
  );
}
