import { Suspense } from "react";
import { WorkBoard } from "@/components/work/work-board";
export default function TravelWorkPage() {
  return (
    <Suspense fallback={<p>Carregando tarefas…</p>}>
      <WorkBoard product="TRAVEL" />
    </Suspense>
  );
}
