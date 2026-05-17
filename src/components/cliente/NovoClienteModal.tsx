"use client";

import { useState } from "react";
import { useData } from "@/contexts/data-context";
import { useToast } from "@/components/ui/toast";
import { DuplicateCustomerError } from "@/lib/api/create-customer-remote";
import {
  brPhoneDigits,
  formatBrPhoneDisplay,
} from "@/lib/br-phone";
import {
  CANAL_VENDA_OPTIONS,
  CIDADES_BR_OPTIONS,
  ESTADO_CIVIL_OPTIONS,
  NACIONALIDADES_OPTIONS,
  NACIONALIDADES_PASSAPORTE_OPTIONS,
  PAISES_OPTIONS,
  PROFISSAO_OPTIONS,
} from "@/lib/cliente-form-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { IconX } from "@/components/icons";
import type {
  Cliente,
  ClienteEndereco,
  ClienteSexo,
  ClienteStatus,
} from "@/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (cliente: Cliente) => void;
  keepOpenAfterSave?: boolean;
};

type TabId =
  | "contato"
  | "documentos"
  | "informacoes"
  | "endereco"
  | "observacao";

const TABS: { id: TabId; label: string }[] = [
  { id: "contato", label: "Contato" },
  { id: "documentos", label: "Documentos" },
  { id: "informacoes", label: "Informações" },
  { id: "endereco", label: "Endereço" },
  { id: "observacao", label: "Observação" },
];

/** Classificação Hub — etapas 1–5 no funil (UI: linha com nós, não barras nem estrelas) */
const CLASSIFICACAO_HUB = [
  { nivel: 1, titulo: "Primeiro contato", resumo: "Descoberta" },
  { nivel: 2, titulo: "Diagnóstico de viagem", resumo: "Diagnóstico" },
  { nivel: 3, titulo: "Proposta em análise", resumo: "Proposta" },
  { nivel: 4, titulo: "Alta chance de fechar", resumo: "Negociação" },
  { nivel: 5, titulo: "Conta-chave / recorrente", resumo: "Hub+" },
] as const;

