"use client";

import { useRef, useCallback, type KeyboardEvent, type ClipboardEvent } from "react";

interface VerificationCodeInputProps {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}

export function VerificationCodeInput({
  value,
  onChange,
  disabled = false,
}: VerificationCodeInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.padEnd(6, "").slice(0, 6).split("");

  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < 6) {
      inputsRef.current[index]?.focus();
    }
  }, []);

  const handleChange = useCallback(
    (index: number, char: string) => {
      if (!/^\d?$/.test(char)) return;

      const newDigits = value.padEnd(6, "").slice(0, 6).split("");
      newDigits[index] = char;
      const newCode = newDigits.join("");
      onChange(newCode.replace(/ /g, ""));

      if (char && index < 5) {
        focusInput(index + 1);
      }
    },
    [value, onChange, focusInput],
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        const currentDigit = value[index] || "";
        if (!currentDigit && index > 0) {
          e.preventDefault();
          const newDigits = value.padEnd(6, "").slice(0, 6).split("");
          newDigits[index - 1] = "";
          onChange(newDigits.join("").trimEnd());
          focusInput(index - 1);
        } else {
          const newDigits = value.padEnd(6, "").slice(0, 6).split("");
          newDigits[index] = "";
          onChange(newDigits.join("").trimEnd());
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        focusInput(index - 1);
      } else if (e.key === "ArrowRight" && index < 5) {
        e.preventDefault();
        focusInput(index + 1);
      }
    },
    [value, onChange, focusInput],
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
      if (pasted) {
        onChange(pasted);
        focusInput(Math.min(pasted.length, 5));
      }
    },
    [onChange, focusInput],
  );

  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={digits[i]?.trim() || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="h-12 w-10 rounded-lg border border-[var(--hub-border)] bg-white text-center text-lg font-semibold text-[var(--hub-blue-dark)] focus:border-[var(--hub-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--hub-blue)]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={`Dígito ${i + 1} do código de verificação`}
        />
      ))}
    </div>
  );
}
