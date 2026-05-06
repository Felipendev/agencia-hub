"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a1628] px-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
          <svg
            className="h-10 w-10 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-white">
          Algo deu errado
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          Ocorreu um erro inesperado. Nossa equipe já foi notificada.
          Tente novamente ou volte para a página inicial.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} className="w-full sm:w-auto">
            Tentar novamente
          </Button>
          <Link href="/">
            <button
              type="button"
              className="w-full rounded-lg border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10 sm:w-auto"
            >
              Voltar ao início
            </button>
          </Link>
        </div>

        <p className="mt-8 text-xs text-white/30">
          Se o problema persistir, entre em contato:{" "}
          <a
            href="mailto:suporte@agenciashub.com.br"
            className="text-white/50 hover:text-white/70 underline"
          >
            suporte@agenciashub.com.br
          </a>
        </p>
      </div>
    </div>
  );
}
