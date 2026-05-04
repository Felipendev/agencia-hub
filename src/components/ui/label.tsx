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
      className={`mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-600 ${className}`}
    >
      {children}
    </label>
  );
}
