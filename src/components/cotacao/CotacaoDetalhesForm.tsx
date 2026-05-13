"use client";

import { useState } from "react";
import {
  COMODIDADES_HOTEL_OPTIONS,
  COMUNICACAO_OPTIONS,
  FLEXIBILIDADE_OPTIONS,
  HORARIO_SAIDA_OPTIONS,
  HOSPEDAGEM_CATEGORIA_OPTIONS,
  PAGAMENTO_OPTIONS,
  PREFERENCIA_VOO_OPTIONS,
  SERVICOS_DESEJADOS_OPTIONS,
} from "@/lib/cotacao-options";
import {
  brPhoneDigits,
  formatBrPhoneDisplay,
  isValidBrazilianPhone,
} from "@/lib/br-phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { CotacaoDetalhes } from "@/types";

export type CotacaoDetalhesFormProps = {
  det: CotacaoDetalhes;
  onToggleServico: (id: string) => void;
  onToggleComodidade: (label: string) => void;
  onPatch: (patch: Partial<CotacaoDetalhes>) => void;
  /** Na página pública, mantém as seções abertas para leitura contínua */
  secoesAbertas?: boolean;
  /** Página pública: celular em "Contato e pagamento" é o único campo de celular obrigatório */
  contatoCelularObrigatorio?: boolean;
};

