export type BonusScenario = { program: string; bonusPercent: number };
export type AccumulationAssumptions = {
  title: string; monthlySpending: number; pointsPerDollar: number; exchangeRate: number;
  exchangeDate: string; months: number; passengers: number; milesPerPassenger: number;
  destination: string; scenarios: BonusScenario[];
};
export type AccumulationResult = {
  monthlyPoints: number; basePoints: number; goalMiles: number;
  scenarios: { program: string; bonusPercent: number; projectedMiles: number; remainingMiles: number; goalReached: boolean }[];
};
export type SavedSimulation = { id: string; assumptions: AccumulationAssumptions; result: AccumulationResult; createdAt: string; updatedAt: string; version: number };
export type SimulationVersion = { version: number; assumptions: AccumulationAssumptions; result: AccumulationResult; author: string; recordedAt: string };

export function calculateAccumulation(input: AccumulationAssumptions): AccumulationResult | null {
  if (!Number.isFinite(input.monthlySpending) || input.monthlySpending < 0 || input.monthlySpending > 10_000_000 ||
      !Number.isFinite(input.pointsPerDollar) || input.pointsPerDollar < 0 || input.pointsPerDollar > 100 ||
      !Number.isFinite(input.exchangeRate) || input.exchangeRate < 0.01 || input.exchangeRate > 1_000_000 ||
      !Number.isInteger(input.months) || input.months < 1 || input.months > 120 ||
      !Number.isInteger(input.passengers) || input.passengers < 1 || input.passengers > 99 ||
      !Number.isInteger(input.milesPerPassenger) || input.milesPerPassenger < 1 || input.milesPerPassenger > 1_000_000_000 ||
      input.scenarios.length > 10 || input.scenarios.some(s => !s.program.trim() || !Number.isFinite(s.bonusPercent) || s.bonusPercent < 0 || s.bonusPercent > 1000)) return null;
  const rawMonthly = input.monthlySpending * input.pointsPerDollar / input.exchangeRate;
  // Correct tiny floating point errors near an integer, without rounding fractional points up.
  const floor = (value: number) => Math.floor(value + Math.min(0.000001, Number.EPSILON * Math.abs(value) * 2));
  const basePoints = floor(rawMonthly * input.months);
  const goalMiles = input.passengers * input.milesPerPassenger;
  return { monthlyPoints: Math.round(rawMonthly * 100) / 100, basePoints, goalMiles,
    scenarios: input.scenarios.map(s => {
      const projectedMiles = floor(basePoints * (1 + s.bonusPercent / 100));
      return { ...s, projectedMiles, remainingMiles: Math.max(0, goalMiles - projectedMiles), goalReached: projectedMiles >= goalMiles };
    }) };
}

export function accumulationReport(input: AccumulationAssumptions, result: AccumulationResult): string {
  const escape = (text: string | number) => String(text).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
  const amount = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  return `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>${escape(input.title)}</title><style>body{font:16px system-ui;max-width:900px;margin:40px auto;padding:20px;color:#152333}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ccd4dd;padding:10px;text-align:left}small{display:block;margin-top:24px}</style><h1>${escape(input.title)}</h1><p>Simulação de acúmulo — ${escape(input.destination)}</p><p>Gasto mensal: R$ ${amount(input.monthlySpending)} · Pontuação: ${amount(input.pointsPerDollar)} por dólar · Câmbio informado: R$ ${amount(input.exchangeRate)} em ${escape(input.exchangeDate)}</p><p>Prazo: ${input.months} meses · Passageiros: ${input.passengers} · Meta por passageiro: ${amount(input.milesPerPassenger)} milhas</p><p>Pontos mensais estimados: ${amount(result.monthlyPoints)} · Pontos no período: ${amount(result.basePoints)} · Meta do grupo: ${amount(result.goalMiles)}</p><table><thead><tr><th>Programa</th><th>Bônus hipotético</th><th>Milhas projetadas</th><th>Meta</th></tr></thead><tbody>${result.scenarios.map(s => `<tr><td>${escape(s.program)}</td><td>${amount(s.bonusPercent)}%</td><td>${amount(s.projectedMiles)}</td><td>${s.goalReached ? "Alcançada no cenário" : `${amount(s.remainingMiles)} milhas restantes`}</td></tr>`).join("")}</tbody></table><small>Projeção baseada nas premissas informadas. Os cenários são alternativas e não devem ser somados. Não representam saldo real, bônus garantido ou disponibilidade de passagens. Considere regras de transferência, elegibilidade e validade de cada programa. Relatório preparado em ${new Date().toISOString().slice(0, 10)}. Nenhum saldo foi alterado.</small></html>`;
}
