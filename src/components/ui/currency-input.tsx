import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { formatCurrencyInput } from "@/lib/currency-input";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "inputMode"> & {
  /** Texto já formatado ("1.500,00"), como guardado no state do formulário. */
  value: string;
  /** Recebe o texto recém-formatado a cada tecla — guarde direto no state. */
  onValueChange: (formatted: string) => void;
};

/**
 * Campo de valor em R$ padrão do app: digita só números, vira centavos formatados
 * automaticamente ("150000" → "1.500,00"). Use `parseCurrencyInput` (de
 * `@/lib/currency-input`) para converter o texto de volta a número antes de enviar
 * para a API — nunca `parseFloat`.
 */
export function CurrencyInput({ value, onValueChange, placeholder = "0,00", ...rest }: Props) {
  return (
    <Input
      {...rest}
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onValueChange(formatCurrencyInput(event.target.value))}
    />
  );
}
