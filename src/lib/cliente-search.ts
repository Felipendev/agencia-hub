import type { Cliente } from "@/types";

/** Mínimo de caracteres para filtrar clientes no picker (evita listas enormes). */
export const CLIENTE_SEARCH_MIN_CHARS = 1;

const DEFAULT_LIMIT = 40;

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function filterClientesForPicker(
  clientes: Cliente[],
  query: string,
  limit = DEFAULT_LIMIT,
): Cliente[] {
  const q = normalize(query.trim());
  // Ao abrir o campo, oferecemos uma lista inicial para que o usuário consiga
  // vincular uma pessoa já cadastrada sem precisar adivinhar dois caracteres.
  if (!q) return [...clientes].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")).slice(0, limit);
  if (q.length < CLIENTE_SEARCH_MIN_CHARS) return [];
  const digits = q.replace(/\D/g, "");
  return clientes
    .filter((c) => {
      if (normalize(c.nome).includes(q)) return true;
      if (normalize(c.email).includes(q)) return true;
      if (digits.length >= CLIENTE_SEARCH_MIN_CHARS && c.telefone.replace(/\D/g, "").includes(digits)) {
        return true;
      }
      return false;
    })
    .slice(0, limit);
}
