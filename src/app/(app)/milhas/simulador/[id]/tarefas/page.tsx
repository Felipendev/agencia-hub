import { SimulationTasks } from "@/components/milhas/simulation-tasks";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SimulationTasks id={id} />;
}
