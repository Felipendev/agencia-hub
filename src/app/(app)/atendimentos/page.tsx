import { redirect } from "next/navigation";

/** Atendimentos foram unificados em cotações; mantém URL antiga útil. */
export default function AtendimentosRedirectPage() {
  redirect("/cotacoes");
}
