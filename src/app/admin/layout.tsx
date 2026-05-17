"use client";

import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady && user?.accountKind !== "PLATFORM_ADMIN") {
      router.replace("/login");
    }
  }, [isReady, user, router]);

  if (!isReady || user?.accountKind !== "PLATFORM_ADMIN") return null;

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen" style={{ background: "#0f172a" }}>
      {/* Top nav */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo variant="dark" size="sm" href={null} />
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60 font-medium">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/50">{user.email}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-white/60 hover:text-white transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
