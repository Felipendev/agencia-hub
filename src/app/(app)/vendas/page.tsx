"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { formatBRL, formatDateBR } from "@/lib/format";
import { listUsersRemote } from "@/lib/api/users-remote";
import { NovoClienteModal } from "@/components/cliente/NovoClienteModal";
import { EditIcon, TrashIcon } from "@/components/icons";
import type { Cliente } from "@/types";

type Sale = { id: string; customerId: string; customerName: string; totalAmount: number; saleDate: string; status: string };
type Supplier = { id: string; name: string };
type TeamUser = { id: string; name: string; accountKind: string };
type Line = { description: string; saleAmount: string; supplierId: string; supplierCost: string; direct: boolean };
type Commission = { userId: string; kind: "FIXED" | "PERCENTAGE"; value: string };
type Installment = { amount: string; dueDate: string };
type SaleDetails = { sale: Sale; receivables: Array<{ id: string; installmentNumber: number; amount: number; dueDate: string; status: string }>; payables: Array<{ id: string; payableType: string; amount: number; dueDate: string | null; status: string; supplierName: string | null; recipientName: string | null }>; grossProfit: number; netProfit: number };
type ReceivableRow = {
  id: string; saleId: string; customerId: string; customerName: string;
  notes: string; itemTag: string | null; paymentMethod: string | null; bankAccount: string | null;
  dueDate: string; receivedAt: string | null; amount: number; status: "PENDING" | "PAID";
  installmentNumber: number; installmentsTotal: number;
};

