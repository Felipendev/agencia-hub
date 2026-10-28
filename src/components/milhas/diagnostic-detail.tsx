"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientePicker } from "@/components/cliente/ClientePicker";
import { listCustomersRemote } from "@/lib/api/list-customers-remote";
import type { Cliente } from "@/types";
import type { WalletView } from "@/lib/miles-wallet";
import { DiagnosticFields, DiagnosticRead } from "./diagnostic-fields";
import {
  diagnosticsApi,
  type DiagnosticData,
  type DiagnosticEntry,
  type DiagnosticEvent,
  type DiagnosticReceipt,
} from "@/lib/miles-diagnostics";
export function DiagnosticDetail({ id }: { id: string }) {
  const { token } = useAuth();
  return token ? (
    <Detail key={`${token}:${id}`} token={token} id={id} />
  ) : (
    <p role="alert">Entre no sistema para revisar o diagnóstico.</p>
  );
}
function Detail({ token, id }: { token: string; id: string }) {
  const [entry, setEntry] = useState<DiagnosticEntry | null>(null),
    [draft, setDraft] = useState<DiagnosticData | null>(null),
    [events, setEvents] = useState<DiagnosticEvent[]>([]),
    [people, setPeople] = useState<Cliente[]>([]),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [retry, setRetry] = useState(0),
    [reason, setReason] = useState(""),
    [person, setPerson] = useState("");
  const pending = useRef(false);
  useEffect(() => {
    let active = true;
    Promise.all([
      diagnosticsApi.get(token, id),
      diagnosticsApi.events(token, id),
      listCustomersRemote(token),
    ])
      .then(([e, h, p]) => {
        if (active) {
          setEntry(e);
          setDraft(e.data);
          setEvents(h);
          setPeople(p);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(
            "Não foi possível carregar o diagnóstico, histórico e pessoas. Tente novamente.",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [id, token, retry]);
  async function history() {
    try {
      setEvents(await diagnosticsApi.events(token, id));
    } catch {
      setError(
        "A alteração foi confirmada, mas o histórico não atualizou. Recarregue para consultá-lo.",
      );
    }
  }
  async function mutate(
    action: () => Promise<DiagnosticEntry>,
    message: string,
  ) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const updated = await action();
      setEntry(updated);
      setDraft(updated.data);
      setReason("");
      setNotice(message);
      await history();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível confirmar. Seu formulário foi preservado.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  const dirty = !!entry && JSON.stringify(draft) !== JSON.stringify(entry.data);
  return (
    <div className="space-y-5">
      <Link href="/milhas/diagnosticos" className="text-sm underline">
        Voltar aos diagnósticos
      </Link>
      <h1 className="text-2xl font-semibold">Revisar diagnóstico de Milhas</h1>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-lg bg-green-50 p-3 text-sm">
          {notice}
        </p>
      )}
      {loading && <p role="status">Carregando diagnóstico…</p>}
      <Button
        variant="secondary"
        disabled={busy || loading}
        onClick={() => {
          if (
            dirty &&
            !window.confirm(
              "Recarregar descarta as alterações não salvas. Continuar?",
            )
          )
            return;
          setLoading(true);
          setError("");
          setNotice("");
          setRetry((n) => n + 1);
        }}
      >
        Recarregar diagnóstico
      </Button>
      {entry && draft && (
        <>
          <p className="text-sm">
            Versão {entry.version} ·{" "}
            {entry.source === "PUBLIC"
              ? `Envio público · consentimento ${entry.consentVersion}`
              : "Registro manual da agência"}
            {entry.archived ? " · Arquivado" : ""}
            {entry.receipt ? " · Incorporado" : ""}
          </p>
          {entry.receipt ? (
            <section className="space-y-3 rounded-xl border bg-white p-5">
              <h2 className="font-semibold">Comprovante de incorporação</h2>
              <p className="text-sm">
                Confirmado em{" "}
                {new Date(entry.receipt.at).toLocaleString("pt-BR")}:{" "}
                {entry.receipt.itemIds.length} registro(s) adicionado(s)
                {entry.receipt.importedProfile
                  ? " e perfil revisado"
                  : ". O perfil da carteira foi mantido"}
                . Não é possível incorporar novamente. Corrija os dados usando o
                CRUD da carteira; este comprovante e suas versões são
                históricos.
              </p>
              <Link
                className="text-sm underline"
                href={`/milhas/clientes/${entry.receipt.customerId}`}
              >
                Consultar ou editar a carteira vinculada
              </Link>
              <h3 className="font-medium">
                Dados incorporados nesta confirmação
              </h3>
              <p className="text-sm">
                O cadastro de contato da pessoa não foi alterado.
              </p>
              <DiagnosticRead
                showContact={false}
                showProfile={entry.receipt.importedProfile}
                data={{
                  ...entry.data,
                  items: entry.receipt.itemIndexes.map(
                    (index) => entry.data.items[index],
                  ),
                }}
              />
            </section>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void mutate(
                  () => diagnosticsApi.edit(token, id, draft, entry.version),
                  "Revisão salva no mesmo diagnóstico.",
                );
              }}
              className="space-y-4 rounded-xl border bg-white p-5"
            >
              <h2 className="font-semibold">Declarações revisadas</h2>
              <fieldset
                disabled={busy || entry.archived || loading}
                className="contents"
              >
                <DiagnosticFields internal value={draft} onChange={setDraft} />
                <Button type="submit" disabled={!dirty}>
                  Salvar revisão
                </Button>
              </fieldset>
            </form>
          )}
          <details className="rounded-xl border bg-white p-4">
            <summary className="cursor-pointer font-medium">
              Declaração original
            </summary>
            <div className="mt-3">
              <DiagnosticRead data={entry.original} />
            </div>
          </details>
          {!entry.receipt && !entry.archived && (
            <section className="space-y-3 rounded-xl border bg-white p-5">
              <h2 className="font-semibold">Incorporar à carteira</h2>
              <p className="text-sm">
                Selecione a pessoa manualmente. Não associamos por e-mail ou
                telefone. Confira possíveis duplicados: os registros escolhidos
                serão adicionados e os demais ficarão apenas neste diagnóstico.
              </p>
              {dirty && (
                <p role="status" className="text-sm">
                  Salve a revisão antes de incorporar.
                </p>
              )}
              <fieldset
                disabled={busy || loading || dirty}
                className="contents"
              >
                <ClientePicker
                  clientes={people}
                  value={person}
                  onChange={setPerson}
                  label="Pessoa que receberá o diagnóstico"
                  id="diagnostic-person"
                  showNovoButton={false}
                />
                {person && (
                  <Incorporation
                    key={`${person}:${entry.version}:${token}`}
                    token={token}
                    entry={entry}
                    person={person}
                    disabled={busy || loading || dirty}
                    onBusy={(value) => {
                      pending.current = value;
                      setBusy(value);
                    }}
                    onDone={async (receipt) => {
                      setEntry({
                        ...entry,
                        receipt,
                        customerId: receipt.customerId,
                        version: entry.version + 1,
                      });
                      setNotice(
                        "Incorporação confirmada pela API. A carteira foi atualizada.",
                      );
                      await history();
                    }}
                  />
                )}
              </fieldset>
              <Link className="inline-block text-sm underline" href="/clientes">
                Abrir cadastro de pessoas
              </Link>
            </section>
          )}
          <section className="space-y-3 rounded-xl border bg-white p-5">
            <h2 className="font-semibold">
              {entry.archived ? "Reativar diagnóstico" : "Arquivar diagnóstico"}
            </h2>
            <p className="text-sm">
              A exclusão arquiva para preservar a declaração e suas versões.
              Arquivar ou reativar não desfaz a incorporação à carteira.
            </p>
            <label className="block text-sm">
              Motivo
              <Input
                maxLength={500}
                value={reason}
                disabled={busy || loading}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <Button
              variant={entry.archived ? "secondary" : "danger"}
              disabled={busy || loading || !reason.trim()}
              onClick={() =>
                mutate(
                  () => diagnosticsApi.state(token, entry, reason),
                  entry.archived
                    ? "Diagnóstico reativado."
                    : "Diagnóstico arquivado.",
                )
              }
            >
              {entry.archived ? "Reativar diagnóstico" : "Arquivar diagnóstico"}
            </Button>
          </section>
          <section className="space-y-3">
            <h2 className="font-semibold">Histórico e versões</h2>
            {events.map((event, index) => (
              <details
                className="rounded-lg border bg-white p-3 text-sm"
                key={index}
              >
                <summary className="cursor-pointer">
                  {{
                    CREATED: "Criado",
                    UPDATED: "Revisão salva",
                    ARCHIVED: "Arquivado",
                    RESTORED: "Reativado",
                    INCORPORATED: "Incorporado",
                  }[event.action] ?? event.action}{" "}
                  · {new Date(event.createdAt).toLocaleString("pt-BR")}
                  {event.reason && ` · ${event.reason}`}
                </summary>
                <div className="mt-3">
                  <DiagnosticRead data={event.snapshot.data} />
                </div>
              </details>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
function Incorporation({
  token,
  entry,
  person,
  disabled,
  onBusy,
  onDone,
}: {
  token: string;
  entry: DiagnosticEntry;
  person: string;
  disabled: boolean;
  onBusy: (busy: boolean) => void;
  onDone: (receipt: DiagnosticReceipt) => Promise<void>;
}) {
  const [wallet, setWallet] = useState<WalletView | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [retry, setRetry] = useState(0),
    [profile, setProfile] = useState(false),
    [selected, setSelected] = useState<number[]>([]),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false);
  const pending = useRef(false);
  useEffect(() => {
    const abort = new AbortController();
    diagnosticsApi
      .wallet(token, person, abort.signal)
      .then((v) => {
        if (!abort.signal.aborted) {
          setWallet(v);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!abort.signal.aborted) {
          setError(
            "Não foi possível consultar a carteira desta pessoa. A incorporação continua bloqueada.",
          );
          setLoading(false);
        }
      });
    return () => abort.abort();
  }, [token, person, retry]);
  async function apply() {
    if (pending.current || !wallet || !confirmed) return;
    pending.current = true;
    setBusy(true);
    onBusy(true);
    setError("");
    try {
      const receipt = await diagnosticsApi.incorporate(token, entry.id, {
        customerId: person,
        expectedVersion: entry.version,
        importProfile: profile,
        profileVersion: wallet.profile?.version ?? 0,
        items: selected,
      });
      await onDone(receipt);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível confirmar a incorporação.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <div className="space-y-3 border-t pt-3">
      {loading && <p role="status">Consultando a carteira selecionada…</p>}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {!loading && (
        <Button
          variant="secondary"
          disabled={busy || disabled}
          onClick={() => {
            setLoading(true);
            setWallet(null);
            setError("");
            setConfirmed(false);
            setRetry((n) => n + 1);
          }}
        >
          Recarregar carteira selecionada
        </Button>
      )}
      {wallet && (
        <fieldset disabled={busy || disabled} className="space-y-3">
          <h3 className="font-medium">Perfil atual da carteira</h3>
          {wallet.profile ? (
            <dl className="space-y-1 text-sm">
              {Object.entries({
                Objetivos: wallet.profile.data.goals,
                Frequência: wallet.profile.data.travelFrequency,
                Destinos: wallet.profile.data.destinations,
                "Plano de ações": wallet.profile.data.actionPlan,
              }).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[var(--hub-text-muted)]">{label}</dt>
                  <dd className="whitespace-pre-wrap break-words">
                    {value || "Não informado"}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm">
              Esta pessoa ainda não possui perfil de milhas.
            </p>
          )}
          <p className="text-sm">
            A carteira contém {wallet.items.filter((i) => !i.archived).length}{" "}
            registro(s) ativo(s).{" "}
            <Link
              className="underline"
              href={`/milhas/clientes/${person}`}
              target="_blank"
              rel="noreferrer"
            >
              Conferir carteira completa
            </Link>
          </p>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={profile}
              onChange={(e) => {
                setProfile(e.target.checked);
                setConfirmed(false);
              }}
            />
            {wallet.profile
              ? "Substituir o perfil atual pelas declarações revisadas, preservando a versão anterior"
              : "Criar perfil com as declarações revisadas"}
            {wallet.profile?.archived ? " e reativar o perfil arquivado" : ""}
          </label>
          <h3 className="font-medium">Registros para adicionar</h3>
          {entry.data.items.length === 0 && (
            <p className="text-sm">
              Nenhum registro declarado; você pode incorporar somente o perfil.
            </p>
          )}
          {entry.data.items.map((item, index) => (
            <label key={index} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(index)}
                onChange={(e) => {
                  setSelected((current) =>
                    e.target.checked
                      ? [...current, index]
                      : current.filter((i) => i !== index),
                  );
                  setConfirmed(false);
                }}
              />
              Adicionar registro {index + 1}:{" "}
              {item.data.program ?? item.data.issuer}{" "}
              {item.data.category ?? item.data.holder ?? ""}
            </label>
          ))}
          <p className="text-sm text-[var(--hub-text-muted)]">
            Uma conta adicionada registra o saldo inicial declarado e sua
            fonte/data; cartões e clubes não geram pontos automaticamente. Esta
            confirmação é única, sem fusão automática com registros existentes.
          </p>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            Conferi a pessoa, o perfil atual, os registros escolhidos e
            possíveis duplicados.
          </label>
          <Button
            disabled={!confirmed || (!profile && selected.length === 0) || busy}
            onClick={apply}
          >
            {busy ? "Incorporando…" : "Confirmar incorporação"}
          </Button>
        </fieldset>
      )}
    </div>
  );
}
