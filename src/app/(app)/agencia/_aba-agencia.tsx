"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api/authenticated-fetch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── CNPJ Validation ──────────────────────────────────────────────────────────

function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calc = (slice: string, weights: number[]) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += parseInt(slice[i]) * weights[i];
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calc(digits, w1);
  if (parseInt(digits[12]) !== d1) return false;

  const d2 = calc(digits, w2);
  if (parseInt(digits[13]) !== d2) return false;

  return true;
}

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type AgencyData = {
  id?: string;
  name: string;
  phone: string;
  logoUrl: string;
  cnpj: string;
  address: string;
  commercialEmail: string;
};

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];

export function AbaAgencia() {
  const { token } = useAuth();
  const toast = useToast();
  const [data, setData] = useState<AgencyData>({
    name: "", phone: "", logoUrl: "", cnpj: "", address: "", commercialEmail: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cnpjError, setCnpjError] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    apiFetch<AgencyData>("/agency", {}, token)
      .then((res) => {
        setData(res);
        if (res.logoUrl) setLogoPreview(res.logoUrl);
      })
      .catch(() => {
        // If API not available, load from localStorage fallback
        try {
          const raw = localStorage.getItem("agencia-hub-agencia");
          if (raw) {
            const local = JSON.parse(raw);
            setData({
              name: local.nome ?? "",
              phone: local.telefone ?? "",
              logoUrl: "",
              cnpj: local.cnpj ?? "",
              address: [local.logradouro, local.numero, local.bairro, local.cidade, local.uf].filter(Boolean).join(", "),
              commercialEmail: local.email ?? "",
            });
          }
        } catch { /* ignore */ }
      })
      .finally(() => setLoading(false));
  }, [token]);

  function handleCnpjChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCNPJ(e.target.value);
    setData((prev) => ({ ...prev, cnpj: formatted }));
    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 14 && !validateCNPJ(digits)) {
      setCnpjError("CNPJ inválido");
    } else {
      setCnpjError("");
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      toast.error("Formatos aceitos: PNG, JPG, SVG");
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      toast.error("Imagem deve ter no máximo 2MB");
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleUploadLogo() {
    if (!logoFile || !token) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", logoFile);
      const base = process.env.NEXT_PUBLIC_AGENCIA_HUB_API_URL || "";
      const res = await fetch(`${base}/agency/logo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Erro ao enviar logo");
      const result = await res.json();
      setData((prev) => ({ ...prev, logoUrl: result.logoUrl ?? "" }));
      setLogoFile(null);
      toast.success("Logo atualizado!");
    } catch (err) {
      toast.error((err as Error).message ?? "Erro ao enviar logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSave() {
    // Validate CNPJ if provided
    const cnpjDigits = data.cnpj.replace(/\D/g, "");
    if (cnpjDigits.length > 0 && cnpjDigits.length !== 14) {
      setCnpjError("CNPJ deve ter 14 dígitos");
      return;
    }
    if (cnpjDigits.length === 14 && !validateCNPJ(cnpjDigits)) {
      setCnpjError("CNPJ inválido");
      return;
    }

    setSaving(true);
    try {
      if (token) {
        await apiFetch("/agency", {
          method: "PATCH",
          body: JSON.stringify({
            name: data.name,
            phone: data.phone,
            cnpj: data.cnpj,
            address: data.address,
            commercialEmail: data.commercialEmail,
          }),
        }, token);
      }
      // Also save to localStorage as fallback
      localStorage.setItem("agencia-hub-agencia", JSON.stringify({
        nome: data.name,
        cnpj: data.cnpj,
        telefone: data.phone,
        email: data.commercialEmail,
      }));
      toast.success("Dados salvos!");
    } catch (err) {
      toast.error((err as Error).message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Card><p className="text-sm text-slate-500 p-1">Carregando...</p></Card>;
  }

  return (
    <Card>
      <div className="space-y-6 p-1">
        {/* Logo upload */}
        <div>
          <Label>Logotipo</Label>
          <div className="mt-2 flex items-center gap-4">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo da agência"
                className="h-16 w-16 rounded-lg border border-[var(--hub-border)] object-contain"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
                Logo
              </div>
            )}
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.svg"
                onChange={handleLogoChange}
                className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--hub-blue)] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-[var(--hub-blue-dark)]"
              />
              <p className="text-xs text-slate-400">PNG, JPG ou SVG. Máximo 2MB.</p>
              {logoFile && (
                <Button
                  type="button"
                  onClick={handleUploadLogo}
                  disabled={uploadingLogo}
                  className="w-fit text-xs"
                >
                  {uploadingLogo ? "Enviando..." : "Enviar logo"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="ag-nome">Nome da agência</Label>
            <Input
              id="ag-nome"
              value={data.name}
              onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Viagens Sonho Real"
            />
          </div>
          <div>
            <Label htmlFor="ag-cnpj">CNPJ</Label>
            <Input
              id="ag-cnpj"
              value={data.cnpj}
              onChange={handleCnpjChange}
              placeholder="00.000.000/0001-00"
            />
            {cnpjError && <p className="mt-1 text-xs text-red-600">{cnpjError}</p>}
          </div>
          <div>
            <Label htmlFor="ag-tel">Telefone comercial</Label>
            <Input
              id="ag-tel"
              value={data.phone}
              onChange={(e) => setData((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div>
            <Label htmlFor="ag-email">E-mail comercial</Label>
            <Input
              id="ag-email"
              type="email"
              value={data.commercialEmail}
              onChange={(e) => setData((prev) => ({ ...prev, commercialEmail: e.target.value }))}
              placeholder="contato@agencia.com"
            />
            <p className="mt-1 text-xs text-slate-400">
              Alterações no e-mail comercial requerem verificação.
            </p>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="ag-endereco">Endereço</Label>
            <Input
              id="ag-endereco"
              value={data.address}
              onChange={(e) => setData((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Rua, número, bairro, cidade - UF"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="button" onClick={handleSave} disabled={saving || !!cnpjError}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
