"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardTitle } from "@/components/ui/card";
import {
  expiryState,
  walletFields,
  walletLabels,
  walletPayload,
  type WalletItem,
  type WalletKind,
  type WalletProfile,
  type WalletView,
} from "@/lib/miles-wallet";

const blankProfile: WalletProfile = {
  goals: "",
  travelFrequency: "",
  destinations: "",
  actionPlan: "",
};
const count = (value: number) =>
  value.toLocaleString("pt-BR", { maximumFractionDigits: 4 });
const day = (value: string) => value.split("-").reverse().join("/");
const auditLabels: Record<string, string> = {
  PROFILE_SAVED: "Perfil salvo",
  PROFILE_ARCHIVED: "Perfil arquivado",
  ITEM_CREATED: "Registro criado",
  ITEM_UPDATED: "Registro editado",
  ITEM_DELETED: "Registro excluído",
  ACCOUNT_ARCHIVED: "Conta arquivada",
  ACCOUNT_RESTORED: "Conta reativada",
  MOVEMENT_CREATED: "Movimentação registrada",
  MOVEMENT_REVERSED: "Movimentação estornada",
};
const profileLabels: Record<keyof WalletProfile, string> = {
  goals: "Objetivos",
  travelFrequency: "Frequência de viagens",
  destinations: "Destinos de interesse",
  actionPlan: "Plano de ações",
};

