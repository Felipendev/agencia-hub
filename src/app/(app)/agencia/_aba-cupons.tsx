"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, Th, Td, Tr } from "@/components/ui/table";
import { formatDateBR } from "@/lib/format";
import {
  type CouponDTO,
  createCouponRemote,
  deleteCouponRemote,
  listCouponsRemote,
  updateCouponRemote,
} from "@/lib/api/coupons-remote";

function isExpired(c: CouponDTO): boolean {
  return !!c.expiresAt && new Date(c.expiresAt) < new Date();
}

function isExhausted(c: CouponDTO): boolean {
  return !!c.maxUses && c.usedCount >= c.maxUses;
}

export function AbaCupons() {
  const { token } = useAuth();
  const toast = useToast();
  const [coupons, setCoupons] = useState<CouponDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
  const [maxUses, setMaxUses] = useState("");

  function load() {
    if (!token) return;
    setLoading(true);
    listCouponsRemote(token)
      .then(setCoupons)
      .catch(() => toast.error("Erro ao carregar cupons."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate() {
    if (!token) return;
    const trimmed = code.trim();
    if (!trimmed) { toast.error("Informe o código do cupom."); return; }
    setSaving(true);
    try {
      const created = await createCouponRemote(token, {
        code: trimmed,
        expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
        active: true,
        discountPercent: discountPercent ? Number(discountPercent) : null,
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
        maxUses: maxUses ? Number(maxUses) : null,
      });
      setCoupons((prev) => [created, ...prev]);
      setCode("");
      setExpiresAt("");
      setDiscountPercent("");
      setMaxDiscountAmount("");
      setMaxUses("");
      toast.success(`Cupom "${created.code}" criado.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar cupom.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(c: CouponDTO) {
    if (!token) return;
    try {
      const updated = await updateCouponRemote(token, c.id, {
        code: c.code,
        expiresAt: c.expiresAt,
        active: !c.active,
        discountPercent: c.discountPercent,
        maxDiscountAmount: c.maxDiscountAmount,
        maxUses: c.maxUses,
      });
      setCoupons((prev) => prev.map((x) => (x.id === c.id ? updated : x)));
    } catch {
      toast.error("Erro ao atualizar cupom.");
    }
  }

  async function handleDelete(c: CouponDTO) {
    if (!token) return;
    if (!window.confirm(`Remover o cupom "${c.code}"? Essa ação não pode ser desfeita.`)) return;
    try {
      await deleteCouponRemote(token, c.id);
      setCoupons((prev) => prev.filter((x) => x.id !== c.id));
      toast.success("Cupom removido.");
    } catch {
      toast.error("Erro ao remover cupom.");
    }
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-5">
        <div>
          <h3 className="text-sm font-semibold text-[var(--hub-text-primary)]">Novo cupom</h3>
          <p className="mt-1 text-xs text-[var(--hub-text-muted)]">
            O código fica disponível para os clientes usarem no formulário público de solicitação de orçamento.
            Cada cliente (por e-mail) só pode usar um cupom uma única vez; não há acúmulo de cupons no mesmo pedido.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[160px]">
            <Label htmlFor="cupom-code">Código</Label>
            <Input
              id="cupom-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VERAO2026"
              maxLength={40}
              className="mt-1"
            />
          </div>
          <div className="w-32">
            <Label htmlFor="cupom-pct">Desconto (%)</Label>
            <Input
              id="cupom-pct"
              type="number"
              min={0.01}
              max={100}
              step={0.01}
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              placeholder="10"
              className="mt-1"
            />
          </div>
          <div className="w-36">
            <Label htmlFor="cupom-teto">Teto (R$, opcional)</Label>
            <Input
              id="cupom-teto"
              type="number"
              min={0.01}
              step={0.01}
              value={maxDiscountAmount}
              onChange={(e) => setMaxDiscountAmount(e.target.value)}
              placeholder="300"
              className="mt-1"
            />
          </div>
          <div className="w-32">
            <Label htmlFor="cupom-usos">Limite de usos</Label>
            <Input
              id="cupom-usos"
              type="number"
              min={1}
              step={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Ilimitado"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="cupom-exp">Válido até (opcional)</Label>
            <Input
              id="cupom-exp"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button type="button" onClick={handleCreate} disabled={saving}>
            {saving ? "Salvando…" : "Adicionar cupom"}
          </Button>
        </div>
      </Card>

      <Card className="p-0">
        {loading ? (
          <p className="p-5 text-sm text-[var(--hub-text-muted)]">Carregando…</p>
        ) : coupons.length === 0 ? (
          <p className="p-5 text-sm text-[var(--hub-text-muted)]">Nenhum cupom cadastrado ainda.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Código</Th>
                <Th>Desconto</Th>
                <Th>Usos</Th>
                <Th>Válido até</Th>
                <Th>Status</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <Tr key={c.id}>
                  <Td className="font-mono font-semibold">{c.code}</Td>
                  <Td>
                    {c.discountPercent
                      ? `${c.discountPercent}%${c.maxDiscountAmount ? ` (até R$ ${c.maxDiscountAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})` : ""}`
                      : "—"}
                  </Td>
                  <Td>{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}</Td>
                  <Td>{c.expiresAt ? formatDateBR(c.expiresAt) : "Sem validade"}</Td>
                  <Td>
                    {!c.active ? (
                      <Badge tone="muted">Inativo</Badge>
                    ) : isExpired(c) ? (
                      <Badge tone="warning">Expirado</Badge>
                    ) : isExhausted(c) ? (
                      <Badge tone="warning">Esgotado</Badge>
                    ) : (
                      <Badge tone="success">Ativo</Badge>
                    )}
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="secondary" className="!py-1 text-xs" onClick={() => void handleToggleActive(c)}>
                        {c.active ? "Desativar" : "Ativar"}
                      </Button>
                      <Button type="button" variant="secondary" className="!py-1 text-xs text-red-600" onClick={() => void handleDelete(c)}>
                        Remover
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