const today = () => new Date().toISOString().slice(0, 10);
const number = (value: string) => Number(value.replace(/\./g, "").replace(",", "."));
const formatCurrencyInput = (value: string) => (Number(value.replace(/\D/g, "")) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const initials = (name: string) => name.trim().charAt(0).toUpperCase() || "?";

const PAYMENT_METHOD_LABELS: Record<string, string> = { PIX: "PIX", CREDIT_CARD: "Cartão de Crédito", DEBIT_CARD: "Cartão de Débito", TRANSFER: "Transferência", CASH: "Dinheiro", OTHER: "Outro" };

export default function VendasPage() {
  const pathname = usePathname();
  const isRevenueRegistration = pathname === "/financeiro/receita";
  const { token, user } = useAuth();
  const { clientes, cotacoes } = useData();
  const base = process.env.NEXT_PUBLIC_AGENCIA_HUB_API_URL;
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesCustomerFilter, setSalesCustomerFilter] = useState("");
  const [salesStartDate, setSalesStartDate] = useState("");
  const [salesEndDate, setSalesEndDate] = useState("");
  const [details, setDetails] = useState<SaleDetails | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [team, setTeam] = useState<TeamUser[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [quotationId, setQuotationId] = useState("");
  const [total, setTotal] = useState("");
  const [registeredAt, setRegisteredAt] = useState(today);
  const [installments, setInstallments] = useState<Installment[]>([{ amount: "", dueDate: "" }]);
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [cardInstallmentsCount, setCardInstallmentsCount] = useState("1");
  const [receivingAccount, setReceivingAccount] = useState("");
  const [recurrence, setRecurrence] = useState("ONE_TIME");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [error, setError] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);

  // ── Receivables (used by both the Receitas table and the Vendas summary) ──
  const [receivableRows, setReceivableRows] = useState<ReceivableRow[]>([]);
  const [receivablesLoading, setReceivablesLoading] = useState(false);
  const [receivablesError, setReceivablesError] = useState("");
  const [personFilter, setPersonFilter] = useState("");
  const [situacaoFilter, setSituacaoFilter] = useState<"" | "PENDING" | "PAID">("");
  const [dueFromFilter, setDueFromFilter] = useState("");
  const [dueToFilter, setDueToFilter] = useState("");
  const [paidFromFilter, setPaidFromFilter] = useState("");
  const [paidToFilter, setPaidToFilter] = useState("");
  const [editingReceivable, setEditingReceivable] = useState<ReceivableRow | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("PIX");
  const [editBankAccount, setEditBankAccount] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(async () => {
    if (!base || !token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const [salesResponse, suppliersResponse, usersResponse] = await Promise.all([
      fetch(`${base}/sales`, { headers }),
      fetch(`${base}/suppliers`, { headers }),
      listUsersRemote(token),
    ]);
    if (salesResponse.ok) setSales(await salesResponse.json());
    if (suppliersResponse.ok) setSuppliers(await suppliersResponse.json());
    setTeam(usersResponse.filter((member) => member.active));
  }, [base, token]);

  const loadReceivables = useCallback(async (withFilters: boolean) => {
    if (!base || !token) return;
    setReceivablesLoading(true); setReceivablesError("");
    try {
      const params = new URLSearchParams();
      if (withFilters) {
        if (personFilter) params.set("customerId", personFilter);
        if (situacaoFilter) params.set("status", situacaoFilter);
        if (dueFromFilter) params.set("dueFrom", dueFromFilter);
        if (dueToFilter) params.set("dueTo", dueToFilter);
        if (paidFromFilter) params.set("paidFrom", paidFromFilter);
        if (paidToFilter) params.set("paidTo", paidToFilter);
      }
      const response = await fetch(`${base}/sales/receivables?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) { setReceivablesError("Não foi possível carregar as receitas."); return; }
      setReceivableRows(await response.json());
    } catch {
      setReceivablesError("Não foi possível comunicar com o servidor.");
    } finally {
      setReceivablesLoading(false);
    }
  }, [base, token, personFilter, situacaoFilter, dueFromFilter, dueToFilter, paidFromFilter, paidToFilter]);

  useEffect(() => {
    const selectedCustomer = new URLSearchParams(window.location.search).get("clienteId");
    if (selectedCustomer) setCustomerId(selectedCustomer);
    void load().catch(() => setError("Não foi possível carregar os dados de vendas."));
    void loadReceivables(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const directTotal = useMemo(() => lines.filter((line) => line.direct).reduce((sum, line) => sum + number(line.saleAmount || "0"), 0), [lines]);
  const visibleSales = useMemo(() => sales.filter((sale) => (!salesCustomerFilter || sale.customerId === salesCustomerFilter) && (!salesStartDate || sale.saleDate >= salesStartDate) && (!salesEndDate || sale.saleDate <= salesEndDate)), [sales, salesCustomerFilter, salesEndDate, salesStartDate]);
  const addLine = () => setLines((current) => [...current, { description: "", saleAmount: "", supplierId: "", supplierCost: "", direct: false }]);
  const updateLine = (index: number, patch: Partial<Line>) => setLines((current) => current.map((line, position) => position === index ? { ...line, ...patch } : line));
  const addCommission = () => setCommissions((current) => [...current, { userId: user?.id ?? "", kind: "PERCENTAGE", value: "" }]);

  // Per-sale installment progress ("2 de 4 recebidas"), derived from the flat receivables list.
  const installmentsBySale = useMemo(() => {
    const map = new Map<string, { total: number; paid: number }>();
    for (const row of receivableRows) {
      const current = map.get(row.saleId) ?? { total: 0, paid: 0 };
      current.total += 1;
      if (row.status === "PAID") current.paid += 1;
      map.set(row.saleId, current);
    }
    return map;
  }, [receivableRows]);

  const cardInstallmentPreview = useMemo(() => {
    const n = Number(cardInstallmentsCount);
    const agencyReceives = number(total || "0") - directTotal;
    if (paymentMethod !== "CREDIT_CARD" || !n || agencyReceives <= 0) return null;
    const perInstallment = agencyReceives / n;
    return { n, perInstallment };
  }, [cardInstallmentsCount, paymentMethod, total, directTotal]);

  function addMonths(dateStr: string, months: number): string {
    const date = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
    date.setMonth(date.getMonth() + months);
    return date.toISOString().slice(0, 10);
  }

  function applyCardInstallments() {
    if (!cardInstallmentPreview) return;
    const { n, perInstallment } = cardInstallmentPreview;
    const rounded = Math.round(perInstallment * 100) / 100;
    setInstallments(Array.from({ length: n }, (_, index) => ({
      amount: rounded.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      dueDate: addMonths(registeredAt, index),
    })));
  }

  async function createSupplier(nameOverride?: string) {
    const name = (nameOverride ?? "").trim();
    if (!base || !token || !name) return;
    const response = await fetch(`${base}/suppliers`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ name }) });
    if (!response.ok) { setError("Não foi possível cadastrar o fornecedor."); return; }
    await load();
  }

  async function openDetails(saleId: string) {
    if (!base || !token) return;
    const response = await fetch(`${base}/sales/${saleId}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) { setError("Não foi possível abrir os detalhes da venda."); return; }
    setDetails(await response.json());
  }

  async function settle(kind: "receivables" | "payables", id: string) {
    if (!base || !token) return;
    const response = await fetch(`${base}/sales/${kind}/${id}/settle`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ date: today() }) });
    if (!response.ok) { setError("Não foi possível registrar a quitação."); return; }
    if (details) await openDetails(details.sale.id);
    await load();
    await loadReceivables(true);
  }

  async function toggleReceived(row: ReceivableRow) {
    if (!base || !token) return;
    setReceivablesError("");
    const path = row.status === "PENDING" ? "settle" : "unsettle";
    const response = await fetch(`${base}/sales/receivables/${row.id}/${path}`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: row.status === "PENDING" ? JSON.stringify({ date: today() }) : undefined,
    });
    if (!response.ok) { setReceivablesError(row.status === "PENDING" ? "Não foi possível marcar como recebido." : "Não foi possível desfazer o recebimento."); return; }
    await loadReceivables(true);
    await load();
  }

  function openEditReceivable(row: ReceivableRow) {
    setEditingReceivable(row);
    setEditAmount(row.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setEditDueDate(row.dueDate);
    setEditPaymentMethod(row.paymentMethod ?? "PIX");
    setEditBankAccount(row.bankAccount ?? "");
  }

  async function saveEditReceivable() {
    if (!base || !token || !editingReceivable) return;
    setEditSaving(true); setReceivablesError("");
    try {
      const response = await fetch(`${base}/sales/receivables/${editingReceivable.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: number(editAmount), dueDate: editDueDate, paymentMethod: editPaymentMethod, bankAccount: editBankAccount || "" }),
      });
      if (!response.ok) { setReceivablesError("Não foi possível salvar a edição."); return; }
      setEditingReceivable(null);
      await loadReceivables(true);
    } catch {
      setReceivablesError("Não foi possível comunicar com o servidor.");
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteReceivableRow(row: ReceivableRow) {
    if (!base || !token) return;
    if (!window.confirm("Excluir esta parcela?")) return;
    const response = await fetch(`${base}/sales/receivables/${row.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) { setReceivablesError("Não foi possível excluir a parcela."); return; }
    await loadReceivables(true);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setAttempted(true);
    const saleTotal = number(total);
    if (!base || !token || !customerId || saleTotal <= 0) { setError("Preencha cliente e valor total."); return; }
    if (directTotal > saleTotal) { setError("O valor pago direto ao fornecedor não pode ser maior que a venda."); return; }
    const agencyReceives = saleTotal - directTotal;
    if (agencyReceives > 0 && installments.some((installment) => !installment.dueDate || number(installment.amount) <= 0)) { setError("Preencha os valores e as datas previstas de recebimento."); return; }
    const receivableTotal = installments.reduce((sum, installment) => sum + number(installment.amount), 0);
    if (Math.abs(receivableTotal - agencyReceives) > 0.005) { setError("A soma das parcelas deve ser igual ao valor que a agência receberá."); return; }
    setSaving(true);
    try {
      const response = await fetch(`${base}/sales`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ customerId, quotationId: quotationId || null, totalAmount: saleTotal, saleDate: registeredAt, recurrenceFrequency: recurrence === "ONE_TIME" ? null : recurrence, notes,
          receivables: agencyReceives > 0 ? installments.map((installment, index) => ({ number: index + 1, amount: number(installment.amount), dueDate: installment.dueDate, paymentMethod, bankAccount: receivingAccount || null })) : [],
          items: lines.filter((line) => line.description.trim() && number(line.saleAmount) >= 0).map((line) => ({ description: line.description, itemType: "OTHER", saleAmount: number(line.saleAmount), supplierId: line.supplierId || null, supplierCost: line.supplierCost ? number(line.supplierCost) : null, customerPaysSupplierDirectly: line.direct, dueDate })),
          commissions: commissions.filter((commission) => commission.userId && number(commission.value) >= 0 && commission.value !== "").map((commission) => ({ recipientUserId: commission.userId, calculationType: commission.kind, calculationValue: number(commission.value), dueDate })),
        }),
      });
      if (!response.ok) { setError("Não foi possível registrar a venda. Revise os valores e tente novamente."); return; }
      const created = await response.json() as Sale;
      if (attachment) {
        const data = new FormData(); data.append("file", attachment);
        const upload = await fetch(`${base}/attachments/sales/${created.id}`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: data });
        if (!upload.ok) { setError("A venda foi registrada, mas o anexo não pôde ser enviado."); return; }
      }
      setCustomerId(""); setQuotationId(""); setTotal(""); setRegisteredAt(today()); setInstallments([{ amount: "", dueDate: "" }]); setPaymentMethod("PIX"); setCardInstallmentsCount("1"); setReceivingAccount(""); setRecurrence("ONE_TIME"); setNotes(""); setAttachment(null); setLines([]); setCommissions([]); setAdvanced(false); setAttempted(false);
      await load();
      await loadReceivables(true);
    } catch { setError("Não foi possível comunicar com o servidor."); } finally { setSaving(false); }
  }

  const receivablesTotal = useMemo(() => receivableRows.reduce((sum, row) => sum + row.amount, 0), [receivableRows]);

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-[var(--hub-text-primary)]">{isRevenueRegistration ? "Receitas" : "Vendas"}</h1><p className="text-sm text-[var(--hub-text-secondary)]">{isRevenueRegistration ? "Cadastre a venda e acompanhe cada parcela a receber." : "Histórico comercial das vendas registradas."}</p>{!isRevenueRegistration && <Link href="/financeiro/receita" className="mt-3 inline-flex rounded-[var(--hub-radius)] bg-[var(--hub-blue-dark)] px-4 py-2 text-sm font-medium text-white">Cadastrar receita</Link>}</div>

    {isRevenueRegistration && <form onSubmit={submit} className="space-y-4 rounded-xl border border-[var(--hub-border)] bg-white p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div><Label>Cliente *</Label><Select className={attempted && !customerId ? "border-red-500" : ""} value={customerId} aria-invalid={attempted && !customerId} onChange={(event) => { setCustomerId(event.target.value); setQuotationId(""); }}><option value="">Selecione</option>{clientes.map((customer) => <option key={customer.id} value={customer.id}>{customer.nome}</option>)}</Select><Button type="button" size="sm" variant="ghost" className="mt-1 text-[var(--hub-blue)]" onClick={() => setCustomerModalOpen(true)}>+ Nova pessoa / cliente</Button></div><div><Label>Cotação (opcional)</Label><Select value={quotationId} disabled={!customerId} onChange={(event) => setQuotationId(event.target.value)}><option value="">Sem cotação</option>{cotacoes.filter((quotation) => quotation.clienteId === customerId).map((quotation) => <option key={quotation.id} value={quotation.id}>{quotation.titulo}</option>)}</Select></div><div><Label>Valor total vendido *</Label><Input className={attempted && number(total) <= 0 ? "border-red-500" : ""} value={total} onChange={(event) => setTotal(formatCurrencyInput(event.target.value))} placeholder="0,00" inputMode="numeric" /></div><div><Label>Data do lançamento *</Label><Input className={attempted && !registeredAt ? "border-red-500" : ""} type="date" value={registeredAt} onChange={(event) => setRegisteredAt(event.target.value)} /></div></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div><Label>Forma de pagamento</Label><Select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}><option value="PIX">PIX</option><option value="CREDIT_CARD">Cartão de crédito</option><option value="DEBIT_CARD">Cartão de débito</option><option value="TRANSFER">Transferência</option><option value="CASH">Dinheiro</option><option value="OTHER">Outro</option></Select></div><div><Label>Conta que receberá</Label><Input value={receivingAccount} onChange={(event) => setReceivingAccount(event.target.value)} placeholder="Ex.: Conta PJ" /></div><div><Label>Recorrência</Label><Select value={recurrence} onChange={(event) => setRecurrence(event.target.value)}><option value="ONE_TIME">Venda única</option><option value="MONTHLY">Mensal</option><option value="WEEKLY">Semanal</option><option value="YEARLY">Anual</option></Select></div>{paymentMethod === "CREDIT_CARD" && <div><Label>Parcelas no cartão</Label><Select value={cardInstallmentsCount} onChange={(event) => setCardInstallmentsCount(event.target.value)}>{Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}x</option>)}</Select></div>}</div>
      {paymentMethod === "CREDIT_CARD" && cardInstallmentPreview && <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--hub-bg-subtle)] px-3 py-2 text-sm"><span>{cardInstallmentPreview.n}x de {formatBRL(cardInstallmentPreview.perInstallment)} — aplica no plano de recebimento abaixo</span><Button type="button" size="sm" variant="secondary" onClick={applyCardInstallments}>Aplicar</Button></div>}
      <div className="space-y-2 rounded-lg bg-[var(--hub-bg-subtle)] p-3">
        <div className="flex items-center justify-between"><Label>Quando a agência vai receber *</Label><Button type="button" size="sm" variant="secondary" onClick={() => setInstallments((current) => [...current, { amount: "", dueDate: "" }])}>Adicionar parcela</Button></div>
        <p className="text-xs text-[var(--hub-text-secondary)]">Divida o valor que a agência vai receber em uma ou mais parcelas, com a data prevista de cada uma. A soma precisa fechar com o valor total da venda (descontando o que o cliente pagar direto ao fornecedor, se houver).</p>
        {installments.map((installment, index) => <div key={index} className="grid gap-2 sm:grid-cols-3"><Input className={attempted && number(installment.amount) <= 0 ? "border-red-500" : ""} value={installment.amount} onChange={(event) => setInstallments((current) => current.map((item, position) => position === index ? { ...item, amount: formatCurrencyInput(event.target.value) } : item))} placeholder={`Valor da parcela ${index + 1}`} inputMode="numeric" /><Input className={attempted && !installment.dueDate ? "border-red-500" : ""} type="date" value={installment.dueDate} onChange={(event) => setInstallments((current) => current.map((item, position) => position === index ? { ...item, dueDate: event.target.value } : item))} aria-label={`Data prevista da parcela ${index + 1}`} />{installments.length > 1 && <Button type="button" size="sm" variant="ghost" className="text-red-600" onClick={() => setInstallments((current) => current.filter((_, position) => position !== index))}>Remover</Button>}</div>)}
      </div>
      <div><Label>Observações</Label><Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Detalhes importantes da reserva" /></div>
      <div><Label>Anexo (opcional)</Label><Input type="file" accept="image/jpeg,image/png,image/webp,application/pdf,text/plain,text/csv" onChange={(event) => { const file = event.target.files?.[0] ?? null; if (file && file.size > 5 * 1024 * 1024) { setError("O anexo deve ter até 5 MB."); event.target.value = ""; return; } setAttachment(file); }} /><p className="mt-1 text-xs text-[var(--hub-text-muted)]">Imagem, PDF ou texto — até 5 MB.</p></div>
      <div className="border-t border-[var(--hub-border)] pt-4">
        <button type="button" onClick={() => setAdvanced((value) => !value)} className="flex w-full items-center justify-between text-left">
          <span>
            <span className="block text-sm font-medium text-[var(--hub-text-primary)]">Fornecedor, custo e comissão</span>
            <span className="block text-xs text-[var(--hub-text-secondary)]">Opcional — só se algum fornecedor participou da venda ou alguém da equipe recebe comissão sobre ela.</span>
          </span>
          <span className="shrink-0 text-sm font-medium text-[var(--hub-blue)]">{advanced ? "Ocultar" : "Adicionar"}</span>
        </button>
      </div>
      {advanced && <div className="space-y-5 rounded-lg border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] p-4">
        <div>
          <div className="mb-2 flex items-center justify-between"><Label>Itens e fornecedores</Label><Button type="button" size="sm" variant="secondary" onClick={() => setSupplierModalOpen(true)}>+ Nova pessoa / fornecedor</Button></div>
          <div className="space-y-3">
            {lines.map((line, index) => <div key={index} className="grid gap-2 rounded-md bg-white p-3 sm:grid-cols-6"><Input value={line.description} onChange={(event) => updateLine(index, { description: event.target.value })} placeholder="Ex.: passagem aérea" /><Input value={line.saleAmount} onChange={(event) => updateLine(index, { saleAmount: formatCurrencyInput(event.target.value) })} placeholder="Valor deste item" inputMode="numeric" /><Select value={line.supplierId} onChange={(event) => updateLine(index, { supplierId: event.target.value })}><option value="">Sem fornecedor</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</Select><Input value={line.supplierCost} onChange={(event) => updateLine(index, { supplierCost: formatCurrencyInput(event.target.value) })} placeholder="Custo do fornecedor" inputMode="numeric" /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={line.direct} onChange={(event) => updateLine(index, { direct: event.target.checked })} /> Cliente paga direto</label><Button type="button" size="sm" variant="ghost" className="text-red-600" onClick={() => setLines((current) => current.filter((_, position) => position !== index))}>Remover</Button></div>)}
          </div>
          <Button type="button" size="sm" variant="secondary" className="mt-2" onClick={addLine}>Adicionar item / fornecedor</Button>
        </div>
        <div className="border-t border-[var(--hub-border)] pt-4">
          <Label className="mb-2 block">Comissões internas</Label>
          <div className="space-y-3">
            {commissions.map((commission, index) => <div key={index} className="grid gap-2 rounded-md bg-white p-3 sm:grid-cols-4"><Select value={commission.userId} onChange={(event) => setCommissions((current) => current.map((item, position) => position === index ? { ...item, userId: event.target.value } : item))}><option value="">Quem recebe a comissão?</option>{team.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</Select><Select value={commission.kind} onChange={(event) => setCommissions((current) => current.map((item, position) => position === index ? { ...item, kind: event.target.value as Commission["kind"] } : item))}><option value="PERCENTAGE">Percentual da venda</option><option value="FIXED">Valor fixo</option></Select><Input value={commission.value} onChange={(event) => setCommissions((current) => current.map((item, position) => position === index ? { ...item, value: commission.kind === "FIXED" ? formatCurrencyInput(event.target.value) : event.target.value } : item))} placeholder={commission.kind === "PERCENTAGE" ? "%" : "R$"} inputMode="numeric" /><Button type="button" size="sm" variant="ghost" className="text-red-600" onClick={() => setCommissions((current) => current.filter((_, position) => position !== index))}>Remover</Button></div>)}
          </div>
          <Button type="button" size="sm" variant="secondary" className="mt-2" onClick={addCommission}>Adicionar comissão</Button>
        </div>
      </div>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}<Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Registrar venda"}</Button>
    </form>}

    {!isRevenueRegistration && <section className="rounded-xl border border-[var(--hub-border)] bg-white p-4"><div className="grid gap-3 md:grid-cols-4"><div><Label>Cliente</Label><Select value={salesCustomerFilter} onChange={(event) => setSalesCustomerFilter(event.target.value)}><option value="">Todos</option>{clientes.map((customer) => <option key={customer.id} value={customer.id}>{customer.nome}</option>)}</Select></div><div><Label>Período da venda — início</Label><Input type="date" value={salesStartDate} onChange={(event) => setSalesStartDate(event.target.value)} /></div><div><Label>Período da venda — fim</Label><Input type="date" value={salesEndDate} onChange={(event) => setSalesEndDate(event.target.value)} /></div><div className="flex items-end gap-2"><Button type="button" variant="secondary" onClick={() => { setSalesCustomerFilter(""); setSalesStartDate(""); setSalesEndDate(""); }}>Limpar</Button></div></div></section>}

    {/* ── Vendas: tabela por venda ─────────────────────────────────────────── */}
    {!isRevenueRegistration && <div className="overflow-hidden rounded-xl border border-[var(--hub-border)] bg-white">
      <div className="border-b p-4 font-semibold">Resultado da busca</div>
      {visibleSales.length === 0 ? (
        <p className="p-8 text-center text-sm text-[var(--hub-text-muted)]">Nenhuma venda encontrada para os filtros informados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--hub-border)] bg-[var(--hub-bg-subtle)]/60 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--hub-text-muted)]">
                <th className="px-4 py-3">Pessoa</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Data da venda</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3">Parcelas</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hub-border)]">
              {visibleSales.map((sale) => {
                const progress = installmentsBySale.get(sale.id);
                return (
                  <tr key={sale.id} className="hover:bg-[var(--hub-bg-subtle)]/40">
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--hub-blue)]/10 text-xs font-bold text-[var(--hub-blue)]">{initials(sale.customerName)}</span>
                        <span className="font-medium text-[var(--hub-text-primary)]">{sale.customerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--hub-text-secondary)]">Venda #{sale.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-[var(--hub-text-secondary)]">{formatDateBR(sale.saleDate)}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-[var(--hub-text-primary)]">{formatBRL(Number(sale.totalAmount))}</td>
                    <td className="px-4 py-3">
                      {progress ? (
                        <Badge tone={progress.paid === progress.total ? "success" : "warning"}>{progress.paid}/{progress.total} recebidas</Badge>
                      ) : (
                        <Badge tone="muted">sem parcelas</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button type="button" size="sm" variant="secondary" onClick={() => void openDetails(sale.id)}>Ver detalhes</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>}

    {/* ── Receitas: tabela por parcela ─────────────────────────────────────── */}
    {isRevenueRegistration && <section className="space-y-3">
      <div className="rounded-xl border border-[var(--hub-border)] bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div><Label>Pessoa</Label><Select value={personFilter} onChange={(event) => setPersonFilter(event.target.value)}><option value="">Todos</option>{clientes.map((customer) => <option key={customer.id} value={customer.id}>{customer.nome}</option>)}</Select></div>
          <div><Label>Situação</Label><Select value={situacaoFilter} onChange={(event) => setSituacaoFilter(event.target.value as typeof situacaoFilter)}><option value="">Todos</option><option value="PENDING">Pendente</option><option value="PAID">Recebido</option></Select></div>
          <div className="sm:col-span-2 lg:col-span-2">
            <Label>Vencimento</Label>
            <div className="flex items-center gap-2"><Input type="date" value={dueFromFilter} onChange={(event) => setDueFromFilter(event.target.value)} /><span className="text-xs text-[var(--hub-text-muted)]">até</span><Input type="date" value={dueToFilter} onChange={(event) => setDueToFilter(event.target.value)} /></div>
          </div>
          <div className="flex items-end"><Button type="button" onClick={() => void loadReceivables(true)} disabled={receivablesLoading} className="w-full">{receivablesLoading ? "Buscando…" : "Pesquisar"}</Button></div>
          <div className="sm:col-span-2 lg:col-span-2">
            <Label>Pagamento</Label>
            <div className="flex items-center gap-2"><Input type="date" value={paidFromFilter} onChange={(event) => setPaidFromFilter(event.target.value)} /><span className="text-xs text-[var(--hub-text-muted)]">até</span><Input type="date" value={paidToFilter} onChange={(event) => setPaidToFilter(event.target.value)} /></div>
          </div>
          <div className="flex items-end"><Button type="button" variant="secondary" className="w-full" onClick={() => { setPersonFilter(""); setSituacaoFilter(""); setDueFromFilter(""); setDueToFilter(""); setPaidFromFilter(""); setPaidToFilter(""); void loadReceivables(false); }}>Limpar</Button></div>
        </div>
      </div>

      {receivablesError && <p role="alert" className="text-sm text-red-600">{receivablesError}</p>}

      <div className="overflow-hidden rounded-xl border border-[var(--hub-border)] bg-white">
        {receivableRows.length === 0 ? (
          <p className="p-8 text-center text-sm text-[var(--hub-text-muted)]">{receivablesLoading ? "Carregando…" : "Nenhuma receita encontrada para os filtros informados."}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--hub-border)] bg-[var(--hub-bg-subtle)]/60 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--hub-text-muted)]">
                  <th className="px-4 py-3">Pessoa</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Forma de pagamento</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Pagamento</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-center">Recebido</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--hub-border)]">
                {receivableRows.map((row) => (
                  <tr key={row.id} className="hover:bg-[var(--hub-bg-subtle)]/40">
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--hub-blue)]/10 text-xs font-bold text-[var(--hub-blue)]">{initials(row.customerName)}</span>
                        <span className="font-medium text-[var(--hub-text-primary)]">{row.customerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[var(--hub-text-primary)]">{row.notes?.trim() || "Venda"}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {row.bankAccount && <Badge tone="muted">🏦 {row.bankAccount}</Badge>}
                        <Badge tone="default">{row.itemTag?.trim() || "Venda"}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--hub-text-secondary)]">
                      <p>{row.paymentMethod ? PAYMENT_METHOD_LABELS[row.paymentMethod] ?? row.paymentMethod : "—"}</p>
                      <p className="text-xs text-[var(--hub-text-muted)]">Parcela {row.installmentNumber} de {row.installmentsTotal}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--hub-text-secondary)]">{formatDateBR(row.dueDate)}</td>
                    <td className="px-4 py-3 text-[var(--hub-text-secondary)]">{row.receivedAt ? formatDateBR(row.receivedAt) : "—"}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-[var(--hub-text-primary)]">{formatBRL(row.amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center"><Switch checked={row.status === "PAID"} onChange={() => void toggleReceived(row)} label={row.status === "PAID" ? "Marcar como pendente" : "Marcar como recebido"} /></div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" disabled={row.status === "PAID"} onClick={() => openEditReceivable(row)} title={row.status === "PAID" ? "Desfaça o recebimento para editar" : "Editar"} className="rounded-lg p-1.5 text-[var(--hub-text-secondary)] transition-colors hover:bg-sky-50 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-30">
                          <EditIcon className="h-4 w-4" />
                        </button>
                        <button type="button" disabled={row.status === "PAID"} onClick={() => void deleteReceivableRow(row)} title={row.status === "PAID" ? "Desfaça o recebimento para excluir" : "Excluir"} className="rounded-lg p-1.5 text-[var(--hub-text-secondary)] transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--hub-border)] bg-[var(--hub-bg-subtle)]/60">
                  <td colSpan={5} className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--hub-text-muted)]">Total</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-[var(--hub-text-primary)]">{formatBRL(receivablesTotal)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </section>}

    {details && <section className="space-y-4 rounded-xl border border-[var(--hub-border)] bg-white p-5"><div className="flex items-start justify-between"><div><h2 className="font-semibold">Contas da venda</h2><p className="text-sm text-[var(--hub-text-secondary)]">Receba ou pague somente quando o dinheiro realmente movimentar.</p></div><Button type="button" variant="ghost" onClick={() => setDetails(null)}>Fechar</Button></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-[var(--hub-bg-subtle)] p-3 text-sm"><span className="text-[var(--hub-text-secondary)]">Lucro bruto</span><strong className="block">{formatBRL(Number(details.grossProfit))}</strong></div><div className="rounded-lg bg-[var(--hub-bg-subtle)] p-3 text-sm"><span className="text-[var(--hub-text-secondary)]">Lucro após comissões</span><strong className="block">{formatBRL(Number(details.netProfit))}</strong></div></div><div><h3 className="mb-2 text-sm font-semibold">A receber</h3>{details.receivables.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-3 border-t py-2 text-sm"><span>Parcela {entry.installmentNumber} · {entry.dueDate}</span><span>{formatBRL(Number(entry.amount))}</span>{entry.status === "PENDING" ? <Button type="button" size="sm" onClick={() => void settle("receivables", entry.id)}>Recebi</Button> : <BadgePaid />}</div>)}</div><div><h3 className="mb-2 text-sm font-semibold">A pagar</h3>{details.payables.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-3 border-t py-2 text-sm"><span>{entry.payableType === "COMMISSION" ? `Comissão · ${entry.recipientName}` : `Fornecedor · ${entry.supplierName ?? "não informado"}`}</span><span>{formatBRL(Number(entry.amount))}</span>{entry.status === "PENDING" ? <Button type="button" size="sm" onClick={() => void settle("payables", entry.id)}>Paguei</Button> : <BadgePaid />}</div>)}</div></section>}

    {editingReceivable && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--hub-border)] bg-white p-5 shadow-xl">
        <h2 className="text-base font-semibold text-[var(--hub-text-primary)]">Editar parcela</h2>
        <p className="mt-1 text-xs text-[var(--hub-text-secondary)]">Só é possível editar enquanto a parcela estiver pendente.</p>
        <div className="mt-4 space-y-3">
          <div><Label>Valor</Label><Input value={editAmount} onChange={(event) => setEditAmount(formatCurrencyInput(event.target.value))} inputMode="numeric" /></div>
          <div><Label>Vencimento</Label><Input type="date" value={editDueDate} onChange={(event) => setEditDueDate(event.target.value)} /></div>
          <div><Label>Forma de pagamento</Label><Select value={editPaymentMethod} onChange={(event) => setEditPaymentMethod(event.target.value)}><option value="PIX">PIX</option><option value="CREDIT_CARD">Cartão de crédito</option><option value="DEBIT_CARD">Cartão de débito</option><option value="TRANSFER">Transferência</option><option value="CASH">Dinheiro</option><option value="OTHER">Outro</option></Select></div>
          <div><Label>Conta</Label><Input value={editBankAccount} onChange={(event) => setEditBankAccount(event.target.value)} placeholder="Ex.: Conta PJ" /></div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setEditingReceivable(null)}>Cancelar</Button>
          <Button type="button" disabled={editSaving} onClick={() => void saveEditReceivable()}>{editSaving ? "Salvando…" : "Salvar"}</Button>
        </div>
      </div>
    </div>}

    <NovoClienteModal open={customerModalOpen} initialType="cliente" onClose={() => setCustomerModalOpen(false)} onCreated={(customer: Cliente) => { setCustomerId(customer.id); setCustomerModalOpen(false); }} />
    <NovoClienteModal open={supplierModalOpen} initialType="fornecedor" onClose={() => setSupplierModalOpen(false)} onCreated={(person: Cliente) => { setSupplierModalOpen(false); void createSupplier(person.nome); }} />
  </div>;
}

function BadgePaid() { return <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Quitado</span>; }
