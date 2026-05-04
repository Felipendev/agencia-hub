/** Monta link wa.me a partir de telefone BR (MVP — sem integração API). */
export function whatsappLink(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const n = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${n}`;
}
