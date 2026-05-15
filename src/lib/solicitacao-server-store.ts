import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { generateId } from "@/lib/format";
import { mergeCotacaoDetalhes } from "@/lib/cotacao-migrate";
import type {
  SolicitacaoPublicaConfig,
  SolicitacaoPublicSubmission,
} from "@/types/solicitacao-publica";

/** Armazenamento local só para desenvolvimento sem API Java (`.local/`). Produção usa o backend. */
const DIR = path.join(process.cwd(), ".local");
const FILE = path.join(DIR, "solicitacao-hub.json");

type Persisted = {
  configs: Record<string, SolicitacaoPublicaConfig>;
  submissions: SolicitacaoPublicSubmission[];
};

const defaultConfigs: Record<string, SolicitacaoPublicaConfig> = {
  demo: {
    slug: "demo",
    tituloPagina: "Solicitação de Orçamento",
    textoIntro:
      "Preencha os dados abaixo em poucos minutos. Nossa equipe retorna o mais rápido possível, priorizando viagens com datas mais próximas.",
    logoDataUrl: null,
    nomeMarca: "AgenciaHub",
    linksSociais: [
      {
        id: "d1",
        tipo: "whatsapp",
        url: "https://wa.me/",
        label: "WhatsApp",
      },
      {
        id: "d2",
        tipo: "instagram",
        url: "https://instagram.com/",
        label: "Instagram",
      },
      {
        id: "d3",
        tipo: "email",
        url: "mailto:contato@agencia.com",
        label: "E-mail",
      },
    ],
  },
};

async function readRaw(): Promise<Persisted> {
  try {
    const raw = await readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      configs: { ...defaultConfigs, ...(parsed.configs ?? {}) },
      submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
    };
  } catch {
    return {
      configs: { ...defaultConfigs },
      submissions: [],
    };
  }
}

async function writeRaw(data: Persisted): Promise<void> {
  await mkdir(DIR, { recursive: true });
  await writeFile(FILE, JSON.stringify(data, null, 2), "utf8");
}

export function getDefaultConfig(slug: string): SolicitacaoPublicaConfig {
  const base = defaultConfigs.demo;
  return {
    ...base,
    slug,
    nomeMarca: base.nomeMarca,
  };
}

export async function getPublicConfig(
  slug: string,
): Promise<SolicitacaoPublicaConfig> {
  const data = await readRaw();
  const c = data.configs[slug];
  if (c) return c;
  if (slug === "demo") return { ...defaultConfigs.demo };
  return { ...getDefaultConfig(slug), slug };
}

export async function upsertConfig(
  config: SolicitacaoPublicaConfig,
): Promise<void> {
  const data = await readRaw();
  data.configs[config.slug] = config;
  await writeRaw(data);
}

export async function addSubmission(input: {
  slug: string;
  nome: string;
  email: string;
  telefone: string;
  detalhes: SolicitacaoPublicSubmission["detalhes"];
  observacoes: string;
  referralSellerId?: string;
  sellerPublicCode?: string | null;
}): Promise<SolicitacaoPublicSubmission> {
  const data = await readRaw();
  const row: SolicitacaoPublicSubmission = {
    id: generateId(),
    slug: input.slug,
    createdAt: new Date().toISOString(),
    nome: input.nome.trim(),
    email: input.email.trim(),
    telefone: input.telefone.trim(),
    detalhes: mergeCotacaoDetalhes(input.detalhes),
    observacoes: input.observacoes.trim(),
    referralSellerId: input.referralSellerId ?? null,
    sellerPublicCode: input.sellerPublicCode?.trim() || null,
  };
  data.submissions.unshift(row);
  await writeRaw(data);
  return row;
}

export async function listSubmissions(): Promise<SolicitacaoPublicSubmission[]> {
  const data = await readRaw();
  return [...data.submissions];
}

export async function removeSubmission(id: string): Promise<boolean> {
  const data = await readRaw();
  const before = data.submissions.length;
  data.submissions = data.submissions.filter((s) => s.id !== id);
  if (data.submissions.length === before) return false;
  await writeRaw(data);
  return true;
}
