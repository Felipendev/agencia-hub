import type { LinkSocialItem, LinkSocialTipo } from "@/types/solicitacao-publica";

function IconForTipo({ tipo }: { tipo: LinkSocialTipo }) {
  const common = "h-5 w-5 shrink-0";
  switch (tipo) {
    case "whatsapp":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            fill="currentColor"
            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
          />
        </svg>
      );
    case "instagram":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            stroke="currentColor"
            strokeWidth="2"
            d="M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4z"
          />
          <circle
            cx="12"
            cy="12"
            r="3.5"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="17" cy="7" r="1" fill="currentColor" />
        </svg>
      );
    case "facebook":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "email":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            stroke="currentColor"
            strokeWidth="2"
            d="M4 6h16v12H4V6zm0 0l8 6 8-6"
          />
        </svg>
      );
    case "site":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path
            stroke="currentColor"
            strokeWidth="2"
            d="M3 12h18M12 3a15 15 0 000 18M12 3a15 15 0 010 18"
          />
        </svg>
      );
    case "formulario":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            stroke="currentColor"
            strokeWidth="2"
            d="M7 4h10v16H7V4zm3 4h4m-4 4h4m-4 4h2"
          />
        </svg>
      );
    default:
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path stroke="currentColor" strokeWidth="2" d="M12 5v14M5 12h14" />
        </svg>
      );
  }
}

function labelForTipo(tipo: LinkSocialTipo, custom?: string) {
  if (custom?.trim()) return custom.trim();
  const map: Record<LinkSocialTipo, string> = {
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    facebook: "Facebook",
    email: "E-mail",
    site: "Site",
    formulario: "Informações",
    outro: "Link",
  };
  return map[tipo] ?? "Canal";
}

/** Lista lateral em cartões — layout próprio do AgenciaHub (não centralizado em ícones soltos). */
export function SolicitacaoSocialPanel({ links }: { links: LinkSocialItem[] }) {
  const list = links.filter((l) => l.url?.trim());
  if (list.length === 0) return null;

  return (
    <aside
      className="relative flex flex-col gap-3"
      aria-label="Canais de contato da agência"
    >
      <div className="flex items-end justify-between gap-2 border-b border-[var(--hub-border)]/80 pb-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--hub-text-muted)]">
            Contato
          </p>
          <p className="text-sm font-semibold text-[var(--hub-blue-dark)]">
            Escolha um canal
          </p>
        </div>
        <span
          className="hidden h-px flex-1 translate-y-[-6px] bg-gradient-to-r from-transparent via-[var(--hub-yellow)]/80 to-transparent sm:block"
          aria-hidden
        />
      </div>

      <ul className="flex flex-col gap-2">
        {list.map((l, i) => {
          const label = labelForTipo(l.tipo, l.label);
          const tone =
            i % 3 === 0
              ? "from-sky-50/90 to-white"
              : i % 3 === 1
                ? "from-amber-50/80 to-white"
                : "from-slate-50 to-white";
          return (
            <li key={l.id}>
              <a
                href={l.url.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex items-center gap-3 rounded-[var(--hub-radius-xl)] border border-[var(--hub-border)]/90 bg-gradient-to-br ${tone} px-3 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--hub-blue-muted)] hover:shadow-md`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--hub-radius-lg)] bg-white text-[var(--hub-blue)] shadow-inner ring-1 ring-slate-100 transition group-hover:text-[var(--hub-blue-dark)]">
                  <IconForTipo tipo={l.tipo} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-[var(--hub-text-primary)]">
                    {label}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-[var(--hub-text-muted)]">
                    Abrir em nova aba
                  </span>
                </span>
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--hub-bg-subtle)] text-[var(--hub-text-muted)] transition group-hover:bg-[var(--hub-yellow)] group-hover:text-[var(--hub-blue-dark)]"
                  aria-hidden
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 17L17 7M7 7h10v10"
                    />
                  </svg>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
