"use client";

interface PasswordStrengthIndicatorProps {
  password: string;
}

function getStrength(password: string): { level: "weak" | "medium" | "strong"; score: number } {
  if (!password) return { level: "weak", score: 0 };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { level: "weak", score: 1 };
  if (score <= 3) return { level: "medium", score: 2 };
  return { level: "strong", score: 3 };
}

const colors: Record<string, string> = {
  weak: "bg-red-500",
  medium: "bg-yellow-500",
  strong: "bg-green-500",
};

const labels: Record<string, string> = {
  weak: "Fraca",
  medium: "Média",
  strong: "Forte",
};

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const { level, score } = getStrength(password);

  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= score ? colors[level] : "bg-[var(--hub-border)]"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--hub-text-muted)]">Mínimo 8 caracteres</span>
        {password.length > 0 && (
          <span className="text-xs text-[var(--hub-text-muted)]">{labels[level]}</span>
        )}
      </div>
    </div>
  );
}
