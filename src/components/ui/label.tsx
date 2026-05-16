export function Label({
  children,
  htmlFor,
  className = "",
}: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`mb-1.5 block text-xs font-medium text-[var(--hub-text-secondary)] ${className}`}
    >
      {children}
    </label>
  );
}
