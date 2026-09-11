import { brPhoneDigits, isValidBrazilianPhone } from "./br-phone";

/** Aceita telefone BR ou link wa.me existente. */
export function whatsappLink(phone: string, message?: string): string | null {
  let raw = phone.trim();
  let existingMessage = "";
  if (/^(https?:\/\/|wa\.me\/)/i.test(raw)) {
    try {
      const url = new URL(raw.startsWith("wa.me/") ? `https://${raw}` : raw);
      if (url.hostname !== "wa.me" || url.username || url.password) return null;
      raw = decodeURIComponent(url.pathname.slice(1));
      existingMessage = url.searchParams.get("text") ?? "";
    } catch { return null; }
  }
  if (!/^[+\d\s().-]+$/.test(raw) || !isValidBrazilianPhone(raw)) return null;
  const text = message?.trim() || existingMessage.trim();
  return `https://wa.me/55${brPhoneDigits(raw)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function defaultFormWhatsappMessage(agencyName: string): string {
  return `Olá, ${agencyName.trim() || "equipe"}! Vim pelo formulário de orçamento e gostaria de ajuda para planejar minha viagem. Podemos conversar?`;
}
