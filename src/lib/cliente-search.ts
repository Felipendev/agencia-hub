import type { Cliente } from "@/types";

/** Mínimo de caracteres para filtrar clientes no picker (evita listas enormes). */
export const CLIENTE_SEARCH_MIN_CHARS = 2;

const DEFAULT_LIMIT = 40;

export function filterClientesForPicker(
  clientes: Cliente[],
  query: string,
  limit = DEFAULT_LIMIT,
): Cliente[] {
  const q = query.trim().toLowerCase();
  if (q.length < CLIENTE_SEARCH_MIN_CHARS) return [];
  const digits = q.replace(/\D/g, "");
  return clientes
    .filter((c) => {
      if (c.nome.toLowerCase().includes(q)) return true;
      if (c.email.toLowerCase().includes(q)) return true;
      if (digits.length >= 2 && c.telefone.replace(/\D/g, "").includes(digits)) {
        return true;
      }
      return false;
    })
    .slice(0, limit);
}
