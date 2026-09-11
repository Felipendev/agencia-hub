import type { LinkSocialItem } from "@/types/solicitacao-publica";
import { defaultFormWhatsappMessage, whatsappLink } from "./whatsapp";

export function normalizeSolicitacaoLinks(links: LinkSocialItem[], agency: string): LinkSocialItem[] {
  return links.map((link) => {
    if (link.tipo !== "whatsapp" || !link.url.trim()) return link;
    const message = link.mensagemWhatsapp?.trim() || defaultFormWhatsappMessage(agency);
    const url = whatsappLink(link.url, message);
    if (!url) throw new Error("Informe um WhatsApp brasileiro válido com DDD, como (11) 98765-4321.");
    return { ...link, url, mensagemWhatsapp: link.mensagemWhatsapp?.trim() || "" };
  });
}
