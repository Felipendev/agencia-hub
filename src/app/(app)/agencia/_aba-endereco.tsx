"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api/authenticated-fetch";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultDados, loadDados, saveDados, type DadosAgencia } from "./_agencia-storage";

type AgencyApi = {
  addressDetails?: unknown;
};

function fromAddressDetails(node: unknown): Partial<DadosAgencia> {
  if (!node || typeof node !== "object" || Array.isArray(node)) return {};
  const o = node as Record<string, unknown>;
  return {
    cep: typeof o.cep === "string" ? o.cep : "",
    pais: typeof o.pais === "string" ? o.pais : "",
    logradouro: typeof o.logradouro === "string" ? o.logradouro : "",
    numero: typeof o.numero === "string" ? o.numero : "",
    complemento: typeof o.complemento === "string" ? o.complemento : "",
    bairro: typeof o.bairro === "string" ? o.bairro : "",
    cidade: typeof o.cidade === "string" ? o.cidade : "",
    uf: typeof o.uf === "string" ? o.uf : "",
  };
}

function toAddressDetailsBody(d: DadosAgencia) {
  return {
    cep: d.cep,
    pais: d.pais,
    logradouro: d.logradouro,
    numero: d.numero,
    complemento: d.complemento,
    bairro: d.bairro,
    cidade: d.cidade,
    uf: d.uf,
  };
}

export function AbaEndereco() {
  const toast = useToast();
  const { token, isReady } = useAuth();
  const [d, setD] = useState<DadosAgencia>(() => ({ ...defaultDados }));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!isReady) {
      setLoading(false);
      return;
    }
    const local = loadDados();
    if (!token) {
      setD({ ...defaultDados, ...local });
      setLoading(false);
      return;
    }
    const base = getAgenciaHubApiBaseUrl();
    if (!base) {
      setD({ ...defaultDados, ...local });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const agency = await apiFetch<AgencyApi>("/agency", {}, token);
      const fromApi = fromAddressDetails(agency.addressDetails);
      const hasApi = Object.values(fromApi).some((v) => String(v).trim().length > 0);
      setD(
        hasApi
          ? { ...defaultDados, ...local, ...fromApi }
          : { ...defaultDados, ...local },
      );
    } catch {
      setD({ ...defaultDados, ...local });
    } finally {
      setLoading(false);
    }
  }, [isReady, token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function f(field: keyof DadosAgencia) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setD((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      saveDados(d);
      const base = getAgenciaHubApiBaseUrl();
      if (token && base) {
        await apiFetch(
          "/agency",
          {
            method: "PATCH",
            body: JSON.stringify({
              addressDetails: toAddressDetailsBody(d),
            }),
          },
          token,
        );
        toast.success("Endereço salvo no servidor!");
      } else {
        toast.success(
          token
            ? "Endereço salvo neste dispositivo (configure a API para sincronizar)."
            : "Endereço salvo neste dispositivo.",
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <p className="p-4 text-sm text-slate-500">Carregando…</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4 p-1">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="en-cep">CEP</Label>
            <Input id="en-cep" value={d.cep} onChange={f("cep")} placeholder="00000-000" />
          </div>
          <div>
            <Label htmlFor="en-pais">País</Label>
            <Input id="en-pais" value={d.pais} onChange={f("pais")} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="en-log">Logradouro</Label>
            <Input
              id="en-log"
              value={d.logradouro}
              onChange={f("logradouro")}
              placeholder="Rua, Avenida..."
            />
          </div>
          <div>
            <Label htmlFor="en-num">Número</Label>
            <Input id="en-num" value={d.numero} onChange={f("numero")} />
          </div>
          <div>
            <Label htmlFor="en-comp">Complemento</Label>
            <Input
              id="en-comp"
              value={d.complemento}
              onChange={f("complemento")}
              placeholder="Sala, Andar..."
            />
          </div>
          <div>
            <Label htmlFor="en-bairro">Bairro</Label>
            <Input id="en-bairro" value={d.bairro} onChange={f("bairro")} />
          </div>
          <div>
            <Label htmlFor="en-cidade">Cidade</Label>
            <Input id="en-cidade" value={d.cidade} onChange={f("cidade")} />
          </div>
          <div>
            <Label htmlFor="en-uf">UF</Label>
            <Input id="en-uf" value={d.uf} onChange={f("uf")} placeholder="SP" maxLength={2} />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
