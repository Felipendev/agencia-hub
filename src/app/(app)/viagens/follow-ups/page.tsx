import { Suspense } from "react";
import { FollowupBoard } from "@/components/followups/followup-board";
export default function Page() { return <Suspense fallback={<p>Carregando acompanhamento…</p>}><FollowupBoard product="TRAVEL" /></Suspense>; }