export function CotacaoDetalhesForm({
  det,
  onToggleServico,
  onToggleComodidade,
  onPatch,
  secoesAbertas = false,
  contatoCelularObrigatorio = false,
}: CotacaoDetalhesFormProps) {
  const detailsProps = secoesAbertas ? { open: true as const } : {};
  const [cupomBusy, setCupomBusy] = useState(false);
  const [cupomHint, setCupomHint] = useState<string | null>(null);

  const celularOk = contatoCelularObrigatorio
    ? isValidBrazilianPhone(det.celular)
    : det.celular.length === 0 || isValidBrazilianPhone(det.celular);
  const whatsappDigits = det.whatsappIgualCelular
    ? det.celular
    : det.whatsapp;
  const whatsappOk =
    whatsappDigits.length === 0 || isValidBrazilianPhone(whatsappDigits);

  function applyPatch(patch: Partial<CotacaoDetalhes>) {
    const next = { ...det, ...patch };
    if (patch.celular !== undefined && next.whatsappIgualCelular) {
      onPatch({ ...patch, whatsapp: patch.celular });
      return;
    }
    if (patch.whatsappIgualCelular === true) {
      onPatch({ ...patch, whatsapp: det.celular });
      return;
    }
    onPatch(patch);
  }

  function setCelularRaw(value: string) {
    const digits = brPhoneDigits(value);
    applyPatch({ celular: digits });
  }

  function setWhatsappRaw(value: string) {
    applyPatch({ whatsapp: brPhoneDigits(value) });
  }

  function setCriancas(n: number) {
    applyPatch({
      criancas: n,
      idadesCriancas: n === 0 ? "" : det.idadesCriancas,
    });
  }

  function setTrecho(i: number, value: string) {
    const arr = [...det.destinosTrechos];
    arr[i] = value;
    const joined = arr.filter((x) => x.trim()).join(" · ");
    applyPatch({ destinosTrechos: arr, destinoForm: joined });
  }

  function addTrecho() {
    applyPatch({
      destinosTrechos: [...det.destinosTrechos, ""],
    });
  }

  function removeTrecho(i: number) {
    if (det.destinosTrechos.length <= 1) {
      applyPatch({ destinosTrechos: [""], destinoForm: "" });
      return;
    }
    const arr = det.destinosTrechos.filter((_, j) => j !== i);
    const joined = arr.filter((x) => x.trim()).join(" · ");
    applyPatch({ destinosTrechos: arr.length ? arr : [""], destinoForm: joined });
  }

  async function validarCupom() {
    const codigo = det.cupomCodigo.trim();
    setCupomHint(null);
    if (!codigo) {
      setCupomHint("Digite um código.");
      applyPatch({ cupomValidoAte: undefined });
      return;
    }
    setCupomBusy(true);
    try {
      const res = await fetch("/api/public/cupom/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });
      const data = (await res.json()) as {
        valid?: boolean;
        expiresAt?: string;
        message?: string;
      };
      if (!data.valid) {
        setCupomHint(data.message ?? "Cupom inválido.");
        applyPatch({ cupomValidoAte: undefined });
        return;
      }
      const exp = data.expiresAt ? new Date(data.expiresAt) : null;
      if (exp && exp < new Date()) {
        setCupomHint("Este cupom está expirado.");
        applyPatch({ cupomValidoAte: undefined });
        return;
      }
      applyPatch({ cupomValidoAte: data.expiresAt });
      setCupomHint(null);
    } catch {
      setCupomHint("Não foi possível validar agora. Tente de novo.");
      applyPatch({ cupomValidoAte: undefined });
    } finally {
      setCupomBusy(false);
    }
  }

  return (
    <>
      <details
        {...detailsProps}
        className="group border-b border-[var(--hub-border)] py-3"
      >
        <summary className="cursor-pointer text-sm font-semibold text-[var(--hub-blue-dark)]">
          Serviços e roteiro
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <span className="text-xs font-medium uppercase text-slate-500">
              Serviços desejados
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {SERVICOS_DESEJADOS_OPTIONS.map((s) => (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={det.servicosDesejados.includes(s.id)}
                    onChange={() => onToggleServico(s.id)}
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">
            <div>
              <Label htmlFor="cdf-orig">Origem (cidade / aeroporto)</Label>
              <Input
                id="cdf-orig"
                value={det.origem}
                onChange={(e) => applyPatch({ origem: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 xl:col-span-3">
              <Label>Destinos (trechos)</Label>
              <p className="mb-2 text-xs text-slate-500">
                Adicione quantos trechos precisar, ex.: São Paulo — Madri,
                Madri — Lisboa… Esse texto compõe o destino na ficha da
                cotação (abaixo do título), ao juntar os trechos preenchidos.
              </p>
              <div className="space-y-2">
                {det.destinosTrechos.map((trecho, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      id={i === 0 ? "cdf-dest-0" : undefined}
                      placeholder="Origem — Destino"
                      value={trecho}
                      onChange={(e) => setTrecho(i, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="shrink-0 px-2 text-xs"
                      onClick={() => removeTrecho(i)}
                      aria-label="Remover trecho"
                    >
                      −
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  className="text-xs"
                  onClick={addTrecho}
                >
                  + Adicionar trecho
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="cdf-di">Data ida</Label>
              <Input
                id="cdf-di"
                type="date"
                value={det.dataIda}
                onChange={(e) => applyPatch({ dataIda: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="cdf-dv">Data volta</Label>
              <Input
                id="cdf-dv"
                type="date"
                value={det.dataVolta}
                onChange={(e) => applyPatch({ dataVolta: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 xl:col-span-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Flexibilidade ida</Label>
                  <Select
                    value={det.flexibilidadeIda}
                    onChange={(e) =>
                      applyPatch({ flexibilidadeIda: e.target.value })
                    }
                  >
                    {FLEXIBILIDADE_OPTIONS.map((o) => (
                      <option key={o.id || "x"} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                  {det.flexibilidadeIda === "outro" ? (
                    <Input
                      className="mt-2"
                      placeholder="Descreva a flexibilidade desejada"
                      value={det.flexibilidadeIdaOutro}
                      onChange={(e) =>
                        applyPatch({ flexibilidadeIdaOutro: e.target.value })
                      }
                    />
                  ) : null}
                </div>
                <div>
                  <Label>Flexibilidade volta</Label>
                  <Select
                    value={det.flexibilidadeVolta}
                    onChange={(e) =>
                      applyPatch({ flexibilidadeVolta: e.target.value })
                    }
                  >
                    {FLEXIBILIDADE_OPTIONS.map((o) => (
                      <option key={`v-${o.id || "x"}`} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                  {det.flexibilidadeVolta === "outro" ? (
                    <Input
                      className="mt-2"
                      placeholder="Descreva a flexibilidade desejada"
                      value={det.flexibilidadeVoltaOutro}
                      onChange={(e) =>
                        applyPatch({ flexibilidadeVoltaOutro: e.target.value })
                      }
                    />
                  ) : null}
                </div>
              </div>
            </div>
            <div>
              <Label>Horário saída (ida)</Label>
              <Select
                value={det.horarioSaidaIda}
                onChange={(e) =>
                  applyPatch({ horarioSaidaIda: e.target.value })
                }
              >
                {HORARIO_SAIDA_OPTIONS.map((o) => (
                  <option key={o.id || "h"} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Horário saída (volta)</Label>
              <Select
                value={det.horarioSaidaVolta}
                onChange={(e) =>
                  applyPatch({ horarioSaidaVolta: e.target.value })
                }
              >
                {HORARIO_SAIDA_OPTIONS.map((o) => (
                  <option key={`hv-${o.id || "h"}`} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Preferência de voo (ida)</Label>
              <Select
                value={det.preferenciaVooIda}
                onChange={(e) =>
                  applyPatch({ preferenciaVooIda: e.target.value })
                }
              >
                {PREFERENCIA_VOO_OPTIONS.map((o) => (
                  <option key={o.id || "p"} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Preferência de voo (volta)</Label>
              <Select
                value={det.preferenciaVooVolta}
                onChange={(e) =>
                  applyPatch({ preferenciaVooVolta: e.target.value })
                }
              >
                {PREFERENCIA_VOO_OPTIONS.map((o) => (
                  <option key={`pv-${o.id || "p"}`} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </details>

      <details
        {...detailsProps}
        className="border-b border-[var(--hub-border)] py-3"
      >
        <summary className="cursor-pointer text-sm font-semibold text-[var(--hub-blue-dark)]">
          Passageiros e bagagem
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <Label>Adultos (+12)</Label>
            <Input
              type="number"
              min={0}
              value={det.adultos}
              onChange={(e) =>
                applyPatch({ adultos: Number(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <Label>Crianças (2–11)</Label>
            <Input
              type="number"
              min={0}
              value={det.criancas}
              onChange={(e) =>
                setCriancas(Number(e.target.value) || 0)
              }
            />
          </div>
          <div>
            <Label>Bebês</Label>
            <Input
              type="number"
              min={0}
              value={det.bebes}
              onChange={(e) => applyPatch({ bebes: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="sm:col-span-3">
            <Label>Idades das crianças</Label>
            <Input
              disabled={det.criancas === 0}
              value={det.idadesCriancas}
              onChange={(e) => applyPatch({ idadesCriancas: e.target.value })}
              placeholder={
                det.criancas === 0
                  ? "Habilite informando a quantidade de crianças acima"
                  : "Ex.: 5 e 8 anos"
              }
              className={
                det.criancas === 0 ? "opacity-60" : undefined
              }
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-3">
            <input
              type="checkbox"
              id="cdf-mala"
              checked={det.malasDespachadas}
              onChange={(e) =>
                applyPatch({ malasDespachadas: e.target.checked })
              }
            />
            <label htmlFor="cdf-mala" className="text-sm">
              Malas despachadas (23kg)
            </label>
          </div>
          <div className="sm:col-span-3">
            <Label>Quantidade de malas</Label>
            <Input
              value={det.qtdMalas}
              onChange={(e) => applyPatch({ qtdMalas: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-3">
            <input
              type="checkbox"
              id="cdf-besp"
              checked={det.bagagemEspecial}
              onChange={(e) =>
                applyPatch({ bagagemEspecial: e.target.checked })
              }
            />
            <label htmlFor="cdf-besp" className="text-sm">
              Bagagem especial (objeto grande)
            </label>
          </div>
        </div>
      </details>

      <details
        {...detailsProps}
        className="border-b border-[var(--hub-border)] py-3"
      >
        <summary className="cursor-pointer text-sm font-semibold text-[var(--hub-blue-dark)]">
          Hospedagem
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <Label>Categoria</Label>
            <Select
              value={det.categoriaHospedagem}
              onChange={(e) =>
                applyPatch({ categoriaHospedagem: e.target.value })
              }
            >
              {HOSPEDAGEM_CATEGORIA_OPTIONS.map((o) => (
                <option key={o.id || "h"} value={o.id}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">
              Comodidades desejadas
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {COMODIDADES_HOTEL_OPTIONS.map((label) => (
                <label
                  key={label}
                  className="flex cursor-pointer items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={det.comodidadesHospedagem.includes(label)}
                    onChange={() => onToggleComodidade(label)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Qtd. quartos</Label>
            <Input
              type="number"
              min={1}
              value={det.qtdQuartos}
              onChange={(e) =>
                applyPatch({ qtdQuartos: Number(e.target.value) || 1 })
              }
            />
          </div>
        </div>
      </details>

      <details
        {...detailsProps}
        className="border-b border-[var(--hub-border)] py-3"
      >
        <summary className="cursor-pointer text-sm font-semibold text-[var(--hub-blue-dark)]">
          Contato e pagamento
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">
          <div className="sm:col-span-2 xl:col-span-3">
            <Label htmlFor="cdf-cel">
              Celular (Brasil)
              {contatoCelularObrigatorio ? " *" : ""}
            </Label>
            <Input
              id="cdf-cel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="(11) 98765-4321"
              required={contatoCelularObrigatorio}
              value={formatBrPhoneDisplay(det.celular)}
              onChange={(e) => setCelularRaw(e.target.value)}
              aria-invalid={!celularOk}
              className={
                contatoCelularObrigatorio && det.celular.length === 0
                  ? "border-red-400/90"
                  : det.celular.length > 0
                    ? celularOk
                      ? "border-emerald-400/80"
                      : "border-red-400/90"
                    : undefined
              }
            />
            {((contatoCelularObrigatorio && det.celular.length === 0) ||
              (det.celular.length > 0 && !celularOk)) ? (
              <p className="mt-1 text-xs text-red-600">
                {contatoCelularObrigatorio && det.celular.length === 0
                  ? "Informe o celular com DDD."
                  : "Informe DDD + número com 10 ou 11 dígitos (celular com 9)."}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2 sm:col-span-2 xl:col-span-3">
            <input
              id="cdf-wa-same"
              type="checkbox"
              checked={det.whatsappIgualCelular}
              onChange={(e) => {
                const on = e.target.checked;
                if (on) {
                  applyPatch({
                    whatsappIgualCelular: true,
                    whatsapp: det.celular,
                  });
                } else {
                  applyPatch({ whatsappIgualCelular: false });
                }
              }}
            />
            <label htmlFor="cdf-wa-same" className="text-sm">
              WhatsApp é o mesmo número do celular acima
            </label>
          </div>
          <div className="sm:col-span-2 xl:col-span-3">
            <Label htmlFor="cdf-wa">WhatsApp</Label>
            <Input
              id="cdf-wa"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="(11) 98765-4321"
              value={formatBrPhoneDisplay(
                det.whatsappIgualCelular ? det.celular : det.whatsapp,
              )}
              onChange={(e) => setWhatsappRaw(e.target.value)}
              disabled={det.whatsappIgualCelular}
              aria-invalid={!whatsappOk}
              className={
                det.whatsappIgualCelular
                  ? "opacity-70"
                  : whatsappDigits.length > 0
                    ? whatsappOk
                      ? "border-emerald-400/80"
                      : "border-red-400/90"
                    : undefined
              }
            />
            {!det.whatsappIgualCelular && whatsappDigits.length > 0 && !whatsappOk ? (
              <p className="mt-1 text-xs text-red-600">
                Número inválido. Use DDD + celular ou telefone com 10/11 dígitos.
              </p>
            ) : null}
          </div>
          <div className="xl:col-span-1">
            <Label>Preferência de comunicação</Label>
            <Select
              value={det.preferenciaComunicacao}
              onChange={(e) =>
                applyPatch({ preferenciaComunicacao: e.target.value })
              }
            >
              <option value="">—</option>
              {COMUNICACAO_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="xl:col-span-2">
            <Label>Forma de pagamento</Label>
            <Select
              value={det.formaPagamento}
              onChange={(e) => applyPatch({ formaPagamento: e.target.value })}
            >
              <option value="">—</option>
              {PAGAMENTO_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </Select>
            {det.formaPagamento === "outro" ? (
              <Input
                className="mt-2"
                placeholder="Descreva a forma de pagamento"
                value={det.formaPagamentoOutro}
                onChange={(e) =>
                  applyPatch({ formaPagamentoOutro: e.target.value })
                }
              />
            ) : null}
          </div>
          <div className="flex items-center gap-2 sm:col-span-2 xl:col-span-3">
            <input
              type="checkbox"
              id="cdf-milhas"
              checked={det.usaMilhas}
              onChange={(e) => applyPatch({ usaMilhas: e.target.checked })}
            />
            <label htmlFor="cdf-milhas" className="text-sm">
              Usar milhas nas passagens
            </label>
          </div>
        </div>
      </details>

      <details {...detailsProps} className="py-3">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--hub-blue-dark)]">
          Cupom de desconto
        </summary>
        <div className="mt-3 space-y-2">
          <Label htmlFor="cdf-cupom">Código do cupom</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id="cdf-cupom"
              className="max-w-xs"
              value={det.cupomCodigo}
              onChange={(e) => {
                setCupomHint(null);
                applyPatch({
                  cupomCodigo: e.target.value,
                  cupomValidoAte: undefined,
                });
              }}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={cupomBusy}
              onClick={() => void validarCupom()}
            >
              {cupomBusy ? "Validando…" : "Validar cupom"}
            </Button>
          </div>
          {det.cupomValidoAte ? (
            <p className="text-xs text-emerald-700">
              Cupom aceito — validade registrada até{" "}
              {new Date(det.cupomValidoAte).toLocaleDateString("pt-BR")}.
            </p>
          ) : null}
          {cupomHint ? (
            <p className="text-xs text-red-600">{cupomHint}</p>
          ) : null}
        </div>
      </details>
    </>
  );
}
