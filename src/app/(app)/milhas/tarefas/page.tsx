import { Suspense } from "react";
import { WorkBoard } from "@/components/work/work-board";
export default function MilesWorkPage() {
  return (
    <Suspense fallback={<p>Carregando tarefas…</p>}>
      <WorkBoard product="MILES" />
    </Suspense>
  );
}
