export function Label({
  children,
  htmlFor,
  required = false,
  className = "",
}: {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`mb-1.5 block text-xs font-medium text-[var(--hub-text-secondary)] ${className}`}
    >
      {children}
      {required && <span aria-hidden="true" className="text-red-600"> *</span>}
    </label>
  );
}
