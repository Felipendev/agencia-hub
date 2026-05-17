import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B1B2B] px-4">
      <div className="w-full max-w-md text-center">
        {/* 404 */}
        <p className="text-7xl font-bold text-white/10">404</p>

        <h1 className="mt-4 text-2xl font-bold text-white">
          Página não encontrada
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          A página que você está procurando não existe ou foi movida.
        </p>

        <div className="mt-8 flex justify-center">
          <Link href="/">
            <Button>Voltar ao início</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
