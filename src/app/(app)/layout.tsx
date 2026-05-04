import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function AppAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
