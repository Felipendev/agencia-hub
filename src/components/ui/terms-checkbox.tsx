"use client";

import Link from "next/link";

interface TermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function TermsCheckbox({ checked, onChange }: TermsCheckboxProps) {
  return (
    <label className="flex items-start gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-[var(--hub-border)] text-[var(--hub-blue)] focus:ring-[var(--hub-blue)]/20"
      />
      <span className="text-sm text-[var(--hub-text-secondary)]">
        Li e aceito os{" "}
        <Link
          href="/termos"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[var(--hub-blue)] hover:underline"
        >
          Termos de Uso
        </Link>{" "}
        e a{" "}
        <Link
          href="/privacidade"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[var(--hub-blue)] hover:underline"
        >
          Política de Privacidade
        </Link>
      </span>
    </label>
  );
}
