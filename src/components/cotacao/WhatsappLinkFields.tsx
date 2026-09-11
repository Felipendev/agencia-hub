import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { defaultFormWhatsappMessage, whatsappLink } from "@/lib/whatsapp";
import type { LinkSocialItem } from "@/types/solicitacao-publica";

export function WhatsappLinkFields({ link, agency, onChange }: {
  link: LinkSocialItem; agency: string; onChange: (patch: Partial<LinkSocialItem>) => void;
}) {
  const invalid = !!link.url.trim() && !whatsappLink(link.url);
  return <div className="space-y-2">
    <Input aria-label={link.tipo === "whatsapp" ? "Número do WhatsApp da agência" : "URL do contato"}
      placeholder={link.tipo === "whatsapp" ? "(11) 98765-4321 ou https://wa.me/5511987654321" : "https://…"}
      value={link.url} onChange={(e) => onChange({ url: e.target.value })}
      aria-invalid={link.tipo === "whatsapp" && invalid} />
    {link.tipo === "whatsapp" && <>
      {invalid && <p className="text-xs text-red-600">Informe um número brasileiro válido com DDD.</p>}
      <label className="block text-xs font-medium" htmlFor={`wa-message-${link.id}`}>Mensagem ao abrir o WhatsApp</label>
      <Textarea id={`wa-message-${link.id}`} rows={3} maxLength={2000}
        value={link.mensagemWhatsapp ?? ""} placeholder={defaultFormWhatsappMessage(agency)}
        onChange={(e) => onChange({ mensagemWhatsapp: e.target.value })} />
      <p className="text-xs text-[var(--hub-text-muted)]">Se ficar em branco, usamos a sugestão acima com o nome da agência.</p>
    </>}
  </div>;
}
