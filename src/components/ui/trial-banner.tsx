"use client";

interface TrialBannerProps {
  trialEndsAt: string | null;
  status: string;
}

function getDaysRemaining(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function TrialBanner({ trialEndsAt, status }: TrialBannerProps) {
  if (status !== "TRIAL") return null;

  const daysRemaining = getDaysRemaining(trialEndsAt);
  if (daysRemaining === null) return null;

  const isWarning = daysRemaining <= 3;

  return (
    <div
      className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium ${
        isWarning
          ? "bg-red-100 text-red-800 border-b border-red-200"
          : "bg-amber-100 text-amber-800 border-b border-amber-200"
      }`}
      role="alert"
    >
      <svg
        className="h-4 w-4 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
      <span>
        {daysRemaining === 0
          ? "Seu período de teste expira hoje"
          : `${daysRemaining} ${daysRemaining === 1 ? "dia restante" : "dias restantes"} no período de teste`}
      </span>
    </div>
  );
}
