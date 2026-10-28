"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  accumulationReport,
  calculateAccumulation,
  matchesSimulationFilter,
  type AccumulationAssumptions,
  type SavedSimulation,
  type SimulationVersion,
} from "@/lib/accumulation-simulation";
import { ClientePicker } from "@/components/cliente/ClientePicker";
import { listCustomersRemote } from "@/lib/api/list-customers-remote";
import type { Cliente } from "@/types";

const initial: AccumulationAssumptions = {
  title: "Novo cenário",
  monthlySpending: 10000,
  pointsPerDollar: 2,
  exchangeRate: 5,
  exchangeDate: new Date().toISOString().slice(0, 10),
  months: 12,
  passengers: 1,
  milesPerPassenger: 80000,
  destination: "",
  scenarios: [{ program: "Programa escolhido", bonusPercent: 0 }],
};
const count = (value: number) =>
  value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

function SimulationPlanner() {
  const { token } = useAuth();
  const params = useSearchParams();
  const initialCustomer = params.get("customerId") ?? "";
  const simulationId = params.get("simulationId") ?? "";
  const [opening, setOpening] = useState(!!simulationId);
  const [openFailed, setOpenFailed] = useState(false);
  const [customers, setCustomers] = useState<Cliente[]>([]);
  const [customersError, setCustomersError] = useState("");
  const [customerId, setCustomerId] = useState(initialCustomer);
  const [filterCustomer, setFilterCustomer] = useState(initialCustomer);
  const [unlinked, setUnlinked] = useState(false);
  const [retry, setRetry] = useState(0);
  const [listError, setListError] = useState("");
  const [copyPrepared, setCopyPrepared] = useState(false);
  const base = getAgenciaHubApiBaseUrl();
  const [input, setInput] = useState(initial);
  const [saved, setSaved] = useState<SavedSimulation[]>([]);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<{
    id: string;
    version: number;
    customerId: string | null;
  } | null>(null);
  const [history, setHistory] = useState<{
    id: string;
    title: string;
    rows: SimulationVersion[];
  } | null>(null);
  const pending = useRef(false);
  const result = calculateAccumulation(input);

  useEffect(() => {
    if (!token) return;
    let active = true;
    listCustomersRemote(token)
      .then((rows) => {
        if (active) {
          setCustomers(rows);
          setCustomersError("");
        }
      })
      .catch((e: Error) => {
        if (active) setCustomersError(e.message);
      });
    return () => {
      active = false;
    };
  }, [token, retry]);

  useEffect(() => {
    if (!token || !base || !simulationId) return;
    setOpening(true);
    setOpenFailed(false);
    const controller = new AbortController();
    fetch(
      `${base}/accumulation-simulations/${encodeURIComponent(simulationId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      },
    )
      .then(async (r) => {
        if (!r.ok)
          throw new Error(
            "Não foi possível abrir o plano solicitado nesta agência.",
          );
        return r.json() as Promise<SavedSimulation>;
      })
      .then((row) => {
        if(controller.signal.aborted)return;
        setInput(row.assumptions);
        setCustomerId(row.customerId ?? "");
        setEditing({
          id: row.id,
          version: row.version,
          customerId: row.customerId,
        });
        setCopyPrepared(false);
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") {
          setError(e.message);
          setOpenFailed(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setOpening(false);
      });
    return () => controller.abort();
  }, [token, base, simulationId]);

  useEffect(() => {
    if (!token || !base) return;
    const controller = new AbortController();
    const query = new URLSearchParams();
    if (filterCustomer) query.set("customerId", filterCustomer);
    if (unlinked) query.set("unlinked", "true");
    setLoaded(false);
    setListError("");
    fetch(`${base}/accumulation-simulations${query.size ? `?${query}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok)
          throw new Error("Não foi possível carregar as simulações salvas.");
        return r.json() as Promise<SavedSimulation[]>;
      })
      .then((rows) => {
        if(controller.signal.aborted)return;
        setSaved(rows);
        setLoaded(true);
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") {
          setListError(e.message);
          setSaved([]);
        }
      });
    return () => controller.abort();
  }, [base, token, filterCustomer, unlinked, retry]);

  async function request(path: string, init: RequestInit) {
    if (!token || !base)
      throw new Error("Conecte-se para salvar simulações da agência.");
    const response = await fetch(`${base}/accumulation-simulations${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...init.headers },
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.message || "Não foi possível concluir a operação.");
    }
    return response;
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!result || pending.current || opening || openFailed) return;
    if (!customerId) {
      setError(
        "Selecione uma pessoa da agência para salvar. O cálculo avulso não grava dados.",
      );
      return;
    }
    if (
      editing &&
      editing.customerId !== customerId &&
      !window.confirm(
        editing.customerId
          ? "Trocar o cliente deste plano? As versões anteriores manterão o vínculo antigo."
          : "Associar este cenário legado ao cliente selecionado? As versões antigas continuarão sem cliente.",
      )
    )
      return;
    if (
      !editing &&
      copyPrepared &&
      !window.confirm(
        `Criar uma cópia para ${customers.find((c) => c.id === customerId)?.nome ?? "o cliente selecionado"}? O cenário original será preservado.`,
      )
    )
      return;
    pending.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const row: SavedSimulation = await (
        await request(editing ? `/${editing.id}` : "", {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId,
            assumptions: input,
            ...(editing ? { expectedVersion: editing.version } : {}),
          }),
        })
      ).json();
      setSaved((rows) => [
        ...(matchesSimulationFilter(row, filterCustomer, unlinked)
          ? [row]
          : []),
        ...rows.filter((r) => r.id !== row.id),
      ]);
      setLoaded(true);
      setCustomerId(row.customerId ?? "");
      setCopyPrepared(false);
      if (editing) {
        setEditing({
          id: row.id,
          version: row.version,
          customerId: row.customerId,
        });
        setInput(row.assumptions);
        setNotice(
          "Alterações salvas. A versão anterior permanece no histórico.",
        );
      } else {
        setInput({
          ...initial,
          exchangeDate: new Date().toISOString().slice(0, 10),
        });
        setNotice("Simulação criada para consulta pela equipe.");
      }
      if (history?.id === row.id) setHistory(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function remove(row: SavedSimulation) {
    if (
      pending.current ||
      !window.confirm(
        `Excluir a simulação “${row.assumptions.title}” e seu histórico de versões? Tarefas já geradas e sua origem serão preservadas.`,
      )
    )
      return;
    pending.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await request(`/${row.id}?expectedVersion=${row.version}`, {
        method: "DELETE",
      });
      setSaved((rows) => rows.filter((r) => r.id !== row.id));
      if (editing?.id === row.id) {
        setEditing(null);
        setInput(initial);
      }
      if (history?.id === row.id) setHistory(null);
      setNotice("Simulação excluída.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function edit(row: SavedSimulation) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const current: SavedSimulation = await (
        await request(`/${row.id}`, { method: "GET" })
      ).json();
      setInput(current.assumptions);
      setEditing({
        id: current.id,
        version: current.version,
        customerId: current.customerId,
      });
      setCustomerId(current.customerId ?? "");
      setCopyPrepared(false);
      setNotice(
        "Editando o cenário existente. Salvar alterações mantém o mesmo registro.",
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível carregar o cenário.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function showHistory(row: SavedSimulation) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const rows: SimulationVersion[] = await (
        await request(`/${row.id}/history`, { method: "GET" })
      ).json();
      setHistory({ id: row.id, title: row.assumptions.title, rows });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível carregar o histórico.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  function duplicate(
    assumptions: AccumulationAssumptions,
    client: string | null,
  ) {
    setCustomerId(client ?? "");
    setCopyPrepared(true);
    setEditing(null);
    setInput({
      ...assumptions,
      title: `${assumptions.title} (cópia)`.slice(0, 200),
      scenarios: assumptions.scenarios.map((s) => ({ ...s })),
    });
    setNotice(
      "Cópia preparada. Salve para criar uma nova simulação, sem alterar a original.",
    );
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function download(assumptions = input, projection = result) {
    if (!projection) return;
    const url = URL.createObjectURL(
      new Blob([accumulationReport(assumptions, projection)], {
        type: "text/html;charset=utf-8",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "simulacao-acumulo.html";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const field = (
    key: keyof AccumulationAssumptions,
    value: string | number,
  ) => {
    setInput((current) => ({ ...current, [key]: value }));
    setNotice("");
  };
  const numeric = (
    key:
      | "monthlySpending"
      | "pointsPerDollar"
      | "exchangeRate"
      | "months"
      | "passengers"
      | "milesPerPassenger",
    label: string,
    min: number,
    max: number,
    step = "1",
  ) => (
    <label className="space-y-1 text-sm">
      {label}
      <Input
        type="number"
        required
        min={min}
        max={max}
        step={step}
        value={Number.isNaN(input[key]) ? "" : input[key]}
        onChange={(e) =>
          field(key, e.target.value === "" ? NaN : Number(e.target.value))
        }
      />
    </label>
  );

  return (
    <div className="space-y-6">
      <Link
        href="/milhas"
        className="text-sm font-medium text-[var(--hub-blue)] hover:underline"
      >
        ← Milhas
      </Link>
      <Link href="/milhas/simulador/tarefas-geradas" className="ml-4 text-sm underline">Histórico de gerações de tarefas</Link>
      <div>
        <h1 className="text-2xl font-semibold">Simulador de acúmulo</h1>
        <p className="text-sm text-muted-foreground">
          Planeje pontos e metas de viagem a partir dos gastos do cliente.
        </p>
      </div>
      <p className="rounded-xl border bg-white p-4 text-sm">
        Os valores iniciais são um exemplo. Informe as condições do cliente.
        Bônus são hipóteses e cada programa é uma alternativa; os resultados não
        são somados nem alteram saldos reais.
      </p>
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
      {opening && <p role="status">Abrindo o plano salvo…</p>}
      {customersError && (
        <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm">
          <p>Não foi possível carregar as pessoas: {customersError}</p>
          <Button variant="secondary" onClick={() => setRetry((r) => r + 1)}>
            Tentar carregar pessoas
          </Button>
        </div>
      )}
      <form
        onSubmit={save}
        className="space-y-5 rounded-xl border bg-white p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">
            {editing
              ? `Editar simulação · versão ${editing.version}`
              : "Nova simulação"}
          </h2>
          <Button
            type="button"
            variant="secondary"
            disabled={busy || opening}
            onClick={() => {
              setOpenFailed(false);
              setCustomerId(initialCustomer);
              setCopyPrepared(false);
              setEditing(null);
              setInput({
                ...initial,
                exchangeDate: new Date().toISOString().slice(0, 10),
              });
              setError("");
              setNotice("");
            }}
          >
            {editing ? "Cancelar edição" : "Limpar formulário"}
          </Button>
        </div>
        <fieldset disabled={busy || opening} className="contents">
          <ClientePicker
            clientes={customers}
            value={customerId}
            onChange={setCustomerId}
            id="simulation-customer"
            label="Cliente do plano"
            required
            showNovoButton={false}
          />
          <p className="text-xs text-[var(--hub-text-muted)]">
            Calcular não exige cliente nem grava dados. Para salvar, selecione
            uma pessoa da agência. Salvar um plano não cria carteira ou conta de
            milhas.
          </p>
          {editing && (
            <p className="text-sm text-[var(--hub-text-muted)]">
              {editing.customerId
                ? "Trocar o cliente exige confirmação e mantém os vínculos anteriores no histórico."
                : "Cenário legado: escolha o cliente para associar. Versões antigas continuarão sem vínculo."}
            </p>
          )}
          {copyPrepared && (
            <p className="text-sm">
              Cópia preparada. Confira o cliente; a criação pedirá sua
              confirmação.
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1 text-sm">
              Nome da simulação
              <Input
                required
                maxLength={200}
                value={input.title}
                onChange={(e) => field("title", e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              Destino ou objetivo
              <Input
                required
                maxLength={200}
                placeholder="Ex.: viagem para Lisboa"
                value={input.destination}
                onChange={(e) => field("destination", e.target.value)}
              />
            </label>
            {numeric(
              "monthlySpending",
              "Gasto mensal (R$)",
              0,
              10000000,
              "0.01",
            )}
            {numeric("pointsPerDollar", "Pontos por dólar", 0, 100, "0.01")}
            {numeric(
              "exchangeRate",
              "Câmbio informado (R$ por US$)",
              0.01,
              1000000,
              "0.0001",
            )}
            <label className="space-y-1 text-sm">
              Data do câmbio
              <Input
                type="date"
                required
                max={new Date().toISOString().slice(0, 10)}
                value={input.exchangeDate}
                onChange={(e) => field("exchangeDate", e.target.value)}
              />
            </label>
            {numeric("months", "Prazo (meses)", 1, 120)}
            {numeric("passengers", "Passageiros", 1, 99)}
            {numeric(
              "milesPerPassenger",
              "Meta de milhas por passageiro",
              1,
              1000000000,
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">Cenários de transferência</h2>
            <Button
              type="button"
              variant="secondary"
              disabled={input.scenarios.length >= 10}
              onClick={() =>
                setInput((current) => ({
                  ...current,
                  scenarios: [
                    ...current.scenarios,
                    { program: "", bonusPercent: 0 },
                  ],
                }))
              }
            >
              Adicionar programa
            </Button>
          </div>
          {input.scenarios.map((scenario, index) => (
            <div key={index} className="flex flex-wrap items-end gap-3">
              <label className="flex-1 space-y-1 text-sm">
                Programa
                <Input
                  required
                  maxLength={100}
                  value={scenario.program}
                  onChange={(e) =>
                    setInput((current) => ({
                      ...current,
                      scenarios: current.scenarios.map((s, i) =>
                        i === index ? { ...s, program: e.target.value } : s,
                      ),
                    }))
                  }
                />
              </label>
              <label className="space-y-1 text-sm">
                Bônus hipotético (%)
                <Input
                  type="number"
                  required
                  min={0}
                  max={1000}
                  step="0.01"
                  value={
                    Number.isNaN(scenario.bonusPercent)
                      ? ""
                      : scenario.bonusPercent
                  }
                  onChange={(e) =>
                    setInput((current) => ({
                      ...current,
                      scenarios: current.scenarios.map((s, i) =>
                        i === index
                          ? {
                              ...s,
                              bonusPercent:
                                e.target.value === ""
                                  ? NaN
                                  : Number(e.target.value),
                            }
                          : s,
                      ),
                    }))
                  }
                />
              </label>
              <Button
                type="button"
                variant="secondary"
                aria-label={`Remover programa ${index + 1}`}
                onClick={() =>
                  setInput((current) => ({
                    ...current,
                    scenarios: current.scenarios.filter((_, i) => i !== index),
                  }))
                }
              >
                Remover
              </Button>
            </div>
          ))}
          {!result && (
            <p role="alert" className="text-sm text-red-700">
              Revise os valores, prazos e programas para calcular a projeção.
            </p>
          )}
          <Button
            disabled={
              busy ||
              opening ||
              openFailed ||
              !result ||
              !token ||
              !base ||
              !customerId ||
              !!customersError
            }
            type="submit"
          >
            {busy
              ? "Salvando…"
              : editing
                ? "Salvar alterações"
                : "Criar simulação"}
          </Button>
        </fieldset>
      </form>
      {result && (
        <section className="space-y-4 rounded-xl border bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">Projeção do planejamento</h2>
            <Button variant="secondary" onClick={() => download()}>
              Baixar relatório
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Pontos por mês", result.monthlyPoints],
              ["Pontos no período", result.basePoints],
              ["Meta do grupo", result.goalMiles],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="border-l-2 border-slate-300 pl-4"
              >
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-semibold">{count(Number(value))}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-3">Programa</th>
                  <th>Bônus hipotético</th>
                  <th>Milhas projetadas</th>
                  <th>Meta</th>
                </tr>
              </thead>
              <tbody>
                {result.scenarios.map((s, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-3">{s.program}</td>
                    <td>{count(s.bonusPercent)}%</td>
                    <td>{count(s.projectedMiles)}</td>
                    <td>
                      {s.goalReached
                        ? "Alcançada no cenário"
                        : `Faltam ${count(s.remainingMiles)} milhas`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Fórmula: gasto mensal ÷ câmbio × pontos por dólar × meses. O bônus é
            aplicado separadamente por programa. A meta não garante
            disponibilidade de passagem. Abra o relatório baixado para imprimir
            ou salvar em PDF.
          </p>
        </section>
      )}
      <section className="space-y-3">
        <h2 className="font-semibold">Simulações salvas da agência</h2>
        <fieldset
          disabled={busy || opening}
          className="grid gap-3 sm:grid-cols-2"
        >
          <ClientePicker
            clientes={customers}
            value={filterCustomer}
            onChange={(value) => {
              setFilterCustomer(value);
              setUnlinked(false);
              setHistory(null);
            }}
            id="simulation-filter"
            label="Filtrar planos por cliente"
            showNovoButton={false}
          />
          <label className="flex items-center gap-2 self-start pt-6 text-sm">
            <input
              type="checkbox"
              checked={unlinked}
              onChange={(e) => {
                setUnlinked(e.target.checked);
                setFilterCustomer("");
                setHistory(null);
              }}
            />
            Somente cenários antigos sem cliente
          </label>
        </fieldset>
        {listError && (
          <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm">
            <p>{listError}</p>
            <Button variant="secondary" onClick={() => setRetry((r) => r + 1)}>
              Recarregar planos
            </Button>
          </div>
        )}
        {!loaded && !listError && <p role="status">Carregando simulações…</p>}
        {history && (
          <section
            className="space-y-3 rounded-xl border bg-white p-5"
            aria-label="Histórico da simulação"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Histórico — {history.title}</h3>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setHistory(null)}
              >
                Fechar histórico
              </Button>
            </div>
            {history.rows.map((v) => (
              <article key={v.version} className="space-y-2 border-t pt-3">
                <p className="font-medium">
                  Versão {v.version} ·{" "}
                  {new Date(v.recordedAt).toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Registrada por{" "}
                  {v.authorName ?? "Autor legado não identificado"}
                </p>
                <p className="text-sm">
                  Cliente nesta versão:{" "}
                  {v.customerName ?? "Sem cliente (versão legada)"}
                </p>
                <p className="text-sm">
                  {v.assumptions.title} · {v.assumptions.destination} ·{" "}
                  {v.assumptions.months} meses · {count(v.result.basePoints)}{" "}
                  pontos · meta de {count(v.result.goalMiles)} milhas
                </p>
                <p className="text-sm">
                  Gasto R$ {count(v.assumptions.monthlySpending)} ·{" "}
                  {count(v.assumptions.pointsPerDollar)} pontos/dólar · câmbio
                  R$ {count(v.assumptions.exchangeRate)} em{" "}
                  {v.assumptions.exchangeDate} · {v.assumptions.passengers}{" "}
                  passageiro(s)
                </p>
                <p className="text-sm">
                  {v.assumptions.scenarios
                    .map(
                      (s) =>
                        `${s.program}: bônus hipotético ${count(s.bonusPercent)}%`,
                    )
                    .join(" · ")}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => download(v.assumptions, v.result)}
                  >
                    Baixar versão {v.version}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy || opening}
                    onClick={() => duplicate(v.assumptions, v.customerId)}
                  >
                    Duplicar versão {v.version}
                  </Button>
                </div>
              </article>
            ))}
          </section>
        )}
        {!saved.length && loaded && !listError && (
          <p className="text-sm text-muted-foreground">
            Nenhuma simulação salva com esses filtros.
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {loaded &&
            !listError &&
            saved.map((row) => (
              <article
                key={row.id}
                className="space-y-3 rounded-xl border bg-white p-5"
              >
                <h3 className="font-semibold">{row.assumptions.title}</h3>
                <p className="text-sm">
                  {row.customerId ? (
                    <Link
                      className="text-[var(--hub-blue)] hover:underline"
                      href={`/milhas/clientes/${row.customerId}`}
                    >
                      {row.customerName ?? "Abrir cliente"}
                    </Link>
                  ) : (
                    "Sem cliente — cenário legado; use Editar para associar."
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {row.assumptions.destination} · {row.assumptions.months} meses
                  · {new Date(row.createdAt).toLocaleDateString("pt-BR")}
                </p>
                <p className="text-sm">
                  {count(row.result.basePoints)} pontos estimados · meta de{" "}
                  {count(row.result.goalMiles)} milhas
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-[var(--hub-hover)]" href={`/milhas/simulador/${row.id}/tarefas`}>Planejar tarefas</Link>
                  <Button
                    variant="secondary"
                    disabled={busy || opening}
                    onClick={() => edit(row)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy || opening}
                    onClick={() => duplicate(row.assumptions, row.customerId)}
                  >
                    Duplicar
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy || opening}
                    onClick={() => showHistory(row)}
                  >
                    Histórico
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => download(row.assumptions, row.result)}
                  >
                    Baixar relatório
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy || opening}
                    onClick={() => remove(row)}
                  >
                    Excluir
                  </Button>
                </div>
              </article>
            ))}
        </div>
      </section>
    </div>
  );
}

export default function SimuladorAcumuloPage() {
  return (
    <Suspense fallback={<p>Carregando simulador…</p>}>
      <SimulationRoute />
    </Suspense>
  );
}

function SimulationRoute() {
  const params=useSearchParams();
  return <SimulationPlanner key={params.toString()}/>;
}
