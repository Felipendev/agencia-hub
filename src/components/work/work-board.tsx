"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ClientePicker } from "@/components/cliente/ClientePicker";
import { listCustomersRemote } from "@/lib/api/list-customers-remote";
import { workApi } from "@/lib/work/api";
import {
  STATE_LABELS,
  FREQUENCY_LABELS,
  formatDate,
  todayLocal,
} from "@/lib/work/types";
import type {
  Task,
  Template,
  Run,
  Member,
  Product,
  TaskState,
  WorkEvent,
} from "@/lib/work/types";
import type { Cliente } from "@/types";
import {
  ApplyEditor,
  Responsible,
  RunEditor,
  selectClass,
  TaskEditor,
  TemplateEditor,
} from "./work-forms";

type Editor =
  | { type: "task"; task?: Task }
  | { type: "template"; model?: Template }
  | { type: "apply"; model: Template }
  | { type: "run"; run: Run };
const TAB_LABELS = {
  tasks: "Tarefas",
  templates: "Modelos",
  runs: "Execuções",
};
const ACTIONS: Record<string, string> = {
  CREATED: "Criado",
  UPDATED: "Editado",
  DELETED: "Excluído",
  OPEN: "Reaberto",
  DONE: "Concluído",
  CANCELLED: "Cancelado",
  MOVED_FROM: "Pessoa anterior",
};
function failure(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a operação.";
}
function Snapshot({ value }: { value: unknown }) {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  return (
    <div className="space-y-1 text-sm">
      <p className="font-medium">
        {String(data.title ?? data.name ?? "Registro")}
      </p>
      {typeof data.notes === "string" && data.notes && (
        <p className="whitespace-pre-wrap break-words">{data.notes}</p>
      )}
      {typeof data.dueOn === "string" && <p>Prazo: {formatDate(data.dueOn)}</p>}
      {typeof data.state === "string" && (
        <p>Situação: {STATE_LABELS[data.state as TaskState] ?? data.state}</p>
      )}
      {typeof data.cancelReason === "string" && data.cancelReason && (
        <p>Motivo: {data.cancelReason}</p>
      )}
      {typeof data.stateReason === "string" && data.stateReason && (
        <p>Motivo: {data.stateReason}</p>
      )}
      {Array.isArray(data.steps) && (
        <ol className="list-decimal pl-5">
          {data.steps.map((s: { title: string; dueOffsetDays: number }, i) => (
            <li key={i}>
              {s.title} · {s.dueOffsetDays} dia(s)
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
export function WorkBoard({ product }: { product: Product }) {
  const { token } = useAuth();
  const params = useSearchParams();
  const [tab, setTab] = useState<keyof typeof TAB_LABELS>("tasks");
  const [customerId, setCustomer] = useState(params.get("customerId") ?? "");
  const [responsibleId, setResponsible] = useState("");
  const [state, setState] = useState<TaskState | "">("OPEN");
  const [overdue, setOverdue] = useState(false);
  const [runId, setRunId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]),
    [templates, setTemplates] = useState<Template[]>([]),
    [runs, setRuns] = useState<Run[]>([]);
  const [customers, setCustomers] = useState<Cliente[]>([]),
    [members, setMembers] = useState<Member[]>([]);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [history, setHistory] = useState<{
    title: string;
    events: WorkEvent[];
  } | null>(null);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const mutation = useRef(false);
  const load = useCallback(async () => {
    if (!token) throw new Error("Entre no sistema para consultar as tarefas.");
    return Promise.all([
      workApi.tasks(token, {
        product,
        customerId: customerId || undefined,
        responsibleId: responsibleId || undefined,
        state: state || undefined,
        dueBefore: overdue ? todayLocal() : undefined,
        runId: runId || undefined,
      }),
      workApi.templates(token, product),
      workApi.runs(token, product, customerId || undefined),
      listCustomersRemote(token),
      workApi.members(token),
    ]);
  }, [token, product, customerId, responsibleId, state, overdue, runId]);
  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    setError("");
    load()
      .then(([t, m, r, c, u]) => {
        if (active) {
          setTasks(t);
          setTemplates(m);
          setRuns(r);
          setCustomers(c);
          setMembers(u);
        }
      })
      .catch((e) => {
        if (active) setError(failure(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, load, reload]);
  async function act(
    action: () => Promise<unknown>,
    message: string,
    after?: () => void,
  ) {
    if (mutation.current) return;
    mutation.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(message);
      after?.();
      setReload((v) => v + 1);
    } catch (e) {
      setError(failure(e));
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  }
  const open = (value: Editor) => {
    setEditor(value);
    setHistory(null);
    setNotice("");
    setError("");
    requestAnimationFrame(() =>
      panel.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };
  const close = () => setEditor(null);
  const showHistory = (
    type: "TASK" | "TEMPLATE" | "RUN",
    id: string,
    title: string,
  ) =>
    act(async () => {
      setHistory({ title, events: await workApi.history(token!, type, id) });
      setEditor(null);
    }, "");
  const selectedRun = runs.find((r) => r.id === runId);
  const disabled = busy || loading;
  return (
    <div className="space-y-5">
      <PageHeader
        title="Checklists e rotinas"
        description={`Atendimento de ${product === "TRAVEL" ? "Viagens" : "Milhas"}: tarefas avulsas e execuções por pessoa, com responsáveis e histórico.`}
      >
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={disabled || !token}
            onClick={() => open({ type: "task" })}
          >
            Nova tarefa
          </Button>
          <Button
            variant="secondary"
            disabled={disabled || !token}
            onClick={() => open({ type: "template" })}
          >
            Novo modelo
          </Button>
        </div>
      </PageHeader>
      <div className="grid gap-3 md:grid-cols-3">
        <fieldset disabled={disabled}>
          <ClientePicker
            clientes={customers}
            value={customerId}
            onChange={(id) => {
              setCustomer(id);
              setRunId("");
              setHistory(null);
            }}
            id="filter-work-person"
            label="Filtrar por pessoa"
            showNovoButton={false}
          />
        </fieldset>
        <fieldset disabled={disabled}>
          <Responsible
            id="filter-work-responsible"
            emptyLabel="Todos os responsáveis"
            members={members}
            value={responsibleId}
            onChange={setResponsible}
          />
        </fieldset>
        <fieldset disabled={disabled}>
          <Label htmlFor="filter-work-state">Situação das tarefas</Label>
          <select
            id="filter-work-state"
            className={selectClass}
            value={state}
            onChange={(e) => setState(e.target.value as TaskState | "")}
          >
            <option value="">Todas</option>
            {Object.entries(STATE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </fieldset>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label="Visualizações de tarefas"
          className="flex flex-wrap gap-1"
        >
          {Object.entries(TAB_LABELS).map(([key, label]) => (
            <Button
              key={key}
              variant={tab === key ? "primary" : "ghost"}
              disabled={busy}
              aria-pressed={tab === key}
              onClick={() => setTab(key as keyof typeof TAB_LABELS)}
            >
              {label}
            </Button>
          ))}
        </nav>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={overdue}
            disabled={disabled}
            onChange={(e) => setOverdue(e.target.checked)}
          />
          Somente tarefas atrasadas
        </label>
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          <p>{error}</p>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => setReload((v) => v + 1)}
          >
            Recarregar dados
          </Button>
          <p className="text-xs">
            Se houver conflito, reabra o registro após recarregar. Seu
            formulário atual foi preservado.
          </p>
        </div>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900"
        >
          {notice}
        </p>
      )}
      <div ref={panel}>
        {editor && token && (
          <Card padding="p-4 sm:p-5">
            {editor.type === "task" && (
              <TaskEditor
                key={editor.task?.id ?? "new-task"}
                token={token}
                product={product}
                task={editor.task}
                customers={customers}
                members={members}
                customerId={customerId}
                busy={busy}
                cancel={close}
                save={(input, key) =>
                  act(
                    () => workApi.saveTask(token, input, editor.task?.id, key),
                    "Tarefa salva.",
                    close,
                  )
                }
              />
            )}
            {editor.type === "template" && (
              <TemplateEditor
                key={editor.model?.id ?? "new-template"}
                product={product}
                model={editor.model}
                busy={busy}
                cancel={close}
                save={(input) =>
                  act(
                    () => workApi.saveTemplate(token, input, editor.model?.id),
                    "Modelo salvo. Execuções anteriores foram preservadas.",
                    close,
                  )
                }
              />
            )}
            {editor.type === "apply" && (
              <ApplyEditor
                key={editor.model.id}
                model={editor.model}
                customers={customers}
                members={members}
                customerId={customerId}
                busy={busy}
                cancel={close}
                save={(person, date, member) =>
                  act(
                    async () => {
                      const r = await workApi.apply(
                        token,
                        editor.model.id,
                        person,
                        date,
                        member,
                      );
                      setRunId(r.id);
                      setCustomer(person);
                      setState("");
                      setResponsible("");
                      setOverdue(false);
                      setTab("tasks");
                    },
                    "Execução disponível. Se o modelo já havia sido aplicado nesse período, a execução anterior foi reutilizada.",
                    close,
                  )
                }
              />
            )}
            {editor.type === "run" && (
              <RunEditor
                key={editor.run.id}
                run={editor.run}
                busy={busy}
                cancel={close}
                save={(title, notes) =>
                  act(
                    () => workApi.saveRun(token, editor.run, title, notes),
                    "Execução atualizada.",
                    close,
                  )
                }
              />
            )}
          </Card>
        )}
      </div>
      {history && (
        <Card padding="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold">Histórico: {history.title}</h2>
            <Button variant="ghost" onClick={() => setHistory(null)}>
              Fechar histórico
            </Button>
          </div>
          <ol className="space-y-3">
            {history.events.map((e) => (
              <li
                key={e.id}
                className="border-t border-[var(--hub-border)] pt-3"
              >
                <p className="text-sm font-medium">
                  {ACTIONS[e.action] ?? e.action} ·{" "}
                  {new Date(e.createdAt).toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-[var(--hub-text-muted)]">
                  Autor:{" "}
                  {members.find((m) => m.id === e.authorId)?.name ??
                    `Membro ${e.authorId.slice(0, 8)}`}
                </p>
                <details className="mt-1">
                  <summary className="cursor-pointer text-sm">
                    Consultar versão registrada
                  </summary>
                  <Snapshot value={e.snapshot} />
                </details>
              </li>
            ))}
          </ol>
        </Card>
      )}
      {loading && (
        <p role="status" className="text-sm text-[var(--hub-text-muted)]">
          Carregando tarefas e rotinas…
        </p>
      )}
      {!loading && !error && tab === "tasks" && (
        <>
          {runId && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>
                Execução: {selectedRun?.title ?? "selecionada"}
                {selectedRun?.cancelledAt ? " · cancelada" : ""}
              </span>
              <Button
                variant="ghost"
                onClick={() => setRunId("")}
                disabled={busy}
              >
                Ver todas as execuções
              </Button>
            </div>
          )}
          {tasks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--hub-border)] p-6 text-center text-sm">
              Nenhuma tarefa com esses filtros. Crie uma tarefa ou aplique um
              modelo.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--hub-border)] rounded-lg border border-[var(--hub-border)] bg-white">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex flex-col justify-between gap-3 p-4 lg:flex-row"
                >
                  <div className="min-w-0 space-y-1">
                    <h2 className="break-words font-medium">{task.title}</h2>
                    <p className="text-sm text-[var(--hub-text-secondary)]">
                      {task.customerName} ·{" "}
                      {task.responsibleName ?? "Sem responsável"}
                    </p>
                    <p
                      className={`text-sm ${task.state === "OPEN" && task.dueOn < todayLocal() ? "text-red-700" : "text-[var(--hub-text-muted)]"}`}
                    >
                      {STATE_LABELS[task.state]} · Prazo{" "}
                      {formatDate(task.dueOn)}
                      {task.runId ? " · De uma execução" : " · Avulsa"}
                    </p>
                    {task.notes && (
                      <p className="whitespace-pre-wrap break-words text-sm">
                        {task.notes}
                      </p>
                    )}
                    {task.stateAt && (
                      <p className="text-xs text-[var(--hub-text-muted)]">
                        Última transição:{" "}
                        {new Date(task.stateAt).toLocaleString("pt-BR")} ·{" "}
                        {members.find((m) => m.id === task.stateBy)?.name ??
                          "Membro da agência"}
                      </p>
                    )}
                    {task.stateReason && (
                      <p className="break-words text-sm">
                        Motivo: {task.stateReason}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-start gap-1 lg:max-w-80">
                    {task.state === "OPEN" ? (
                      <>
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            void act(
                              () => workApi.state(token!, task, "DONE"),
                              "Tarefa concluída.",
                            )
                          }
                        >
                          Concluir
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busy}
                          onClick={() => open({ type: "task", task })}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => {
                            const reason = window.prompt(
                              "Motivo do cancelamento:",
                            );
                            if (reason?.trim())
                              void act(
                                () =>
                                  workApi.state(
                                    token!,
                                    task,
                                    "CANCELLED",
                                    reason,
                                  ),
                                "Tarefa cancelada.",
                              );
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => {
                            if (
                              window.confirm(
                                "Excluir esta tarefa? O histórico da exclusão será preservado.",
                              )
                            )
                              void act(
                                () => workApi.deleteTask(token!, task),
                                "Tarefa excluída.",
                              );
                          }}
                        >
                          Excluir
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() =>
                          void act(
                            () => workApi.state(token!, task, "OPEN"),
                            "Tarefa reaberta.",
                          )
                        }
                      >
                        Reabrir
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() =>
                        void showHistory("TASK", task.id, task.title)
                      }
                    >
                      Histórico
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-[var(--hub-text-muted)]">
            Tarefas encerradas preservam o histórico. Reabra antes de editar ou
            excluir. Execuções canceladas não permitem reabrir suas tarefas.
          </p>
        </>
      )}
      {!loading && !error && tab === "templates" && (
        <div className="space-y-3">
          {templates.length === 0 && (
            <p className="rounded-lg border border-dashed border-[var(--hub-border)] p-6 text-center text-sm">
              Nenhum modelo de {product === "TRAVEL" ? "Viagens" : "Milhas"}.
              Crie o primeiro modelo para reutilizar suas etapas.
            </p>
          )}
          {templates.map((model) => (
            <Card key={model.id} padding="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-medium">{model.name}</h2>
                  <p className="text-sm text-[var(--hub-text-muted)]">
                    {FREQUENCY_LABELS[model.frequency]} · {model.steps.length}{" "}
                    etapas · versão {model.version}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => open({ type: "apply", model })}
                  >
                    Aplicar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => open({ type: "template", model })}
                  >
                    Editar modelo
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() =>
                      void showHistory("TEMPLATE", model.id, model.name)
                    }
                  >
                    Histórico
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Excluir o modelo? Execuções e tarefas existentes serão preservadas.",
                        )
                      )
                        void act(
                          () => workApi.deleteTemplate(token!, model),
                          "Modelo excluído. As execuções foram preservadas.",
                        );
                    }}
                  >
                    Excluir modelo
                  </Button>
                </div>
              </div>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
                {model.steps.map((step, i) => (
                  <li key={i}>
                    {step.title} · {step.dueOffsetDays} dia(s) após o início
                  </li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      )}
      {!loading && !error && tab === "runs" && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--hub-text-muted)]">
            Execuções são preservadas para rastreabilidade. Edite título e
            observações ou cancele a execução; cancelar encerra apenas tarefas
            abertas, mantendo as concluídas. Não há exclusão de execução.
          </p>
          {runs.length === 0 && (
            <p className="rounded-lg border border-dashed border-[var(--hub-border)] p-6 text-center text-sm">
              Nenhuma execução. Aplique um modelo na aba Modelos.
            </p>
          )}
          {runs.map((run) => (
            <Card key={run.id} padding="p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="break-words font-medium">{run.title}</h2>
                  <p className="text-sm">
                    {run.customerName} ·{" "}
                    {run.cancelledAt ? "Cancelada" : "Ativa"}
                  </p>
                  <p className="text-xs text-[var(--hub-text-muted)]">
                    {formatDate(run.periodStart)} a {formatDate(run.periodEnd)}{" "}
                    · modelo versão {run.snapshot.version}
                  </p>
                  {run.cancelReason && (
                    <p className="mt-2 text-sm">Motivo: {run.cancelReason}</p>
                  )}
                  {run.notes && (
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm">
                      {run.notes}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-start gap-1">
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => {
                      setRunId(run.id);
                      setState("");
                      setResponsible("");
                      setOverdue(false);
                      setTab("tasks");
                    }}
                  >
                    Ver tarefas
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => open({ type: "run", run })}
                  >
                    Editar execução
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => void showHistory("RUN", run.id, run.title)}
                  >
                    Histórico
                  </Button>
                  {!run.cancelledAt && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => {
                        const reason = window.prompt(
                          "Motivo do cancelamento da execução:",
                        );
                        if (reason?.trim())
                          void act(
                            () => workApi.cancelRun(token!, run, reason),
                            "Execução cancelada. Tarefas concluídas foram preservadas.",
                          );
                      }}
                    >
                      Cancelar execução
                    </Button>
                  )}
                </div>
              </div>
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer">
                  Consultar modelo aplicado
                </summary>
                <ol className="mt-2 list-decimal pl-5">
                  {run.snapshot.steps.map((step, i) => (
                    <li key={i}>
                      {step.title} · prazo relativo {step.dueOffsetDays} dia(s)
                    </li>
                  ))}
                </ol>
              </details>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
