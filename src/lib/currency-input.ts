/**
 * Padrão único de campo de valor em R$ usado no app inteiro: o usuário digita só
 * dígitos e eles viram centavos automaticamente (ex.: "150000" → "1.500,00"),
 * igual ao campo "Valor total vendido" em Vendas/Receitas.
 *
 * As duas funções sempre andam juntas — formatar com separador de milhar exige
 * removê-lo de volta antes de converter para número, senão "1.234,56" vira 1.234
 * (o `.` é lido como ponto decimal). Nunca use `parseFloat(str.replace(",", "."))`
 * num valor que passou por `formatCurrencyInput`.
 */

/** Digitação → texto formatado ("2500" → "25,00", "150000" → "1.500,00"). */
export function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  return (Number(digits) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Texto formatado → número ("1.500,00" → 1500). Único parser seguro para o texto acima. */
export function parseCurrencyInput(value: string): number {
  if (!value) return 0;
  return Number(value.replace(/\./g, "").replace(",", ".")) || 0;
}

/** Número → texto formatado, para preencher um campo a partir de um valor vindo da API. */
export function centsToDisplay(amount: number): string {
  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
