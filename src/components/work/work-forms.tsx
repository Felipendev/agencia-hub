"use client";

import { useEffect, useState } from "react";
import { ClientePicker } from "@/components/cliente/ClientePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { workApi } from "@/lib/work/api";
import { FREQUENCY_LABELS, todayLocal } from "@/lib/work/types";
import type {
  Member,
  Product,
  Task,
  TaskInput,
  Template,
  TemplateInput,
  Frequency,
  References,
  Run,
} from "@/lib/work/types";
import type { Cliente } from "@/types";

export const selectClass =
  "h-10 w-full rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-[var(--hub-blue)]";
export const textClass = `${selectClass} min-h-24 py-2`;
type Base = { busy: boolean; cancel: () => void };
type People = { customers: Cliente[]; members: Member[]; customerId?: string };
function Actions({
  busy,
  cancel,
  label = "Salvar",
}: Base & { label?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="submit" disabled={busy}>
        {busy ? "Salvando…" : label}
      </Button>
      <Button variant="secondary" onClick={cancel} disabled={busy}>
        Cancelar
      </Button>
    </div>
  );
}
export function Responsible({
  members,
  value,
  onChange,
  id,
  emptyLabel = "Sem responsável",
}: {
  members: Member[];
  value: string;
  onChange: (value: string) => void;
  id: string;
  emptyLabel?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>Responsável</Label>
      <select
        id={id}
        className={selectClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{emptyLabel}</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </div>
  );
}
export function TaskEditor({
  token,
  product,
  task,
  customers,
  members,
  customerId = "",
  busy,
  cancel,
  save,
}: Base &
  People & {
    token: string;
    product: Product;
    task?: Task;
    save: (input: TaskInput, key: string) => Promise<void>;
  }) {
  const [person, setPerson] = useState(task?.customerId ?? customerId);
  const [title, setTitle] = useState(task?.title ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [dueOn, setDueOn] = useState(task?.dueOn ?? todayLocal());
  const [responsibleId, setResponsible] = useState(task?.responsibleId ?? "");
  const [tripId, setTrip] = useState(task?.tripId ?? "");
  const [quotationId, setQuotation] = useState(task?.quotationId ?? "");
  const [references, setReferences] = useState<References | null>(null);
  const [refError, setRefError] = useState("");
  // Retain the key across failures/retries, including lost responses after a successful write.
  const [key] = useState(() => crypto.randomUUID());
  useEffect(() => {
    if (product !== "TRAVEL" || !person) return;
    let active = true;
    workApi
      .references(token, person)
      .then((value) => {
        if (active) {
          setReferences(value);
          setRefError("");
        }
      })
      .catch((e: Error) => {
        if (active) {
          setReferences(null);
          setRefError(e.message);
        }
      });
    return () => {
      active = false;
    };
  }, [token, product, person]);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save(
          {
            product,
            customerId: person,
            title,
            notes,
            dueOn,
            responsibleId: responsibleId || null,
            tripId: tripId || null,
            quotationId: quotationId || null,
            expectedVersion: task?.version ?? 0,
          },
          key,
        );
      }}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold">
        {task ? "Editar tarefa" : "Nova tarefa avulsa"}
      </h2>
      <fieldset disabled={busy} className="space-y-4">
        <ClientePicker
          clientes={customers}
          value={person}
          onChange={(id) => {
            setPerson(id);
            setTrip("");
            setQuotation("");
            setReferences(null);
            setRefError("");
          }}
          id="work-person"
          required
          disabled={!!task?.runId}
          showNovoButton={false}
        />
        <div>
          <Label htmlFor="work-title">Tarefa</Label>
          <Input
            id="work-title"
            required
            maxLength={180}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="work-due">Prazo</Label>
            <Input
              id="work-due"
              type="date"
              required
              value={dueOn}
              onChange={(e) => setDueOn(e.target.value)}
            />
          </div>
          <Responsible
            id="work-responsible"
            members={members}
            value={responsibleId}
            onChange={setResponsible}
          />
        </div>
        {product === "TRAVEL" && person && (
          <div className="space-y-2">
            <p className="text-xs text-[var(--hub-text-muted)]">
              Vínculos opcionais da pessoa selecionada.
            </p>
            {refError && (
              <p role="alert" className="text-sm text-red-700">
                Não foi possível carregar os vínculos: {refError}. Você pode
                continuar sem alterá-los.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="work-trip">Viagem</Label>
                <select
                  id="work-trip"
                  className={selectClass}
                  value={tripId}
                  disabled={!references}
                  onChange={(e) => setTrip(e.target.value)}
                >
                  <option value="">Sem vínculo</option>
                  {references?.trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="work-quotation">Cotação</Label>
                <select
                  id="work-quotation"
                  className={selectClass}
                  value={quotationId}
                  disabled={!references}
                  onChange={(e) => setQuotation(e.target.value)}
                >
                  <option value="">Sem vínculo</option>
                  {references?.quotations.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        <div>
          <Label htmlFor="work-notes">Observações</Label>
          <textarea
            id="work-notes"
            className={textClass}
            maxLength={4000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <p className="text-xs text-[var(--hub-text-muted)]">
          Produto: {product === "TRAVEL" ? "Viagens" : "Milhas"}.{" "}
          {task?.runId
            ? "A pessoa e o produto da execução são preservados."
            : "O produto permanece o mesmo após salvar."}
        </p>
        <Actions busy={busy} cancel={cancel} />
      </fieldset>
    </form>
  );
}
export function TemplateEditor({
  product,
  model,
  busy,
  cancel,
  save,
}: Base & {
  product: Product;
  model?: Template;
  save: (input: TemplateInput) => Promise<void>;
}) {
  const [name, setName] = useState(model?.name ?? "");
  const [frequency, setFrequency] = useState<Frequency>(
    model?.frequency ?? "ONCE",
  );
  const [steps, setSteps] = useState(
    model?.steps ?? [{ title: "", dueOffsetDays: 0 }],
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save({
          product,
          name,
          frequency,
          steps,
          expectedVersion: model?.version ?? 0,
        });
      }}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold">
        {model ? "Editar modelo" : "Novo modelo"}
      </h2>
      <fieldset disabled={busy} className="space-y-4">
        <div>
          <Label htmlFor="model-name">Nome do modelo</Label>
          <Input
            id="model-name"
            required
            maxLength={180}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="model-frequency">Tipo</Label>
          <select
            id="model-frequency"
            className={selectClass}
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as Frequency)}
          >
            {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-[var(--hub-text-muted)]">
          Os prazos contam a partir da data-base do checklist, da segunda-feira
          da semana ou do primeiro dia do mês. A geração é feita ao aplicar o
          modelo.
        </p>
        {steps.map((step, index) => (
          <div
            key={index}
            className="grid items-end gap-2 sm:grid-cols-[1fr_120px_auto]"
          >
            <div>
              <Label htmlFor={`step-${index}`}>Etapa {index + 1}</Label>
              <Input
                id={`step-${index}`}
                required
                maxLength={180}
                value={step.title}
                onChange={(e) =>
                  setSteps(
                    steps.map((s, i) =>
                      i === index ? { ...s, title: e.target.value } : s,
                    ),
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor={`offset-${index}`}>Prazo em dias</Label>
              <Input
                id={`offset-${index}`}
                type="number"
                required
                min={0}
                max={366}
                step={1}
                value={step.dueOffsetDays}
                onChange={(e) =>
                  setSteps(
                    steps.map((s, i) =>
                      i === index
                        ? { ...s, dueOffsetDays: Number(e.target.value) }
                        : s,
                    ),
                  )
                }
              />
            </div>
            <Button
              variant="ghost"
              disabled={steps.length === 1}
              onClick={() => setSteps(steps.filter((_, i) => i !== index))}
              aria-label={`Remover etapa ${index + 1}`}
            >
              Remover
            </Button>
          </div>
        ))}
        <Button
          variant="secondary"
          disabled={steps.length >= 50}
          onClick={() => setSteps([...steps, { title: "", dueOffsetDays: 0 }])}
        >
          Adicionar etapa
        </Button>
        {model && (
          <p className="text-xs text-[var(--hub-text-muted)]">
            Salvar altera este modelo. Execuções anteriores conservam as etapas
            e prazos originais.
          </p>
        )}
        <Actions busy={busy} cancel={cancel} />
      </fieldset>
    </form>
  );
}
export function ApplyEditor({
  model,
  customers,
  members,
  customerId = "",
  busy,
  cancel,
  save,
}: Base &
  People & {
    model: Template;
    save: (
      customer: string,
      date: string,
      responsibleId: string | null,
    ) => Promise<void>;
  }) {
  const [person, setPerson] = useState(customerId),
    [date, setDate] = useState(todayLocal()),
    [responsible, setResponsible] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void save(person, date, responsible || null);
      }}
    >
      <h2 className="text-lg font-semibold">Aplicar: {model.name}</h2>
      <fieldset disabled={busy} className="space-y-4">
        <ClientePicker
          clientes={customers}
          value={person}
          onChange={setPerson}
          id="apply-person"
          required
          showNovoButton={false}
        />
        <div>
          <Label htmlFor="apply-date">
            {model.frequency === "ONCE"
              ? "Data-base"
              : "Data dentro do período"}
          </Label>
          <Input
            id="apply-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <Responsible
          id="apply-responsible"
          members={members}
          value={responsible}
          onChange={setResponsible}
        />
        <p className="text-sm text-[var(--hub-text-muted)]">
          {model.frequency === "ONCE"
            ? "Este checklist inicial tem uma execução por pessoa."
            : model.frequency === "WEEKLY"
              ? "Período de segunda a domingo; prazos contam a partir da segunda-feira."
              : "Período do mês selecionado; prazos contam a partir do dia 1."}{" "}
          Repetir a aplicação abre a execução existente, inclusive se ela
          estiver cancelada. Nenhuma tarefa é gerada automaticamente.
        </p>
        <Actions busy={busy} cancel={cancel} label="Aplicar modelo" />
      </fieldset>
    </form>
  );
}
export function RunEditor({
  run,
  busy,
  cancel,
  save,
}: Base & { run: Run; save: (title: string, notes: string) => Promise<void> }) {
  const [title, setTitle] = useState(run.title),
    [notes, setNotes] = useState(run.notes);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void save(title, notes);
      }}
    >
      <h2 className="text-lg font-semibold">Editar execução</h2>
      <fieldset disabled={busy} className="space-y-4">
        <div>
          <Label htmlFor="run-title">Título</Label>
          <Input
            id="run-title"
            required
            maxLength={180}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="run-notes">Observações</Label>
          <textarea
            id="run-notes"
            className={textClass}
            maxLength={4000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <p className="text-sm text-[var(--hub-text-muted)]">
          Pessoa, produto, período e cópia do modelo são preservados. Edite
          prazos e responsáveis nas tarefas da execução.
        </p>
        <Actions busy={busy} cancel={cancel} />
      </fieldset>
    </form>
  );
}