function ClassificacaoHub({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div
      className="flex flex-col items-end gap-1.5"
      title="Classifique esse cliente"
    >
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--hub-text-muted)]">
        Etapa no funil
      </span>
      <div
        className="flex items-center"
        role="group"
        aria-label="Classifique esse cliente. Etapas no funil de 1 a 5."
      >
        {CLASSIFICACAO_HUB.map(({ nivel, titulo }, idx) => {
          const reached = value != null && nivel <= value;
          const current = value === nivel;
          const last = nivel === 5;

          return (
            <div key={nivel} className="flex items-center">
              {idx > 0 ?
                <span
                  className={`h-0.5 w-2 shrink-0 sm:w-3 ${
                    value != null && nivel <= value ?
                      "bg-[var(--hub-blue)]"
                    : "bg-[var(--hub-border)]"
                  }`}
                  aria-hidden
                />
              : null}
              <button
                type="button"
                title={titulo}
                onClick={() =>
                  onChange(value === nivel ? undefined : nivel)
                }
                className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hub-blue)] focus-visible:ring-offset-2 ${
                  current && last ?
                    "bg-[var(--hub-yellow)] text-[var(--hub-blue-dark)] ring-2 ring-[var(--hub-yellow-hover)] ring-offset-1 ring-offset-white"
                  : reached ?
                    "bg-[var(--hub-blue)] text-white shadow-sm"
                  : "border-2 border-[var(--hub-border)] bg-white text-[var(--hub-text-muted)] hover:border-[var(--hub-border)] hover:text-[var(--hub-text-secondary)]"
                }`}
                aria-pressed={Boolean(value && nivel <= value)}
              >
                {nivel}
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex max-w-[11rem] flex-col items-end gap-0 text-right">
        <span
          className={`text-[11px] font-semibold leading-tight ${
            value ? "text-[var(--hub-blue-dark)]" : "text-[var(--hub-text-muted)]"
          }`}
          aria-live="polite"
        >
          {value ?
            CLASSIFICACAO_HUB[value - 1]?.titulo
          : "Classifique esse cliente"}
        </span>
        {value ?
          <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--hub-blue)]">
            {CLASSIFICACAO_HUB[value - 1]?.resumo}
          </span>
        : null}
      </div>
    </div>
  );
}

function emptyEndereco(): ClienteEndereco {
  return {
    pais: "Brasil",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
  };
}

function enderecoHasContent(e: ClienteEndereco): boolean {
  const empty = emptyEndereco();
  return (Object.keys(empty) as (keyof ClienteEndereco)[]).some((key) => {
    const v = e[key];
    const d = empty[key];
    const vs = v != null ? String(v).trim() : "";
    const ds = d != null ? String(d).trim() : "";
    return vs !== ds;
  });
}

function TipoSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hub-blue)] focus-visible:ring-offset-2 ${
          checked ? "bg-sky-600" : "bg-[var(--hub-border)]"
        }`}
      >
        <span
          className={`pointer-events-none absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      <span className="text-sm font-medium text-[var(--hub-text-primary)]">{label}</span>
    </label>
  );
}

export function NovoClienteModal({ open, onClose, onCreated, keepOpenAfterSave = false }: Props) {
  const { addCliente } = useData();
  const toast = useToast();
  const [tab, setTab] = useState<TabId>("contato");

  const [nome, setNome] = useState("");
  const [avaliacao, setAvaliacao] = useState<number | undefined>(undefined);
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState<ClienteSexo>("nao_informado");

  const [tipoPassageiro, setTipoPassageiro] = useState(false);
  const [tipoCliente, setTipoCliente] = useState(true);
  const [tipoFornecedor, setTipoFornecedor] = useState(false);
  const [tipoRepresentante, setTipoRepresentante] = useState(false);

  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [redeSocial, setRedeSocial] = useState("");
  const [site, setSite] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [aceitaComunicacao, setAceitaComunicacao] = useState(true);

  const [documentoCpfCnpj, setDocumentoCpfCnpj] = useState("");
  const [documentoRg, setDocumentoRg] = useState("");
  const [documentoOrgaoEmissorRg, setDocumentoOrgaoEmissorRg] = useState("");
  const [documentoInscricaoMunicipal, setDocumentoInscricaoMunicipal] =
    useState("");
  const [documentoIdEstrangeiro, setDocumentoIdEstrangeiro] = useState("");
  const [documentoNacionalidade, setDocumentoNacionalidade] = useState("");
  const [documentoEstadoCivil, setDocumentoEstadoCivil] = useState("");
  const [documentoPassaporte, setDocumentoPassaporte] = useState("");
  const [documentoPassaporteEmissao, setDocumentoPassaporteEmissao] =
    useState("");
  const [documentoPassaporteVencimento, setDocumentoPassaporteVencimento] =
    useState("");
  const [documentoPassaporteNacionalidade, setDocumentoPassaporteNacionalidade] =
    useState("");
  const [documentoVisto, setDocumentoVisto] = useState("");
  const [documentoVistoValidade, setDocumentoVistoValidade] = useState("");
  const [documentosObs, setDocumentosObs] = useState("");

  const [profissao, setProfissao] = useState("");
  const [renda, setRenda] = useState("");
  const [canalVenda, setCanalVenda] = useState("");
  const [emergenciaNome, setEmergenciaNome] = useState("");
  const [emergenciaTelefone, setEmergenciaTelefone] = useState("");

  const [destinoInteresse, setDestinoInteresse] = useState("");
  const [status, setStatus] = useState<ClienteStatus>("prospecto");
  const [informacoesExtras, setInformacoesExtras] = useState("");

  const [endereco, setEndereco] = useState<ClienteEndereco>(() =>
    emptyEndereco(),
  );

  const [observacoes, setObservacoes] = useState("");

  function patchEndereco(patch: Partial<ClienteEndereco>) {
    setEndereco((e) => ({ ...e, ...patch }));
  }

  function reset() {
    setTab("contato");
    setNome("");
    setAvaliacao(undefined);
    setDataNascimento("");
    setSexo("nao_informado");
    setTipoPassageiro(false);
    setTipoCliente(true);
    setTipoFornecedor(false);
    setTipoRepresentante(false);
    setTelefone("");
    setEmail("");
    setRedeSocial("");
    setSite("");
    setChavePix("");
    setAceitaComunicacao(true);
    setDocumentoCpfCnpj("");
    setDocumentoRg("");
    setDocumentoOrgaoEmissorRg("");
    setDocumentoInscricaoMunicipal("");
    setDocumentoIdEstrangeiro("");
    setDocumentoNacionalidade("");
    setDocumentoEstadoCivil("");
    setDocumentoPassaporte("");
    setDocumentoPassaporteEmissao("");
    setDocumentoPassaporteVencimento("");
    setDocumentoPassaporteNacionalidade("");
    setDocumentoVisto("");
    setDocumentoVistoValidade("");
    setDocumentosObs("");
    setProfissao("");
    setRenda("");
    setCanalVenda("");
    setEmergenciaNome("");
    setEmergenciaTelefone("");
    setDestinoInteresse("");
    setStatus("prospecto");
    setInformacoesExtras("");
    setEndereco(emptyEndereco());
    setObservacoes("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(): Promise<boolean> {
    if (!nome.trim()) return false;

    const anyTipo =
      tipoPassageiro || tipoCliente || tipoFornecedor || tipoRepresentante;
    const tp = tipoPassageiro;
    const tc = tipoCliente || !anyTipo;
    const tf = tipoFornecedor;
    const tr = tipoRepresentante;

    const telDigits = brPhoneDigits(telefone);
    const telefoneSalvo = telDigits
      ? formatBrPhoneDisplay(telDigits)
      : telefone.trim();

    const emDig = brPhoneDigits(emergenciaTelefone);
    const emergenciaTelSalvo = emDig
      ? formatBrPhoneDisplay(emDig)
      : emergenciaTelefone.trim();

    const end = enderecoHasContent(endereco) ?
        {
          pais: endereco.pais?.trim(),
          cep: endereco.cep?.trim(),
          logradouro: endereco.logradouro?.trim(),
          numero: endereco.numero?.trim(),
          complemento: endereco.complemento?.trim(),
          bairro: endereco.bairro?.trim(),
          cidade: endereco.cidade?.trim(),
          uf: endereco.uf?.trim().toUpperCase().slice(0, 2),
        }
      : undefined;

    try {
      const novo = await addCliente({
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefoneSalvo,
        destinoInteresse: destinoInteresse.trim(),
        status,
        observacoes: observacoes.trim(),
        avaliacao,
        dataNascimento: dataNascimento.trim() || undefined,
        sexo,
        tipoPassageiro: tp,
        tipoCliente: tc,
        tipoFornecedor: tf,
        tipoRepresentante: tr,
        redeSocial: redeSocial.trim(),
        site: site.trim(),
        chavePix: chavePix.trim(),
        aceitaComunicacao,
        documentosObs: documentosObs.trim(),
        documentoCpfCnpj: documentoCpfCnpj.trim(),
        documentoRg: documentoRg.trim(),
        documentoOrgaoEmissorRg: documentoOrgaoEmissorRg.trim(),
        documentoInscricaoMunicipal: documentoInscricaoMunicipal.trim(),
        documentoIdEstrangeiro: documentoIdEstrangeiro.trim(),
        documentoNacionalidade: documentoNacionalidade.trim(),
        documentoEstadoCivil: documentoEstadoCivil.trim(),
        documentoPassaporte: documentoPassaporte.trim(),
        documentoPassaporteEmissao:
          documentoPassaporteEmissao.trim() || undefined,
        documentoPassaporteVencimento:
          documentoPassaporteVencimento.trim() || undefined,
        documentoPassaporteNacionalidade:
          documentoPassaporteNacionalidade.trim(),
        documentoVisto: documentoVisto.trim(),
        documentoVistoValidade: documentoVistoValidade.trim() || undefined,
        profissao: profissao.trim(),
        renda: renda.trim(),
        canalVenda: canalVenda.trim(),
        emergenciaNome: emergenciaNome.trim(),
        emergenciaTelefone: emergenciaTelSalvo,
        informacoesExtras: informacoesExtras.trim(),
        endereco: end,
      });
      onCreated(novo);
      toast.success(`Cliente "${novo.nome}" cadastrado!`);
      reset();
      if (!keepOpenAfterSave) onClose();
      return true;
    } catch (e) {
      if (e instanceof DuplicateCustomerError) {
        toast.error(e.message);
      } else {
        toast.error("Erro ao salvar cliente. Tente novamente.");
      }
      return false;
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4">
      <div
        className="my-6 w-full max-w-4xl rounded-[var(--hub-radius-xl)] border border-[var(--hub-border)] bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="novo-cli-titulo"
      >
        <div className="flex items-center justify-between border-b border-[var(--hub-border)] px-5 py-4">
          <h2
            id="novo-cli-titulo"
            className="text-lg font-bold text-[var(--hub-blue-dark)]"
          >
            Novo cliente
          </h2>
          <button
            type="button"
            className="rounded-[var(--hub-radius)] p-1.5 text-[var(--hub-text-muted)] hover:bg-[var(--hub-bg-subtle)]"
            onClick={handleClose}
            aria-label="Fechar"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 pb-5 pt-4">
          <div className="space-y-4 border-b border-[var(--hub-border)] pb-4">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <Label htmlFor="nc-nome">Nome *</Label>
                <Input
                  id="nc-nome"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  autoComplete="name"
                  className="mt-1"
                />
              </div>
              <div className="shrink-0 pt-6">
                <ClassificacaoHub
                  value={avaliacao}
                  onChange={setAvaliacao}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="nc-nasc">Data nascimento</Label>
                <Input
                  id="nc-nasc"
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="nc-sexo">Sexo</Label>
                <Select
                  id="nc-sexo"
                  value={sexo}
                  onChange={(e) =>
                    setSexo(e.target.value as ClienteSexo)
                  }
                  className="mt-1"
                >
                  <option value="nao_informado">Não informado</option>
                  <option value="feminino">Feminino</option>
                  <option value="masculino">Masculino</option>
                  <option value="outro">Outro</option>
                </Select>
              </div>
            </div>

            <div>
              <span className="text-sm font-medium text-[var(--hub-blue-dark)]">
                Tipo *
              </span>
              <div className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
                <TipoSwitch
                  label="Passageiro"
                  checked={tipoPassageiro}
                  onChange={setTipoPassageiro}
                />
                <TipoSwitch
                  label="Cliente"
                  checked={tipoCliente}
                  onChange={setTipoCliente}
                />
                <TipoSwitch
                  label="Fornecedor"
                  checked={tipoFornecedor}
                  onChange={setTipoFornecedor}
                />
                <TipoSwitch
                  label="Representante"
                  checked={tipoRepresentante}
                  onChange={setTipoRepresentante}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 border-b border-[var(--hub-border)]">
            <nav className="-mb-px flex flex-wrap gap-1" aria-label="Seções">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                    tab === t.id
                      ? "border-[var(--hub-blue)] text-[var(--hub-blue-dark)]"
                      : "border-transparent text-[var(--hub-text-muted)] hover:text-[var(--hub-text-primary)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-4 min-h-[220px] space-y-3">
            {tab === "contato" ? (
              <>
                <div>
                  <Label htmlFor="nc-cel">Celular</Label>
                  <div className="mt-1 flex gap-2">
                    <span
                      className="flex shrink-0 items-center rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-2 text-xs text-[var(--hub-text-secondary)]"
                      title="Brasil"
                    >
                      🇧🇷 +55
                    </span>
                    <Input
                      id="nc-cel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="(11) 98765-4321"
                      value={formatBrPhoneDisplay(telefone)}
                      onChange={(e) =>
                        setTelefone(brPhoneDigits(e.target.value))
                      }
                      className="min-w-0 flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="nc-email">E-mail</Label>
                  <Input
                    id="nc-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="nome@email.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="nc-ig">Rede social</Label>
                  <Input
                    id="nc-ig"
                    value={redeSocial}
                    onChange={(e) => setRedeSocial(e.target.value)}
                    placeholder="@instagram ou link"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="nc-site">Site</Label>
                  <Input
                    id="nc-site"
                    type="url"
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    placeholder="https://"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="nc-pix">Chave Pix</Label>
                  <Input
                    id="nc-pix"
                    value={chavePix}
                    onChange={(e) => setChavePix(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-3 rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)]/80 px-3 py-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[var(--hub-border)] text-[var(--hub-blue)]"
                    checked={aceitaComunicacao}
                    onChange={(e) => setAceitaComunicacao(e.target.checked)}
                  />
                  <span className="text-sm text-[var(--hub-text-primary)]">
                    Aceita receber comunicação via e-mail / WhatsApp
                  </span>
                </label>
              </>
            ) : null}

            {tab === "documentos" ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <Label htmlFor="nc-cpf">CPF / CNPJ</Label>
                    <Input
                      id="nc-cpf"
                      value={documentoCpfCnpj}
                      onChange={(e) => setDocumentoCpfCnpj(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nc-rg">RG</Label>
                    <Input
                      id="nc-rg"
                      value={documentoRg}
                      onChange={(e) => setDocumentoRg(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nc-org-rg">Órgão emissor RG</Label>
                    <Input
                      id="nc-org-rg"
                      value={documentoOrgaoEmissorRg}
                      onChange={(e) =>
                        setDocumentoOrgaoEmissorRg(e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nc-im">Inscrição municipal</Label>
                    <Input
                      id="nc-im"
                      value={documentoInscricaoMunicipal}
                      onChange={(e) =>
                        setDocumentoInscricaoMunicipal(e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="nc-id-est">ID estrangeiro</Label>
                    <Input
                      id="nc-id-est"
                      value={documentoIdEstrangeiro}
                      onChange={(e) =>
                        setDocumentoIdEstrangeiro(e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nc-nac">Nacionalidade</Label>
                    <Select
                      id="nc-nac"
                      value={documentoNacionalidade}
                      onChange={(e) =>
                        setDocumentoNacionalidade(e.target.value)
                      }
                      className="mt-1"
                    >
                      {NACIONALIDADES_OPTIONS.map((o) => (
                        <option key={o.label} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="nc-ec">Estado civil</Label>
                  <Select
                    id="nc-ec"
                    value={documentoEstadoCivil}
                    onChange={(e) =>
                      setDocumentoEstadoCivil(e.target.value)
                    }
                    className="mt-1"
                  >
                    {ESTADO_CIVIL_OPTIONS.map((o) => (
                      <option key={o.label} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <Label htmlFor="nc-pass">Passaporte</Label>
                    <Input
                      id="nc-pass"
                      value={documentoPassaporte}
                      onChange={(e) => setDocumentoPassaporte(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nc-pass-emi">Emissão passaporte</Label>
                    <Input
                      id="nc-pass-emi"
                      type="date"
                      value={documentoPassaporteEmissao}
                      onChange={(e) =>
                        setDocumentoPassaporteEmissao(e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nc-pass-ven">Vencimento passaporte</Label>
                    <Input
                      id="nc-pass-ven"
                      type="date"
                      value={documentoPassaporteVencimento}
                      onChange={(e) =>
                        setDocumentoPassaporteVencimento(e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nc-pass-nac">
                      Nacionalidade do passaporte
                    </Label>
                    <Select
                      id="nc-pass-nac"
                      value={documentoPassaporteNacionalidade}
                      onChange={(e) =>
                        setDocumentoPassaporteNacionalidade(e.target.value)
                      }
                      className="mt-1"
                    >
                      {NACIONALIDADES_PASSAPORTE_OPTIONS.map((o) => (
                        <option key={o.label} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="nc-visto">Visto</Label>
                    <Input
                      id="nc-visto"
                      value={documentoVisto}
                      onChange={(e) => setDocumentoVisto(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nc-visto-val">Validade do visto</Label>
                    <Input
                      id="nc-visto-val"
                      type="date"
                      value={documentoVistoValidade}
                      onChange={(e) =>
                        setDocumentoVistoValidade(e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="nc-docs-extra">Anotações sobre documentos</Label>
                  <Textarea
                    id="nc-docs-extra"
                    rows={3}
                    value={documentosObs}
                    onChange={(e) => setDocumentosObs(e.target.value)}
                    placeholder="Observações adicionais…"
                    className="mt-1"
                  />
                </div>
              </div>
            ) : null}

            {tab === "informacoes" ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="nc-prof">Profissão</Label>
                    <Select
                      id="nc-prof"
                      value={profissao}
                      onChange={(e) => setProfissao(e.target.value)}
                      className="mt-1"
                    >
                      {PROFISSAO_OPTIONS.map((o) => (
                        <option key={o.label} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="nc-renda">Renda</Label>
                    <Input
                      id="nc-renda"
                      inputMode="decimal"
                      value={renda}
                      onChange={(e) => setRenda(e.target.value)}
                      placeholder="R$"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nc-canal">Canal de venda</Label>
                    <Select
                      id="nc-canal"
                      value={canalVenda}
                      onChange={(e) => setCanalVenda(e.target.value)}
                      className="mt-1"
                    >
                      {CANAL_VENDA_OPTIONS.map((o) => (
                        <option key={o.label} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="nc-em-nome">
                      Nome contato de emergência
                    </Label>
                    <Input
                      id="nc-em-nome"
                      value={emergenciaNome}
                      onChange={(e) => setEmergenciaNome(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nc-em-tel">
                      Telefone contato de emergência
                    </Label>
                    <div className="mt-1 flex gap-2">
                      <span className="flex shrink-0 items-center rounded-[var(--hub-radius)] border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-2 text-xs text-[var(--hub-text-secondary)]">
                        🇧🇷 +55
                      </span>
                      <Input
                        id="nc-em-tel"
                        inputMode="numeric"
                        value={formatBrPhoneDisplay(emergenciaTelefone)}
                        onChange={(e) =>
                          setEmergenciaTelefone(
                            brPhoneDigits(e.target.value),
                          )
                        }
                        placeholder="(11) 98765-4321"
                        className="min-w-0 flex-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 border-t border-[var(--hub-border)] pt-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="nc-dest">Destino de interesse</Label>
                    <Input
                      id="nc-dest"
                      value={destinoInteresse}
                      onChange={(e) => setDestinoInteresse(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nc-st">Status no CRM</Label>
                    <Select
                      id="nc-st"
                      value={status}
                      onChange={(e) =>
                        setStatus(e.target.value as ClienteStatus)
                      }
                      className="mt-1"
                    >
                      <option value="prospecto">Prospecto</option>
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="nc-inf">Informações adicionais</Label>
                  <Textarea
                    id="nc-inf"
                    rows={4}
                    value={informacoesExtras}
                    onChange={(e) => setInformacoesExtras(e.target.value)}
                    placeholder="Perfil de viagem, preferências…"
                    className="mt-1"
                  />
                </div>
              </div>
            ) : null}

            {tab === "endereco" ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="nc-pais">País</Label>
                    <Select
                      id="nc-pais"
                      value={endereco.pais ?? "Brasil"}
                      onChange={(e) =>
                        patchEndereco({ pais: e.target.value })
                      }
                      className="mt-1"
                    >
                      {PAISES_OPTIONS.map((o) => (
                        <option key={o.label} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="nc-cep">CEP</Label>
                    <Input
                      id="nc-cep"
                      value={endereco.cep ?? ""}
                      onChange={(e) =>
                        patchEndereco({ cep: e.target.value })
                      }
                      placeholder="00000-000"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nc-cid">Cidade</Label>
                    <Input
                      id="nc-cid"
                      list="nc-lista-cidades"
                      value={endereco.cidade ?? ""}
                      onChange={(e) =>
                        patchEndereco({ cidade: e.target.value })
                      }
                      placeholder="Selecione na lista ou digite"
                      className="mt-1"
                    />
                    <datalist id="nc-lista-cidades">
                      {CIDADES_BR_OPTIONS.filter((o) => o.value).map((o) => (
                        <option key={o.value} value={o.value} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <Label htmlFor="nc-logr">Endereço</Label>
                    <Input
                      id="nc-logr"
                      value={endereco.logradouro ?? ""}
                      onChange={(e) =>
                        patchEndereco({ logradouro: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="w-full shrink-0 sm:w-28">
                    <Label htmlFor="nc-num">Número</Label>
                    <Input
                      id="nc-num"
                      value={endereco.numero ?? ""}
                      onChange={(e) =>
                        patchEndereco({ numero: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="nc-comp">Complemento</Label>
                    <Input
                      id="nc-comp"
                      value={endereco.complemento ?? ""}
                      onChange={(e) =>
                        patchEndereco({ complemento: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nc-bairro">Bairro</Label>
                    <Input
                      id="nc-bairro"
                      value={endereco.bairro ?? ""}
                      onChange={(e) =>
                        patchEndereco({ bairro: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="max-w-xs">
                  <Label htmlFor="nc-uf">UF</Label>
                  <Input
                    id="nc-uf"
                    value={endereco.uf ?? ""}
                    onChange={(e) =>
                      patchEndereco({
                        uf: e.target.value.toUpperCase().slice(0, 2),
                      })
                    }
                    maxLength={2}
                    placeholder="SP"
                    className="mt-1"
                  />
                </div>
              </div>
            ) : null}

            {tab === "observacao" ? (
              <div>
                <Label htmlFor="nc-obs">Observação geral</Label>
                <Textarea
                  id="nc-obs"
                  rows={10}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Notas internas da equipe…"
                  className="mt-1"
                />
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-[var(--hub-border)] pt-4">
            <Button type="button" variant="secondary" onClick={handleClose}>
              {keepOpenAfterSave ? "Fechar" : "Cancelar"}
            </Button>
            {keepOpenAfterSave && (
              <Button
                type="button"
                variant="secondary"
                onClick={async () => { const ok = await handleSubmit(); if (ok) onClose(); }}
              >
                Salvar e fechar
              </Button>
            )}
            <Button type="button" onClick={handleSubmit}>
              {keepOpenAfterSave ? "Salvar e adicionar outro" : "Salvar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
