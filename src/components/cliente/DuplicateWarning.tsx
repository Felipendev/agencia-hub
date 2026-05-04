import Link from "next/link";
import type { Cliente } from "@/types";

type Props = {
  matches: Cliente[];
  /** "block" impede salvar; "warn" só avisa */
  mode?: "block" | "warn";
};

export function DuplicateWarning({ matches, mode = "warn" }: Props) {
  if (matches.length === 0) return null;

  const isBlock = mode === "block";

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${
        isBlock
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-amber-200 bg-amber-50 text-amber-900"
      }`}
    >
      <p className="font-semibold">
        {isBlock ? "⛔ Cliente já cadastrado" : "⚠️ Possível duplicidade"}
      </p>
      <p className="mt-0.5 text-xs">
        {matches.length === 1
          ? "Já existe um cliente com o mesmo e-mail ou telefone:"
          : `Já existem ${matches.length} clientes com o mesmo e-mail ou telefone:`}
      </p>
      <ul className="mt-2 space-y-1">
        {matches.map((c) => (
          <li key={c.id} className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/70 text-xs font-bold">
              {c.nome.charAt(0).toUpperCase()}
            </span>
            <Link
              href={`/clientes/${c.id}`}
              target="_blank"
              className="font-medium underline hover:opacity-80"
            >
              {c.nome}
            </Link>
            <span className="text-xs opacity-70">
              {c.email || c.telefone}
            </span>
          </li>
        ))}
      </ul>
      {!isBlock && (
        <p className="mt-2 text-xs opacity-80">
          Verifique se não é o mesmo cliente antes de continuar.
        </p>
      )}
    </div>
  );
}
