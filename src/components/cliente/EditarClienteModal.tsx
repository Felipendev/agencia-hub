"use client";

import { useState, useEffect } from "react";
import { useData } from "@/contexts/data-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { XIcon } from "@/components/icons";
import type { Cliente, ClienteStatus } from "@/types";

type Props = {
  cliente: Cliente;
  open: boolean;
  onClose: () => void;
};

export function EditarClienteModal({ cliente, open, onClose }: Props) {
  const { updateCliente } = useData();
  const toast = useToast();

  const [nome, setNome] = useState(cliente.nome);
  const [email, setEmail] = useState(cliente.email);
  const [telefone, setTelefone] = useState(cliente.telefone);
  const [whatsapp, setWhatsapp] = useState(cliente.whatsapp ?? "");
  const [destinoInteresse, setDestinoInteresse] = useState(cliente.destinoInteresse);
  const [status, setStatus] = useState<ClienteStatus>(cliente.status);
  const [observacoes, setObservacoes] = useState(cliente.observacoes);
  const [dataNascimento, setDataNascimento] = useState(cliente.dataNascimento ?? "");
  const [redeSocial, setRedeSocial] = useState(cliente.redeSocial ?? "");
  const [canalVenda, setCanalVenda] = useState(cliente.canalVenda ?? "");
  const [informacoesExtras, setInformacoesExtras] = useState(cliente.informacoesExtras ?? "");

  // Sincroniza se o cliente mudar externamente
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing form state from prop when modal opens
    setNome(cliente.nome);
    setEmail(cliente.email);
    setTelefone(cliente.telefone);
    setWhatsapp(cliente.whatsapp ?? "");
    setDestinoInteresse(cliente.destinoInteresse);
    setStatus(cliente.status);
    setObservacoes(cliente.observacoes);
    setDataNascimento(cliente.dataNascimento ?? "");
    setRedeSocial(cliente.redeSocial ?? "");
    setCanalVenda(cliente.canalVenda ?? "");
    setInformacoesExtras(cliente.informacoesExtras ?? "");
  }, [open, cliente]);

  if (!open) return null;

  async function handleSave() {
    if (!nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    try {
      await updateCliente(cliente.id, {
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        whatsapp: whatsapp.trim() || undefined,
        destinoInteresse: destinoInteresse.trim(),
        status,
        observacoes: observacoes.trim(),
        dataNascimento: dataNascimento || undefined,
        redeSocial: redeSocial.trim() || undefined,
        canalVenda: canalVenda || undefined,
        informacoesExtras: informacoesExtras.trim() || undefined,
      });
      toast.success("Cliente atualizado com sucesso!");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o cliente.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-[var(--hub-radius-lg)] border border-[var(--hub-border)] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--hub-border)] px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--hub-blue-dark)]">
              Editar Cliente
            </h2>
            <p className="text-sm text-[var(--hub-text-muted)]">{cliente.nome}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--hub-radius)] p-1.5 text-[var(--hub-text-muted)] transition-colors hover:bg-[var(--hub-bg-subtle)] hover:text-[var(--hub-text-secondary)]"
            aria-label="Fechar"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            {/* Dados principais */}
            <fieldset className="space-y-3">
              <legend className="text-xs font-semibold uppercase tracking-wide text-[var(--hub-text-muted)]">
                Dados principais
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="ec-nome">Nome *</Label>
                  <Input
                    id="ec-nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ec-email">E-mail</Label>
                  <Input
                    id="ec-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="ec-tel">Telefone</Label>
                  <Input
                    id="ec-tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="ec-wa">WhatsApp</Label>
                  <Input
                    id="ec-wa"
                    placeholder="(11) 99999-9999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="ec-destino">Destino de interesse</Label>
                  <Input
                    id="ec-destino"
                    value={destinoInteresse}
                    onChange={(e) => setDestinoInteresse(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="ec-status">Status</Label>
                  <Select
                    id="ec-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ClienteStatus)}
                  >
                    <option value="prospecto">Prospecto</option>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ec-nasc">Data de nascimento</Label>
                  <Input
                    id="ec-nasc"
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="ec-canal">Canal de venda</Label>
                  <Select
                    id="ec-canal"
                    value={canalVenda}
                    onChange={(e) => setCanalVenda(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                    <option value="indicacao">Indicação</option>
                    <option value="site">Site</option>
                    <option value="telefone">Telefone</option>
                    <option value="feira_evento">Feira / evento</option>
                    <option value="outro">Outro</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ec-rede">Rede social / @</Label>
                  <Input
                    id="ec-rede"
                    placeholder="@usuario"
                    value={redeSocial}
                    onChange={(e) => setRedeSocial(e.target.value)}
                  />
                </div>
              </div>
            </fieldset>

            {/* Observações */}
            <fieldset className="space-y-3">
              <legend className="text-xs font-semibold uppercase tracking-wide text-[var(--hub-text-muted)]">
                Notas
              </legend>
              <div>
                <Label htmlFor="ec-obs">Observações</Label>
                <Textarea
                  id="ec-obs"
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ec-extra">Informações extras</Label>
                <Textarea
                  id="ec-extra"
                  rows={2}
                  value={informacoesExtras}
                  onChange={(e) => setInformacoesExtras(e.target.value)}
                />
              </div>
            </fieldset>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-[var(--hub-border)] px-6 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave}>
            Salvar alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