export function MilesWallet({ customerId }: { customerId: string }) {
  const { token } = useAuth();
  const base = getAgenciaHubApiBaseUrl();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<WalletView | null>(null);
  const [tab, setTab] = useState<
    "PROFILE" | WalletKind | "MOVEMENTS" | "HISTORY"
  >("PROFILE");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const creationKey = useRef<string | null>(null);
  const movementKey = useRef<string | null>(null);
  const [profileDraft, setProfileDraft] = useState<WalletProfile | null>(null);
  const [profileVersion, setProfileVersion] = useState(0);
  const [form, setForm] = useState<{
    kind: WalletKind;
    row?: WalletItem;
    values: Record<string, string>;
  } | null>(null);
  const [movement, setMovement] = useState<{
    accountId: string;
    direction: string;
    quantity: string;
    reason: string;
    occurredOn: string;
  } | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [expiryFilter, setExpiryFilter] = useState("upcoming");
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Fortaleza",
  });
  const request = useCallback(
    async (path: string, init: RequestInit = {}) => {
      if (!base || !token)
        throw new Error("Conecte-se para consultar a carteira da agência.");
      const response = await fetch(
        `${base}/customers/${customerId}/miles-wallet${path}`,
        {
          ...init,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...init.headers,
          },
        },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.message || "Não foi possível concluir a operação na carteira.",
        );
      }
      return response;
    },
    [base, token, customerId],
  );
  const reload = useCallback(async () => {
    const data: WalletView = await (await request("")).json();
    setView(data);
  }, [request]);
  async function refresh() {
    if (pending.current) return;
    if (
      (form || movement || profileDraft) &&
      !window.confirm(
        "Recarregar a carteira e descartar as alterações ainda não salvas?",
      )
    )
      return;
    pending.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await reload();
      setForm(null);
      setMovement(null);
      setProfileDraft(null);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível recarregar a carteira.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    request("")
      .then((r) => r.json())
      .then((data: WalletView) => {
        if (!cancelled) setView(data);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [open, request]);
  async function run(
    path: string,
    method: string,
    body?: unknown,
    success = "Alterações salvas.",
    done?: () => void,
    headers?: Record<string, string>,
  ) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    let confirmed = false;
    try {
      await request(path, {
        method,
        body: body === undefined ? undefined : JSON.stringify(body),
        headers,
      });
      confirmed = true;
      done?.();
      setNotice(success);
      await reload();
    } catch (e) {
      setError(
        `${confirmed ? "A operação foi salva, mas a lista não pôde ser atualizada. Recarregue a carteira. " : ""}${e instanceof Error ? e.message : "Erro na carteira."}`,
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  function begin(kind: WalletKind, row?: WalletItem) {
    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(row?.data ?? {}))
      if (value !== null) values[key] = String(value);
    if (!row && kind === "ACCOUNT") {
      values.openingBalance = "0";
      values.declaredOn = today;
    }
    creationKey.current = crypto.randomUUID();
    setForm({ kind, row, values });
    setProfileDraft(null);
    setMovement(null);
    setError("");
    setNotice("");
  }
  function beginMove(accountId = "") {
    movementKey.current = crypto.randomUUID();
    setMovement({
      accountId,
      direction: "IN",
      quantity: "",
      reason: "",
      occurredOn: today,
    });
    setForm(null);
    setProfileDraft(null);
    setError("");
    setNotice("");
  }
  function switchTab(next: typeof tab) {
    setTab(next);
    setForm(null);
    setProfileDraft(null);
    setMovement(null);
    setError("");
    setNotice("");
  }
  const accounts = view?.items.filter((i) => i.kind === "ACCOUNT") ?? [];
  const title = (row: WalletItem) =>
    row.kind === "CARD"
      ? `${row.data.issuer} · ${row.data.category}`
      : row.kind === "EXPIRY"
        ? `${accounts.find((a) => a.id === row.data.accountId)?.data.program ?? "Conta"} · ${row.data.expiresOn ? day(row.data.expiresOn) : ""}`
        : (row.data.program ?? "Registro");
  const visible =
    view?.items.filter(
      (i) =>
        i.kind === tab &&
        (showArchived || !i.archived) &&
        (i.kind !== "EXPIRY" ||
          expiryFilter === "all" ||
          expiryState(i.data.expiresOn!, today) === expiryFilter),
    ) ?? [];

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Perfil e carteira de milhas</CardTitle>
          <p className="mt-1 text-sm text-[var(--hub-text-secondary)]">
            Contas declaradas, cartões, clubes e planejamento desta pessoa.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Recolher carteira" : "Abrir carteira"}
        </Button>
      </div>
      {open && (
        <div className="mt-5 space-y-5">
          <p className="text-sm text-[var(--hub-text-secondary)]">
            Saldos são informados manualmente, com fonte e data. Pontos
            previstos de cartões e clubes não entram no saldo atual. O titular
            da conta pode ser diferente do passageiro.
          </p>
          <nav aria-label="Seções da carteira" className="flex flex-wrap gap-2">
            {(
              [
                "PROFILE",
                "ACCOUNT",
                "CARD",
                "CLUB",
                "EXPIRY",
                "MOVEMENTS",
                "HISTORY",
              ] as const
            ).map((key) => (
              <Button
                type="button"
                key={key}
                disabled={busy}
                variant={tab === key ? "primary" : "secondary"}
                aria-pressed={tab === key}
                onClick={() => switchTab(key)}
              >
                {key === "PROFILE"
                  ? "Perfil"
                  : key === "MOVEMENTS"
                    ? "Movimentações"
                    : key === "HISTORY"
                      ? "Histórico"
                      : walletLabels[key]}
              </Button>
            ))}
          </nav>
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
            >
              {error}
            </p>
          )}
          {notice && (
            <p
              role="status"
              className="rounded-lg bg-green-50 p-3 text-sm text-green-800"
            >
              {notice}
            </p>
          )}
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void refresh()}
          >
            Recarregar carteira
          </Button>
          {!view && !error && <p role="status">Carregando carteira…</p>}
          {view && (
            <>
              {tab === "PROFILE" && (
                <section className="space-y-4" aria-label="Perfil de milhas">
                  <h3 className="font-semibold">Perfil de planejamento</h3>
                  {!profileDraft && (
                    <>
                      {view.profile ? (
                        <>
                          <p className="text-sm">
                            Versão {view.profile.version}
                            {view.profile.archived ? " · Arquivado" : ""}
                          </p>
                          <dl className="grid gap-4 md:grid-cols-2">
                            {(
                              Object.keys(profileLabels) as Array<
                                keyof WalletProfile
                              >
                            ).map((key) => (
                              <div key={key}>
                                <dt className="text-sm font-medium">
                                  {profileLabels[key]}
                                </dt>
                                <dd className="whitespace-pre-wrap break-words text-sm text-[var(--hub-text-secondary)]">
                                  {view.profile!.data[key] || "Não informado"}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </>
                      ) : (
                        <p className="text-sm text-[var(--hub-text-secondary)]">
                          Nenhum perfil de milhas cadastrado.
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setProfileDraft(view.profile?.data ?? blankProfile);
                            setProfileVersion(view.profile?.version ?? 0);
                          }}
                        >
                          {view.profile?.archived
                            ? "Reativar e editar perfil"
                            : view.profile
                              ? "Editar perfil"
                              : "Criar perfil"}
                        </Button>
                        {view.profile && !view.profile.archived && (
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={busy}
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Arquivar o perfil? O histórico e as contas de programas serão preservados.",
                                )
                              )
                                void run(
                                  `/profile?expectedVersion=${view.profile!.version}`,
                                  "DELETE",
                                  undefined,
                                  "Perfil arquivado.",
                                );
                            }}
                          >
                            Arquivar perfil
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-[var(--hub-text-muted)]">
                        O arquivamento preserva as versões anteriores. O plano
                        de ações poderá se integrar às rotinas quando o módulo
                        de checklists for entregue.
                      </p>
                    </>
                  )}
                  {profileDraft && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void run(
                          "/profile",
                          "PUT",
                          {
                            data: profileDraft,
                            expectedVersion: profileVersion,
                          },
                          "Perfil salvo.",
                          () => setProfileDraft(null),
                        );
                      }}
                      className="space-y-4"
                    >
                      <fieldset
                        disabled={busy}
                        className="grid gap-4 md:grid-cols-2"
                      >
                        {(
                          Object.keys(profileLabels) as Array<
                            keyof WalletProfile
                          >
                        ).map((key) => (
                          <label key={key} className="space-y-1 text-sm">
                            {profileLabels[key]}
                            <Textarea
                              value={profileDraft[key] ?? ""}
                              maxLength={
                                key === "actionPlan"
                                  ? 4000
                                  : key === "travelFrequency"
                                    ? 200
                                    : 2000
                              }
                              onChange={(e) =>
                                setProfileDraft({
                                  ...profileDraft,
                                  [key]: e.target.value,
                                })
                              }
                            />
                          </label>
                        ))}
                      </fieldset>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={busy}>
                          {busy ? "Salvando…" : "Salvar perfil"}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={busy}
                          onClick={() => setProfileDraft(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  )}
                </section>
              )}
              {(["ACCOUNT", "CARD", "CLUB", "EXPIRY"] as string[]).includes(
                tab,
              ) && (
                <section
                  className="space-y-4"
                  aria-label={walletLabels[tab as WalletKind]}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold">
                      {walletLabels[tab as WalletKind]}
                    </h3>
                    <Button
                      type="button"
                      disabled={
                        busy ||
                        (tab === "EXPIRY" && !accounts.some((a) => !a.archived))
                      }
                      onClick={() => begin(tab as WalletKind)}
                    >
                      Adicionar{" "}
                      {tab === "ACCOUNT"
                        ? "conta"
                        : tab === "CARD"
                          ? "cartão"
                          : tab === "CLUB"
                            ? "clube"
                            : "vencimento"}
                    </Button>
                  </div>
                  {tab === "ACCOUNT" && (
                    <label className="flex gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={showArchived}
                        onChange={(e) => setShowArchived(e.target.checked)}
                      />
                      Mostrar contas arquivadas
                    </label>
                  )}
                  {tab === "EXPIRY" && (
                    <>
                      <label className="block max-w-xs space-y-1 text-sm">
                        Período de vencimento
                        <Select
                          value={expiryFilter}
                          onChange={(e) => setExpiryFilter(e.target.value)}
                        >
                          <option value="upcoming">
                            Hoje e próximos 90 dias
                          </option>
                          <option value="expired">Datas já passadas</option>
                          <option value="all">Todos os vencimentos</option>
                        </Select>
                      </label>
                      <p className="text-xs text-[var(--hub-text-muted)]">
                        Vencimentos são lembretes declarados; não debitam pontos
                        automaticamente. Confira o programa e registre uma saída
                        quando houver expiração.
                      </p>
                      {!accounts.some((a) => !a.archived) && (
                        <p className="text-sm">
                          Cadastre uma conta de programa para informar pontos a
                          vencer.
                        </p>
                      )}
                    </>
                  )}
                  {form && (
                    <form
                      aria-label="Cadastro da carteira"
                      className="space-y-4 rounded-[var(--hub-radius)] border border-[var(--hub-border)] p-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const input = {
                          kind: form.kind,
                          data: walletPayload(
                            form.kind,
                            form.values,
                            form.row?.data,
                          ),
                          expectedVersion: form.row?.version ?? 0,
                        };
                        void run(
                          form.row ? `/items/${form.row.id}` : "/items",
                          form.row ? "PATCH" : "POST",
                          input,
                          "Registro salvo.",
                          () => setForm(null),
                          form.row
                            ? undefined
                            : { "Idempotency-Key": creationKey.current! },
                        );
                      }}
                    >
                      <h4 className="font-medium">
                        {form.row ? "Editar registro" : "Novo registro"}
                      </h4>
                      <fieldset
                        disabled={busy}
                        className="grid gap-4 md:grid-cols-2"
                      >
                        {form.kind === "EXPIRY" && (
                          <label className="space-y-1 text-sm">
                            Conta de programa *
                            <Select
                              required
                              value={form.values.accountId ?? ""}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  values: {
                                    ...form.values,
                                    accountId: e.target.value,
                                  },
                                })
                              }
                            >
                              <option value="">Selecione</option>
                              {accounts
                                .filter((a) => !a.archived)
                                .map((a) => (
                                  <option value={a.id} key={a.id}>
                                    {a.data.program} · {a.data.holder}
                                  </option>
                                ))}
                            </Select>
                          </label>
                        )}
                        {walletFields[form.kind].map((field) => (
                          <label key={field.key} className="space-y-1 text-sm">
                            {field.label}
                            {field.required ? " *" : ""}
                            <Input
                              type={field.type ?? "text"}
                              required={field.required}
                              min={field.min}
                              max={
                                field.type === "date" &&
                                field.key === "declaredOn"
                                  ? today
                                  : field.max
                              }
                              step={
                                field.step ??
                                (field.type === "number" ? "1" : undefined)
                              }
                              maxLength={field.maxLength}
                              value={form.values[field.key] ?? ""}
                              disabled={
                                !!form.row &&
                                form.kind === "ACCOUNT" &&
                                [
                                  "openingBalance",
                                  "source",
                                  "declaredOn",
                                ].includes(field.key)
                              }
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  values: {
                                    ...form.values,
                                    [field.key]: e.target.value,
                                  },
                                })
                              }
                            />
                          </label>
                        ))}
                      </fieldset>
                      {form.kind === "ACCOUNT" && form.row && (
                        <p className="text-xs text-[var(--hub-text-muted)]">
                          Saldo inicial, fonte e data compõem o histórico. Para
                          ajustar o saldo, registre uma entrada ou saída.
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button type="submit" disabled={busy}>
                          {busy ? "Salvando…" : "Salvar registro"}
                        </Button>
                        <Button
                          type="button"
                          disabled={busy}
                          variant="secondary"
                          onClick={() => setForm(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  )}
                  {!visible.length && (
                    <p className="text-sm text-[var(--hub-text-secondary)]">
                      Nenhum registro neste filtro.
                    </p>
                  )}
                  <div className="divide-y divide-[var(--hub-border)]">
                    {visible.map((row) => (
                      <article key={row.id} className="space-y-3 py-4">
                        <h4 className="font-semibold break-words">
                          {title(row)}
                          {row.archived ? " · Arquivada" : ""}
                        </h4>
                        {row.kind === "ACCOUNT" && (
                          <p className="text-lg font-semibold">
                            {count(row.balance)} pontos de saldo declarado
                          </p>
                        )}
                        <dl className="grid gap-2 text-sm md:grid-cols-2">
                          {walletFields[row.kind]
                            .filter(
                              (f) =>
                                row.data[f.key] !== null &&
                                row.data[f.key] !== undefined,
                            )
                            .map((f) => (
                              <div key={f.key}>
                                <dt className="text-[var(--hub-text-muted)]">
                                  {f.label}
                                </dt>
                                <dd className="break-words">
                                  {f.type === "date"
                                    ? day(String(row.data[f.key]))
                                    : f.type === "number"
                                      ? count(Number(row.data[f.key]))
                                      : String(row.data[f.key])}
                                </dd>
                              </div>
                            ))}
                        </dl>
                        <div className="flex flex-wrap gap-2">
                          {row.archived ? (
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={busy}
                              onClick={() =>
                                void run(
                                  `/items/${row.id}/restore?expectedVersion=${row.version}`,
                                  "POST",
                                  undefined,
                                  "Conta reativada.",
                                )
                              }
                            >
                              Reativar conta
                            </Button>
                          ) : (
                            <>
                              <Button
                                type="button"
                                variant="secondary"
                                disabled={busy}
                                onClick={() => begin(row.kind, row)}
                              >
                                Editar
                              </Button>
                              {row.kind === "ACCOUNT" && (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  disabled={busy}
                                  onClick={() => {
                                    setTab("MOVEMENTS");
                                    beginMove(row.id);
                                  }}
                                >
                                  Registrar movimentação
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="secondary"
                                disabled={busy}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      row.kind === "ACCOUNT"
                                        ? "Arquivar esta conta? O saldo e as movimentações serão preservados para consulta."
                                        : "Excluir este registro? A alteração ficará registrada no histórico.",
                                    )
                                  )
                                    void run(
                                      `/items/${row.id}?expectedVersion=${row.version}`,
                                      "DELETE",
                                      undefined,
                                      row.kind === "ACCOUNT"
                                        ? "Conta arquivada."
                                        : "Registro excluído.",
                                      () => {
                                        if (form?.row?.id === row.id)
                                          setForm(null);
                                      },
                                    );
                                }}
                              >
                                {row.kind === "ACCOUNT"
                                  ? "Arquivar conta"
                                  : "Excluir"}
                              </Button>
                            </>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
              {tab === "MOVEMENTS" && (
                <section
                  aria-label="Movimentações da carteira"
                  className="space-y-4"
                >
                  <div className="flex flex-wrap justify-between gap-3">
                    <h3 className="font-semibold">
                      Entradas, saídas e estornos
                    </h3>
                    <Button
                      type="button"
                      disabled={busy || !accounts.some((a) => !a.archived)}
                      onClick={() => beginMove()}
                    >
                      Nova movimentação
                    </Button>
                  </div>
                  <p className="text-xs text-[var(--hub-text-muted)]">
                    Movimentações confirmadas não são editadas ou apagadas. Para
                    corrigir, estorne e registre a informação correta. O estorno
                    mantém a operação original.
                  </p>
                  {movement && (
                    <form
                      className="space-y-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void run(
                          `/accounts/${movement.accountId}/movements`,
                          "POST",
                          {
                            requestKey: movementKey.current,
                            quantity:
                              Number(movement.quantity) *
                              (movement.direction === "OUT" ? -1 : 1),
                            reason: movement.reason,
                            occurredOn: movement.occurredOn,
                          },
                          "Movimentação registrada.",
                          () => setMovement(null),
                        );
                      }}
                    >
                      <fieldset
                        disabled={busy}
                        className="grid gap-4 md:grid-cols-2"
                      >
                        <label className="space-y-1 text-sm">
                          Conta *
                          <Select
                            required
                            value={movement.accountId}
                            onChange={(e) =>
                              setMovement({
                                ...movement,
                                accountId: e.target.value,
                              })
                            }
                          >
                            <option value="">Selecione</option>
                            {accounts
                              .filter((a) => !a.archived)
                              .map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.data.program} · {a.data.holder} ·{" "}
                                  {count(a.balance)} pontos
                                </option>
                              ))}
                          </Select>
                        </label>
                        <label className="space-y-1 text-sm">
                          Tipo
                          <Select
                            value={movement.direction}
                            onChange={(e) =>
                              setMovement({
                                ...movement,
                                direction: e.target.value,
                              })
                            }
                          >
                            <option value="IN">Entrada</option>
                            <option value="OUT">Saída</option>
                          </Select>
                        </label>
                        <label className="space-y-1 text-sm">
                          Quantidade *
                          <Input
                            type="number"
                            min={1}
                            max={1000000000}
                            step="1"
                            required
                            value={movement.quantity}
                            onChange={(e) =>
                              setMovement({
                                ...movement,
                                quantity: e.target.value,
                              })
                            }
                          />
                        </label>
                        <label className="space-y-1 text-sm">
                          Data da movimentação *
                          <Input
                            type="date"
                            required
                            max={today}
                            value={movement.occurredOn}
                            onChange={(e) =>
                              setMovement({
                                ...movement,
                                occurredOn: e.target.value,
                              })
                            }
                          />
                        </label>
                        <label className="space-y-1 text-sm md:col-span-2">
                          Motivo *
                          <Input
                            required
                            maxLength={500}
                            value={movement.reason}
                            onChange={(e) =>
                              setMovement({
                                ...movement,
                                reason: e.target.value,
                              })
                            }
                          />
                        </label>
                      </fieldset>
                      <div className="flex gap-2">
                        <Button disabled={busy} type="submit">
                          {busy ? "Registrando…" : "Confirmar movimentação"}
                        </Button>
                        <Button
                          variant="secondary"
                          type="button"
                          disabled={busy}
                          onClick={() => setMovement(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  )}
                  {!view.movements.length && (
                    <p className="text-sm text-[var(--hub-text-secondary)]">
                      Nenhuma movimentação registrada.
                    </p>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="p-2">Data</th>
                          <th className="p-2">Programa / titular</th>
                          <th className="p-2">Pontos</th>
                          <th className="p-2">Motivo e autor</th>
                          <th className="p-2">Situação</th>
                          <th className="p-2">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {view.movements.map((m) => (
                          <tr key={m.id} className="border-b">
                            <td className="p-2 whitespace-nowrap">
                              {day(m.occurredOn)}
                            </td>
                            <td className="p-2">
                              {
                                accounts.find((a) => a.id === m.accountId)?.data
                                  .program
                              }{" "}
                              ·{" "}
                              {
                                accounts.find((a) => a.id === m.accountId)?.data
                                  .holder
                              }
                            </td>
                            <td className="p-2 whitespace-nowrap">
                              {m.quantity > 0 ? "+" : ""}
                              {count(m.quantity)}
                            </td>
                            <td className="p-2">
                              <p>{m.reason}</p>
                              <p className="text-xs text-[var(--hub-text-muted)]">
                                {m.author}
                              </p>
                            </td>
                            <td className="p-2">
                              {m.reversed
                                ? "Estornada"
                                : m.reversesId
                                  ? "Estorno"
                                  : "Confirmada"}
                            </td>
                            <td className="p-2">
                              {!m.reversed && !m.reversesId && (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  disabled={
                                    busy ||
                                    accounts.find((a) => a.id === m.accountId)
                                      ?.archived
                                  }
                                  onClick={() => {
                                    const reason = window.prompt(
                                      "Motivo do estorno (obrigatório):",
                                    );
                                    if (reason?.trim())
                                      void run(
                                        `/movements/${m.id}/reverse`,
                                        "POST",
                                        { reason: reason.trim() },
                                        "Movimentação estornada.",
                                      );
                                  }}
                                >
                                  Estornar
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
              {tab === "HISTORY" && (
                <section
                  aria-label="Histórico da carteira"
                  className="space-y-3"
                >
                  <h3 className="font-semibold">Histórico de alterações</h3>
                  {!view.history.length && (
                    <p className="text-sm">Nenhuma alteração registrada.</p>
                  )}
                  {view.history.map((h) => (
                    <details
                      key={h.id}
                      className="border-b border-[var(--hub-border)] py-3"
                    >
                      <summary className="cursor-pointer text-sm">
                        {auditLabels[h.action] ?? "Alteração"} ·{" "}
                        {new Date(h.createdAt).toLocaleString("pt-BR")} ·{" "}
                        {h.author}
                      </summary>
                      <div className="space-y-1 pt-3 text-sm">
                        {h.snapshot.version !== undefined && (
                          <p>Versão {h.snapshot.version}</p>
                        )}
                        {h.snapshot.data &&
                          Object.entries(h.snapshot.data)
                            .filter(([, v]) => v !== null && v !== "")
                            .map(([key, value]) => (
                              <p key={key} className="break-words">
                                <span className="font-medium">
                                  {profileLabels[key as keyof WalletProfile] ??
                                    Object.values(walletFields)
                                      .flat()
                                      .find((f) => f.key === key)?.label ??
                                    (key === "accountId"
                                      ? "Conta"
                                      : "Informação")}
                                  :{" "}
                                </span>
                                {key === "accountId"
                                  ? (accounts.find((a) => a.id === value)?.data
                                      .program ?? "Conta arquivada")
                                  : String(value)}
                              </p>
                            ))}
                        {h.snapshot.quantity !== undefined && (
                          <p>
                            Pontos: {count(h.snapshot.quantity)} ·{" "}
                            {h.snapshot.reason}
                          </p>
                        )}
                      </div>
                    </details>
                  ))}
                </section>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}
