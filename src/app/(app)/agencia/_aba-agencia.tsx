"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const STORAGE_AGENCIA = "agencia-hub-agencia";

export type DadosAgencia = {
  nome: string; cnpj: string; telefone: string; email: string;
  site: string; descricao: string;
  cep: string; logradouro: string; numero: string; complemento: string;
  bairro: string; cidade: string; uf: string; pais: string;
};

export const defaultDados: DadosAgencia = {
  nome: "", cnpj: "", telefone: "", email: "", site: "", descricao: "",
  cep: "", logradouro: "", numero: "", complemento: "",
  bairro: "", cidade: "", uf: "", pais: "Brasil",
};

export function loadDados(): DadosAgencia {
  try {
    const raw = localStorage.getItem(STORAGE_AGENCIA);
    if (!raw) return { ...defaultDados };
    return { ...defaultDados, ...(JSON.parse(raw) as Partial<DadosAgencia>) };
  } catch { return { ...defaultDados }; }
}

export function saveDados(d: DadosAgencia) {
  localStorage.setItem(STORAGE_AGENCIA, JSON.stringify(d));
}

export function AbaAgencia() {
  const toast = useToast();
  const [d, setD] = useState<DadosAgencia>(defaultDados);

  useEffect(() => { setD(loadDados()); }, []);

  function f(field: keyof DadosAgencia) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setD((prev) => ({ ...prev, [field]: e.target.value }));
  }

  return (
    <Card>
      <div className="space-y-4 p-1">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="ag-nome">Nome da agencia</Label>
            <Input id="ag-nome" value={d.nome} onChange={f("nome")} placeholder="Ex: Viagens Sonho Real" />
          </div>
          <div>
            <Label htmlFor="ag-cnpj">CNPJ</Label>
            <Input id="ag-cnpj" value={d.cnpj} onChange={f("cnpj")} placeholder="00.000.000/0001-00" />
          </div>
          <div>
            <Label htmlFor="ag-tel">Telefone</Label>
            <Input id="ag-tel" value={d.telefone} onChange={f("telefone")} placeholder="(11) 99999-9999" />
          </div>
          <div>
            <Label htmlFor="ag-email">E-mail</Label>
            <Input id="ag-email" type="email" value={d.email} onChange={f("email")} placeholder="contato@agencia.com" />
          </div>
          <div>
            <Label htmlFor="ag-site">Site</Label>
            <Input id="ag-site" value={d.site} onChange={f("site")} placeholder="https://agencia.com" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="ag-desc">Descricao / slogan</Label>
            <Textarea id="ag-desc" rows={3} value={d.descricao} onChange={f("descricao")} />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button type="button" onClick={() => { saveDados(d); toast.success("Dados salvos!"); }}>
            Salvar
          </Button>
        </div>
      </div>
    </Card>
  );
}
