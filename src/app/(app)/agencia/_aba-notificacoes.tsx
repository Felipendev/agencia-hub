"use client";

import { useNotifications } from "@/contexts/notification-context";
import type { NotifPrefs } from "@/lib/notif-prefs";
import {
  Bell,
  FileText,
  Users,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Info,
} from "lucide-react";

// ── Toggle Switch ─────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hub-primary)]",
        checked ? "bg-[var(--hub-primary)]" : "bg-[var(--hub-border-strong)]",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5",
        ].join(" ")}
      />
    </button>
  );
}

// ── Rule Card ─────────────────────────────────────────────────────────────────

function RuleCard({
  icon,
  iconBg,
  iconColor,
  title,
  description,
  badge,
  enabled,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  badge?: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  const id = `toggle-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div
      className={[
        "rounded-xl border transition-colors",
        enabled
          ? "border-[var(--hub-primary)]/30 bg-white shadow-[var(--hub-shadow-sm)]"
          : "border-[var(--hub-border)] bg-[var(--hub-bg-subtle)]/60",
      ].join(" ")}
    >
      <div className="flex items-start gap-4 p-4">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor={id}
              className={`cursor-pointer text-sm font-semibold ${enabled ? "text-[var(--hub-text-primary)]" : "text-[var(--hub-text-muted)]"}`}
            >
              {title}
            </label>
            {badge && (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                {badge}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--hub-text-secondary)]">
            {description}
          </p>
          {enabled && children && (
            <div className="mt-3">{children}</div>
          )}
        </div>
        <Toggle id={id} checked={enabled} onChange={onToggle} />
      </div>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3 pb-1">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--hub-bg-subtle)] text-[var(--hub-text-secondary)]">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-[var(--hub-text-primary)]">{title}</h3>
        <p className="text-xs text-[var(--hub-text-muted)]">{description}</p>
      </div>
    </div>
  );
}

// ── Days Picker ───────────────────────────────────────────────────────────────

const DIAS_OPTIONS = [1, 2, 3, 5, 7] as const;

function DiasPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="self-center text-xs text-[var(--hub-text-secondary)]">Alertar</span>
      {DIAS_OPTIONS.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          className={[
            "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
            value === d
              ? "bg-[var(--hub-primary)] text-white"
              : "bg-[var(--hub-bg-subtle)] text-[var(--hub-text-secondary)] hover:bg-[var(--hub-border-strong)]",
          ].join(" ")}
        >
          {d}d
        </button>
      ))}
      <span className="self-center text-xs text-[var(--hub-text-secondary)]">antes do vencimento</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AbaNotificacoes() {
  const { prefs, updatePrefs, notifications, unreadCount, markAllAsRead, clearAll } =
    useNotifications();

  function patchVencendo(patch: Partial<NotifPrefs["cotacaoVencendo"]>) {
    updatePrefs({
      cotacaoVencendo: { ...prefs.cotacaoVencendo, ...patch },
    });
  }

  return (
    <div className="space-y-8 pb-8">

      {/* ── Status summary ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--hub-border)] bg-[var(--hub-card)] p-4 shadow-[var(--hub-shadow-xs)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--hub-primary-muted)]">
            <Bell className="h-5 w-5 text-[var(--hub-primary)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--hub-text-primary)]">
              {unreadCount > 0 ? (
                <>
                  <span className="text-[var(--hub-primary)]">{unreadCount}</span> notificaç{unreadCount > 1 ? "ões não lidas" : "ão não lida"}
                </>
              ) : (
                "Nenhuma notificação pendente"
              )}
            </p>
            <p className="text-xs text-[var(--hub-text-muted)]">
              {notifications.length} no total · as notificações ficam salvas neste navegador
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--hub-text-secondary)] transition-colors hover:bg-[var(--hub-bg-subtle)]"
            >
              Marcar todas como lidas
            </button>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="rounded-[var(--hub-radius)] border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
            >
              Limpar tudo
            </button>
          )}
        </div>
      </div>

      {/* ── Info banner ────────────────────────────────────────────────── */}
      <div className="flex gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
        <p className="text-xs leading-relaxed text-sky-800">
          As notificações são verificadas automaticamente ao carregar a aplicação. As preferências
          são salvas localmente neste navegador. Desativar uma regra impede que novos alertas
          sejam gerados — notificações já existentes permanecem até você limpá-las.
        </p>
      </div>

      {/* ── Cotações ───────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader
          icon={<FileText className="h-4 w-4" />}
          title="Cotações"
          description="Alertas relacionados ao ciclo de vida das suas cotações"
        />

        <RuleCard
          icon={<Clock className="h-4 w-4" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          title="Cotação vencendo"
          description="Avisa quando uma cotação em aberto está próxima do prazo de validade."
          badge="Ativo por padrão"
          enabled={prefs.cotacaoVencendo.enabled}
          onToggle={(v) => patchVencendo({ enabled: v })}
        >
          <DiasPicker
            value={prefs.cotacaoVencendo.diasAntecedencia}
            onChange={(d) => patchVencendo({ diasAntecedencia: d })}
          />
        </RuleCard>

        <RuleCard
          icon={<AlertTriangle className="h-4 w-4" />}
          iconBg="bg-red-50"
          iconColor="text-red-500"
          title="Cotação vencida"
          description="Alerta quando uma cotação em aberto já passou do prazo de validade sem resposta."
          badge="Ativo por padrão"
          enabled={prefs.cotacaoVencida.enabled}
          onToggle={(v) => updatePrefs({ cotacaoVencida: { enabled: v } })}
        />

        <RuleCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          title="Cotação aprovada"
          description="Notifica quando uma cotação tem o status alterado para Aprovado."
          badge="Ativo por padrão"
          enabled={prefs.cotacaoAprovada.enabled}
          onToggle={(v) => updatePrefs({ cotacaoAprovada: { enabled: v } })}
        />
      </div>

      {/* ── Formulário público ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader
          icon={<Bell className="h-4 w-4" />}
          title="Formulário público"
          description="Avisos sobre novas solicitações recebidas pelo link público da sua agência"
        />

        <RuleCard
          icon={<Bell className="h-4 w-4" />}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          title="Nova solicitação recebida"
          description="Alerta quando um cliente preenche o formulário de cotação publicado no seu link."
          badge="Ativo por padrão"
          enabled={prefs.submissaoNova.enabled}
          onToggle={(v) => updatePrefs({ submissaoNova: { enabled: v } })}
        />
      </div>

      {/* ── Clientes ───────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader
          icon={<Users className="h-4 w-4" />}
          title="Clientes"
          description="Notificações sobre movimentações na sua carteira de clientes"
        />

        <RuleCard
          icon={<Users className="h-4 w-4" />}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
          title="Novo cliente cadastrado"
          description="Notifica sempre que um novo cliente é adicionado à base (manualmente ou via equipe)."
          enabled={prefs.clienteNovo.enabled}
          onToggle={(v) => updatePrefs({ clienteNovo: { enabled: v } })}
        />
      </div>

      {/* ── Financeiro ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader
          icon={<Wallet className="h-4 w-4" />}
          title="Financeiro"
          description="Alertas sobre lançamentos e movimentações financeiras confirmadas"
        />

        <RuleCard
          icon={<Wallet className="h-4 w-4" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          title="Lançamento confirmado"
          description="Notifica quando um lançamento financeiro (receita ou despesa) é confirmado no sistema."
          enabled={prefs.lancamentoConfirmado.enabled}
          onToggle={(v) => updatePrefs({ lancamentoConfirmado: { enabled: v } })}
        />
      </div>

    </div>
  );
}
