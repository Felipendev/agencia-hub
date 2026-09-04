import type { CotacaoDetalhes } from "@/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  getPublicConfig: vi.fn(),
  addSubmission: vi.fn(),
  isLocalSolicitacaoStoreEnabled: vi.fn(),
}));

vi.mock("@/lib/solicitacao-server-store", () => ({
  getPublicConfig: mocks.getPublicConfig,
  addSubmission: mocks.addSubmission,
  isLocalSolicitacaoStoreEnabled: mocks.isLocalSolicitacaoStoreEnabled,
}));

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const baseDet: Partial<CotacaoDetalhes> = {
  origem: "Belo Horizonte",
  destinosTrechos: ["BH — Lisboa"],
  destinoForm: "BH — Lisboa",
  celular: "31982615986",
  whatsapp: "31982615986",
  whatsappIgualCelular: true,
};

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("NEXT_PUBLIC_AGENCIA_HUB_API_URL", "");
  vi.stubEnv("VERCEL", "");
  vi.clearAllMocks();
  mocks.getPublicConfig.mockResolvedValue({ slug: "demo" });
  mocks.addSubmission.mockResolvedValue({ id: "sub-1" });
  mocks.isLocalSolicitacaoStoreEnabled.mockReturnValue(true);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/public/solicitacao/submit", () => {
  it("returns ok when payload is valid (local store, sem API)", async () => {
    const res = await POST(
      jsonRequest({
        slug: "demo",
        nome: "Maria",
        email: "m@x.com",
        detalhes: baseDet,
        observacoes: "",
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; id: string };
    expect(body.ok).toBe(true);
    expect(mocks.addSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        telefone: "31982615986",
        nome: "Maria",
      }),
    );
  });

  it("proxies to Java when NEXT_PUBLIC_AGENCIA_HUB_API_URL está definida", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_AGENCIA_HUB_API_URL",
      "http://localhost:8080/api/v1",
    );
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          id: "11111111-1111-1111-1111-111111111111",
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      jsonRequest({
        slug: "demo",
        nome: "Maria",
        email: "m@x.com",
        detalhes: baseDet,
        observacoes: "",
      }),
    );
    expect(res.status).toBe(201);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/public/solicitacao/submit",
      expect.objectContaining({ method: "POST" }),
    );
    const forwarded = JSON.parse(
      (fetchMock.mock.calls[0][1] as { body: string }).body,
    ) as { referralSellerId?: string };
    expect(forwarded.referralSellerId).toBeUndefined();
    expect(mocks.addSubmission).not.toHaveBeenCalled();
  });

  it("encaminha referralSellerId válido para a API Java", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_AGENCIA_HUB_API_URL",
      "http://localhost:8080/api/v1",
    );
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          id: "11111111-1111-1111-1111-111111111111",
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const ref = "22222222-2222-2222-2222-222222222222";
    const res = await POST(
      jsonRequest({
        slug: "demo",
        nome: "Maria",
        email: "m@x.com",
        detalhes: baseDet,
        observacoes: "",
        referralSellerId: ref,
      }),
    );
    expect(res.status).toBe(201);
    const forwarded = JSON.parse(
      (fetchMock.mock.calls[0][1] as { body: string }).body,
    ) as { referralSellerId?: string };
    expect(forwarded.referralSellerId).toBe(ref);
  });

  it("ignora referralSellerId inválido no proxy Java", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_AGENCIA_HUB_API_URL",
      "http://localhost:8080/api/v1",
    );
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, id: "11111111-1111-1111-1111-111111111111" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await POST(
      jsonRequest({
        slug: "demo",
        nome: "Maria",
        email: "m@x.com",
        detalhes: baseDet,
        observacoes: "",
        referralSellerId: "not-a-uuid",
      }),
    );
    const forwarded = JSON.parse(
      (fetchMock.mock.calls[0][1] as { body: string }).body,
    ) as { referralSellerId?: string };
    expect(forwarded.referralSellerId).toBeUndefined();
  });

  it("returns 503 na Vercel sem URL da API", async () => {
    vi.stubEnv("VERCEL", "1");
    mocks.isLocalSolicitacaoStoreEnabled.mockReturnValue(false);
    const res = await POST(
      jsonRequest({
        slug: "demo",
        nome: "Maria",
        detalhes: baseDet,
      }),
    );
    expect(res.status).toBe(503);
  });

  it("returns 400 when slug is invalid", async () => {
    const res = await POST(
      jsonRequest({
        slug: "INVALID",
        nome: "Maria",
        detalhes: baseDet,
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when origem/destino missing", async () => {
    const res = await POST(
      jsonRequest({
        slug: "demo",
        nome: "Maria",
        detalhes: { ...baseDet, origem: "", destinosTrechos: [""], destinoForm: "" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 503 when persistência local falha", async () => {
    mocks.addSubmission.mockRejectedValue(new Error("disk"));
    const res = await POST(
      jsonRequest({
        slug: "demo",
        nome: "Maria",
        detalhes: baseDet,
      }),
    );
    expect(res.status).toBe(503);
  });
});
