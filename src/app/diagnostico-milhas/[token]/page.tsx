import { PublicDiagnostic } from "@/components/milhas/public-diagnostic";
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PublicDiagnostic id={token} />;
}
