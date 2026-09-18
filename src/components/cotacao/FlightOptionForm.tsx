"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { centsToDisplay, parseCurrencyInput } from "@/lib/currency-input";
import { emptySegment, calculateFlight, type FlightDraft, type FlightSegment } from "@/lib/flight-plan";
import { fmtBRL } from "@/lib/calculadora-milhas";
import type { TabelasMilhas } from "@/lib/tabelas-milhas";
import { getValorMilheiro } from "@/lib/tabelas-milhas";

function Money({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return <label className="block text-sm">{label}<CurrencyInput value={value ? centsToDisplay(value) : ""} onValueChange={(text) => onChange(parseCurrencyInput(text))} /></label>;
}
export function FlightOptionForm({ option: o, tables, principal, showValidationErrors, onPrincipal, onChange, onRemove }: {
  option: FlightDraft; tables: TabelasMilhas; principal: boolean; onPrincipal: () => void;
  showValidationErrors?: boolean;
  onChange: (o: FlightDraft) => void; onRemove: () => void;
}) {
  const set = (patch: Partial<FlightDraft>) => onChange({ ...o, ...patch, calculo: { ...(patch.calculo ?? o.calculo), revisado: false } });
  const calc = (patch: Partial<FlightDraft["calculo"]>) => set({ calculo: { ...o.calculo, ...patch } });
  const segment = (index: number, patch: Partial<FlightSegment>) => set({ segmentos: o.segmentos.map((s, i) => i === index ? { ...s, ...patch } : s) });
  const duration = (index: number, hoursText: string, minutesText: string) => {
    if (hoursText === "" && minutesText === "") { segment(index, { durationMinutes: null }); return; }
    const hours = Number(hoursText || 0);
    const minutes = Number(minutesText || 0);
    segment(index, { durationMinutes: Number.isInteger(hours) && Number.isInteger(minutes) ? hours * 60 + minutes : Number.NaN });
  };
  const hasInvalidDuration = (segment: FlightSegment) => segment.durationMinutes != null
    && (!Number.isInteger(segment.durationMinutes) || segment.durationMinutes < 1 || segment.durationMinutes > 10_080);
  const selectedCia = tables.cias.find((cia) => cia.nome === o.cia);
  const savedMilheiro = selectedCia ? getValorMilheiro(selectedCia, o.calculo.milhasIda + o.calculo.milhasVolta) : null;
  const result = calculateFlight(o);
  return <section className="space-y-4 rounded-xl border border-[var(--hub-border)] bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={o.incluir} onChange={(e) => set({ incluir: e.target.checked })} />Incluir na cotação</label>
      <label className={`flex items-start gap-2 text-sm ${showValidationErrors && o.incluir && !principal ? "text-red-700" : ""}`}>
        <input id={`opcao-principal-${o.id}`} type="radio" name="opcao-principal" checked={principal} disabled={!o.incluir} onChange={onPrincipal} />
        <span>Opção principal da cotação <span className="text-red-500">*</span><span className="mt-0.5 block text-xs font-normal text-[var(--hub-text-muted)]">Define o valor total desta cotação. As outras opções são alternativas e não são somadas.</span></span>
      </label>
      <button type="button" onClick={onRemove} className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium !text-red-700 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-red-600">Remover opção</button>
    </div>
    {o.avisos.length > 0 && <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{o.avisos.map((a, i) => <p key={i}>{a}</p>)}</div>}
    {o.baseFonte && <p className="text-sm text-[var(--hub-text-secondary)]">Fonte: {o.fonteMilhas?.toLocaleString("pt-BR") ?? "milhas não identificadas"} milhas + {o.fonteDinheiro == null ? "parcela em dinheiro não identificada" : fmtBRL(o.fonteDinheiro)}.
      {o.baseFonte === "PER_PERSON" ? " Valores por pessoa; confira se já incluem taxas." : " Base por grupo ou não identificada: preencha abaixo os valores por pessoa, sem dividir categorias de passageiros diferentes automaticamente."}</p>}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-sm">Nome da opção <span className="text-red-500">*</span><Input id={`nome-opcao-${o.id}`} aria-invalid={showValidationErrors && !o.nome.trim()} className={showValidationErrors && !o.nome.trim() ? "border-red-500" : undefined} value={o.nome} maxLength={150} onChange={(e) => set({ nome: e.target.value })} />{showValidationErrors && !o.nome.trim() && <p className="mt-1 text-xs text-red-600">Nome da opção é obrigatório.</p>}</label>
      <div className="text-sm"><label htmlFor={`cia-${o.id}`}>Companhia</label><Select id={`cia-${o.id}`} value={o.cia} onChange={(e) => {
        const cia = tables.cias.find((c) => c.nome === e.target.value);
        set({ cia: e.target.value, corCia: cia?.cor, calculo: { ...o.calculo, custoPorMilheiro: cia ? getValorMilheiro(cia, o.calculo.milhasIda + o.calculo.milhasVolta) : 0 } });
      }}><option value="">Selecione a companhia</option>{o.cia && !tables.cias.some((c) => c.nome === o.cia) && <option value={o.cia}>{o.cia}</option>}{tables.cias.map((c) => <option key={c.id} value={c.nome}>{c.nome}</option>)}</Select>{selectedCia ? <button type="button" className="mt-1 text-xs font-medium text-[var(--hub-blue)] underline" onClick={() => calc({ custoPorMilheiro: savedMilheiro! })}>Usar valor salvo: {fmtBRL(savedMilheiro!)} / 1.000 milhas</button> : null}</div>
      <label className="text-sm">Passageiros com o mesmo preço <span className="text-red-500">*</span><Input aria-invalid={showValidationErrors && (!Number.isInteger(o.qtdPessoas) || o.qtdPessoas < 1 || o.qtdPessoas > 20)} className={showValidationErrors && (!Number.isInteger(o.qtdPessoas) || o.qtdPessoas < 1 || o.qtdPessoas > 20) ? "border-red-500" : undefined} type="number" min={1} max={20} value={o.qtdPessoas} onChange={(e) => set({ qtdPessoas: Number(e.target.value) })} />{showValidationErrors && (!Number.isInteger(o.qtdPessoas) || o.qtdPessoas < 1 || o.qtdPessoas > 20) && <p className="mt-1 text-xs text-red-600">Informe de 1 a 20 passageiros.</p>}</label>
    </div>
    <p className="text-sm text-[var(--hub-text-secondary)]">Milhas e dados do voo são opcionais. Para uma passagem sem milhas, preencha o valor em dinheiro. O custo do milheiro só é necessário quando há milhas.</p>
    <p className="text-xs text-[var(--hub-text-muted)]">Se adulto, criança ou bebê tiver preços diferentes, revise a composição antes de usar esta opção.</p>
    {o.segmentos.map((s, index) => <fieldset key={index} className="rounded-lg border border-[var(--hub-border)] p-3">
      <legend className="px-1 text-sm font-semibold">Trecho {index + 1}</legend>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">Origem<Input value={s.origin ?? ""} maxLength={100} onChange={(e) => segment(index, { origin: e.target.value.toUpperCase() })} /></label>
        <label className="text-sm">Destino<Input value={s.destination ?? ""} maxLength={100} onChange={(e) => segment(index, { destination: e.target.value.toUpperCase() })} /></label>
        <label className="text-sm">Data de saída<Input type="date" value={s.departureDate ?? ""} onChange={(e) => segment(index, { departureDate: e.target.value })} /></label>
        <label className="text-sm">Data de chegada<Input type="date" value={s.arrivalDate ?? ""} onChange={(e) => segment(index, { arrivalDate: e.target.value })} /></label>
        <label className="text-sm">Horário de saída<Input type="time" value={s.departureTime ?? ""} onChange={(e) => segment(index, { departureTime: e.target.value })} /></label>
        <label className="text-sm">Horário de chegada<Input type="time" value={s.arrivalTime ?? ""} onChange={(e) => segment(index, { arrivalTime: e.target.value })} /></label>
        <div className="text-sm"><span>Duração</span><div className="mt-1 grid grid-cols-2 gap-2"><label className="text-xs text-[var(--hub-text-muted)]">Horas<Input className={showValidationErrors && hasInvalidDuration(s) ? "border-red-500" : ""} type="number" min={0} max={168} placeholder="5" value={s.durationMinutes == null ? "" : Math.floor(s.durationMinutes / 60)} onChange={(e) => duration(index, e.target.value, s.durationMinutes == null ? "" : String(s.durationMinutes % 60))} /></label><label className="text-xs text-[var(--hub-text-muted)]">Minutos<Input className={showValidationErrors && hasInvalidDuration(s) ? "border-red-500" : ""} type="number" min={0} max={59} placeholder="55" value={s.durationMinutes == null ? "" : s.durationMinutes % 60} onChange={(e) => duration(index, s.durationMinutes == null ? "" : String(Math.floor(s.durationMinutes / 60)), e.target.value)} /></label></div><p className="mt-1 text-xs text-[var(--hub-text-muted)]">Opcional. Ex.: 5 h 55 min.</p>{showValidationErrors && hasInvalidDuration(s) ? <p className="mt-1 text-xs text-red-600" role="alert">Informe uma duração entre 1 minuto e 168 horas.</p> : null}</div>
        <label className="text-sm">Paradas<Input type="number" min={0} max={20} placeholder="0 = direto" value={s.stops ?? ""} onChange={(e) => segment(index, { stops: e.target.value === "" ? null : Number(e.target.value) })} /></label>
      </div>
      {o.segmentos.length > 1 && <button type="button" className="mt-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium !text-red-700 hover:bg-red-100" onClick={() => set({ segmentos: o.segmentos.filter((_, i) => i !== index) })}>Remover trecho</button>}
    </fieldset>)}
    {o.segmentos.length < 8 && <button type="button" className="text-sm text-[var(--hub-blue)]" onClick={() => set({ segmentos: [...o.segmentos, emptySegment()] })}>+ Adicionar trecho de volta ou conexão</button>}
    <div className="grid gap-3 border-t border-[var(--hub-border)] pt-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-sm">Base das milhas<Select value={o.calculo.tipo} onChange={(e) => calc({ tipo: e.target.value as FlightDraft["calculo"]["tipo"] })}><option value="so_ida">Só ida</option><option value="ida_volta">Ida e volta separadas</option><option value="preco_unico">Total de todos os trechos</option></Select></label>
      <label className="text-sm">{o.calculo.tipo === "preco_unico" ? "Milhas totais por pessoa" : "Milhas de ida por pessoa"}<Input type="number" min={0} step={1} value={o.calculo.milhasIda || ""} onChange={(e) => calc({ milhasIda: Number(e.target.value) })} /></label>
      {o.calculo.tipo === "ida_volta" && <label className="text-sm">Milhas de volta por pessoa<Input type="number" min={0} step={1} value={o.calculo.milhasVolta || ""} onChange={(e) => calc({ milhasVolta: Number(e.target.value) })} /></label>}
      <Money label="Custo de 1.000 milhas (R$)" value={o.calculo.custoPorMilheiro} onChange={(n) => calc({ custoPorMilheiro: n })} />
      <Money label="Passagem em dinheiro / taxas por pessoa (R$)" value={o.calculo.taxas} onChange={(n) => calc({ taxas: n })} />
      <Money label="Taxas adicionais por pessoa (R$)" value={o.calculo.taxasAdicionais} onChange={(n) => calc({ taxasAdicionais: n })} />
      <Money label="Preço de cada mala (R$)" value={o.calculo.valorMala} onChange={(n) => calc({ valorMala: n })} />
      <label className="text-sm">Quantidade de malas do grupo<Input type="number" min={0} max={100} value={o.calculo.qtdMalas} onChange={(e) => calc({ qtdMalas: Number(e.target.value) })} /></label>
      <div><label className="text-sm"><input type="checkbox" checked={o.calculo.lucroConfig.usarPct} onChange={(e) => calc({ lucroConfig: { ...o.calculo.lucroConfig, usarPct: e.target.checked } })} /> Lucro % sobre custo + taxas</label><Input aria-label="Percentual de lucro" type="number" min={0} max={1000} step="0.01" value={o.calculo.lucroConfig.pct} onChange={(e) => calc({ lucroConfig: { ...o.calculo.lucroConfig, pct: Number(e.target.value) } })} /></div>
      <div><label className="text-sm"><input type="checkbox" checked={o.calculo.lucroConfig.usarFixo} onChange={(e) => calc({ lucroConfig: { ...o.calculo.lucroConfig, usarFixo: e.target.checked } })} /> Adicionar lucro fixo</label><Money label="Lucro fixo por pessoa (R$)" value={o.calculo.lucroConfig.fixo} onChange={(n) => calc({ lucroConfig: { ...o.calculo.lucroConfig, fixo: n } })} /></div>
    </div>
    <div className="rounded-lg bg-[var(--hub-bg-subtle)] p-3 text-sm">
      <p>Custo por pessoa: {fmtBRL(result.calculo.basePorPessoa ?? 0)} · Lucro por pessoa: {fmtBRL(result.calculo.lucroPorPessoa ?? 0)}</p>
      <p className="mt-1 font-semibold">Preço final do grupo: {fmtBRL(result.precoTotal)} (inclui {fmtBRL(result.precoBagagens)} de bagagens)</p>
      <p className="mt-1 text-xs">Milhas, custos, taxas internas e lucro ficam somente na agência.</p>
    </div>
    <label className={`flex items-start gap-2 text-sm ${showValidationErrors && !o.calculo.revisado ? "text-red-700" : ""}`}><input className="mt-1" aria-invalid={showValidationErrors && !o.calculo.revisado} type="checkbox" checked={o.calculo.revisado} onChange={(e) => onChange({ ...o, calculo: { ...o.calculo, revisado: e.target.checked } })} /><span>Conferi os dados preenchidos e o preço <span className="text-red-500">*</span>. Campos vazios aparecerão como não informados para o cliente.{showValidationErrors && !o.calculo.revisado && <span className="mt-1 block text-xs text-red-600">Confirme a revisão dos dados e do preço.</span>}</span></label>
  </section>;
}
