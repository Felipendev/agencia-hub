/** Máscara e validação de celular/telefone brasileiro (DDD + número). */

const MAX_DIGITS_BR = 11;

/** Extrai apenas dígitos, limitando ao tamanho de um número BR nacional. */
export function brPhoneDigits(input: string): string {
  return input.replace(/\D/g, "").slice(0, MAX_DIGITS_BR);
}

/**
 * Formata enquanto digita: (AA) NNNNN-NNNN ou (AA) NNNN-NNNN (10 dígitos).
 * Celular com 9 na posição inicial após DDD usa bloco 5+4.
 */
export function formatBrPhoneDisplay(digits: string): string {
  const d = brPhoneDigits(digits);
  if (d.length === 0) return "";
  const ddd = d.slice(0, 2);
  if (d.length <= 2) return `(${ddd}`;
  const rest = d.slice(2);
  if (d.length <= 6) return `(${ddd}) ${rest}`;
  if (d.length === 11) {
    if (rest.length <= 5) return `(${ddd}) ${rest}`;
    return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
  }
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4, 8)}`;
}

/** DDD plausível (11–99; regra simples para UI). */
function isPlausibleDdd(ddd: string): boolean {
  const n = Number(ddd);
  return n >= 11 && n <= 99;
}

/**
 * Valida número brasileiro: 10 dígitos (fixo) ou 11 (celular com 9).
 */
export function isValidBrazilianPhone(digits: string): boolean {
  const d = brPhoneDigits(digits);
  if (d.length !== 10 && d.length !== 11) return false;
  if (!isPlausibleDdd(d.slice(0, 2))) return false;
  if (d.length === 11) {
    return d[2] === "9";
  }
  return true;
}
