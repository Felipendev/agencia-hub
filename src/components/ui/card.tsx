export function Card({
  children,
  className = "",
  padding = "p-5",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}) {
  return (
    <div
      className={`rounded-[var(--hub-radius-lg)] border border-[var(--hub-border)] bg-white shadow-[var(--hub-shadow-sm)] ${padding} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`text-sm font-semibold text-[var(--hub-text-primary)] ${className}`}>
      {children}
    </h2>
  );
}

export function CardDescription({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`mt-0.5 text-xs text-[var(--hub-text-muted)] ${className}`}>
      {children}
    </p>
  );
}
