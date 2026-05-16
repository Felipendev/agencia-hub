import Link from "next/link";

type Props = {
  href: string;
  label: string;
};

export function BackButton({ href, label }: Props) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--hub-text-primary)] shadow-sm transition-colors hover:border-[var(--hub-border)] hover:bg-[var(--hub-bg-subtle)] hover:text-[var(--hub-blue-dark)]"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 shrink-0"
        aria-hidden="true"
      >
        <path d="M12 15l-5-5 5-5" />
      </svg>
      {label}
    </Link>
  );
}
