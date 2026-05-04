export function Card({
  children,
  className = "",
  padding = "p-6",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-[var(--hub-border)] bg-white shadow-[0_1px_3px_rgba(15,52,96,0.06)] ${padding} ${className}`}
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
    <h2
      className={`text-base font-semibold text-[var(--hub-blue-dark)] ${className}`}
    >
      {children}
    </h2>
  );
}
