"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/authenticated-fetch";
import type { WalletItem, WalletView } from "@/lib/miles-wallet";
import type { AccumulationAssumptions } from "@/lib/accumulation-simulation";

type CardValues = Pick<AccumulationAssumptions, "monthlySpending" | "pointsPerDollar">;
type Props = { token: string | null; customerId: string; onApply: (values: CardValues) => void };
const number = (value: unknown, max: number): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max;

function values(card: WalletItem): CardValues | null {
  const { monthlySpend, pointsPerDollar } = card.data;
  return number(monthlySpend, 10000000) && number(pointsPerDollar, 100)
    ? { monthlySpending: monthlySpend, pointsPerDollar } : null;
}

/** Keyed boundary: a new person/session cannot see or apply a previous person's cards. */
export function SimulationWalletCard(props: Props) {
  return <CardPicker key={`${props.token}:${props.customerId}`} {...props} />;
}

function CardPicker({ token, customerId, onApply }: Props) {
  const [view, setView] = useState<WalletView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState("");
  const [applied, setApplied] = useState("");
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  if (!token || !customerId) return null;
  const cards = view?.profile?.archived ? [] : (view?.items ?? []).filter((item) => item.kind === "CARD" && !item.archived);
  const card = cards.find((item) => item.id === selected);
  const patch = card ? values(card) : null;

  async function load() {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true); setError(""); setSelected(""); setApplied(""); setView(null);
    try {
      const data = await apiFetch<WalletView>(`/customers/${encodeURIComponent(customerId)}/miles-wallet`, { signal: controller.signal }, token);
      if (!controller.signal.aborted) setView(data);
    } catch {
      if (!controller.signal.aborted) setError("Não foi possível consultar os cartões. O cálculo manual continua disponível.");
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  return <section aria-label="Cartões da carteira no simulador" className="space-y-3 border-y border-[var(--hub-border)] py-4 text-sm">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h3 className="font-semibold">Usar um cartão da carteira</h3>
        <p className="text-[var(--hub-text-muted)]">Opcional. Copia apenas gasto mensal e pontos por dólar. Confira o câmbio e a data no cálculo.</p></div>
      <Button variant="secondary" disabled={busy} onClick={load}>{busy ? "Consultando cartões…" : view ? "Atualizar cartões" : error ? "Tentar consultar cartões" : "Consultar cartões da carteira"}</Button>
    </div>
    {busy && <p role="status">Consultando a carteira desta pessoa…</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {view && (view.profile?.archived ? <p>O perfil de milhas está arquivado. Reative-o na carteira para usar seus cartões.</p> : cards.length === 0 ? <p>Nenhum cartão ativo nesta carteira. Você pode continuar preenchendo o cálculo manualmente.</p> : <>
      <label className="block space-y-1">Cartão desta pessoa
        <select className="block w-full min-w-0 rounded-lg border border-[var(--hub-border)] bg-white p-2" value={selected} onChange={(e) => { setSelected(e.target.value); setApplied(""); }}>
          <option value="">Selecione para conferir os valores</option>
          {cards.map((item) => <option key={item.id} value={item.id}>{item.data.issuer} · {item.data.category}</option>)}
        </select>
      </label>
      {card && <div className="space-y-2">
        {patch ? <p>Gasto mensal: {patch.monthlySpending.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} · Pontos por dólar: {patch.pointsPerDollar.toLocaleString("pt-BR", { maximumFractionDigits: 4 })}</p> : <p>Informe gasto mensal e pontos por dólar válidos no cadastro deste cartão antes de usá-lo. Campos ausentes não são considerados zero.</p>}
        <Button disabled={!patch} onClick={() => { if (patch) { onApply(patch); setApplied("Valores copiados para o formulário. Você pode ajustá-los; salve o plano para persistir as alterações."); } }}>Usar no cálculo</Button>
      </div>}
    </>)}
    {view && <Link className="inline-block underline" href={`/milhas/clientes/${encodeURIComponent(customerId)}`}>Consultar ou editar a carteira</Link>}
    {applied && <p role="status">{applied}</p>}
  </section>;
}
