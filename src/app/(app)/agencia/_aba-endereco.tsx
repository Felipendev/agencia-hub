"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadDados, saveDados } from "./_agencia-storage";
import type { DadosAgencia } from "./_agencia-storage";

export function AbaEndereco() {
  const toast = useToast();
  const [d, setD] = useState<DadosAgencia>(() => loadDados());

  function f(field: keyof DadosAgencia) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setD((prev) => ({ ...prev, [field]: e.target.value }));
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
            <Label htmlFor="en-pais">Pais</Label>
            <Input id="en-pais" value={d.pais} onChange={f("pais")} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="en-log">Logradouro</Label>
            <Input id="en-log" value={d.logradouro} onChange={f("logradouro")} placeholder="Rua, Avenida..." />
          </div>
          <div>
            <Label htmlFor="en-num">Numero</Label>
            <Input id="en-num" value={d.numero} onChange={f("numero")} />
          </div>
          <div>
            <Label htmlFor="en-comp">Complemento</Label>
            <Input id="en-comp" value={d.complemento} onChange={f("complemento")} placeholder="Sala, Andar..." />
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
          <Button type="button" onClick={() => { saveDados(d); toast.success("Endereco salvo!"); }}>
            Salvar
          </Button>
        </div>
      </div>
    </Card>
  );
}
