import type { Cliente } from "@/types";

export const PESSOA_TIPOS = [
  { key: "tipoCliente", label: "Cliente", avatar: "bg-sky-700 ring-sky-200" },
  { key: "tipoPassageiro", label: "Passageiro", avatar: "bg-teal-700 ring-teal-200" },
  { key: "tipoFornecedor", label: "Fornecedor", avatar: "bg-amber-800 ring-amber-200" },
  { key: "tipoRepresentante", label: "Representante", avatar: "bg-indigo-700 ring-indigo-200" },
] as const;

export function pessoaPresentation(pessoa: Partial<Cliente>) {
  const tipos = PESSOA_TIPOS.filter((tipo) => pessoa[tipo.key]);
  // Legacy records predate the role switches and were all customer records.
  const roles = tipos.length ? tipos : [PESSOA_TIPOS[0]];
  return {
    label: roles.map((tipo) => tipo.label).join(" · "),
    avatar: roles.length > 1 ? "bg-slate-700 ring-slate-200" : roles[0].avatar,
  };
}
