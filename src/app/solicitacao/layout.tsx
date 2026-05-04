import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solicitação de orçamento — AgenciaHub",
  description:
    "Formulário público de solicitação de cotação para sua viagem.",
};

export default function SolicitacaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
