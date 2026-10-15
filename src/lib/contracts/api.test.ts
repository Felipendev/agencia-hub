import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/agencia-hub-env", () => ({ getAgenciaHubApiBaseUrl: () => "https://api.example/api/v1" }));
import { ContractApiError, contractsApi, uploadProblem } from "./api";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("cliente HTTP de contratos", () => {
  it("envia a chave de idempotência e o token na criação do rascunho", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ contract: { id: "k" } }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    await contractsApi.create("tok", "key-1", { customerId: "p", product: "TRAVEL", templateId: "t", title: "T", planName: null, price: null, startDate: null, endDate: null, paymentMode: null, installments: null, paymentTerms: null, notes: null });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.example/api/v1/contracts");
    const headers = init.headers as Headers;
    expect(headers.get("Idempotency-Key")).toBe("key-1");
    expect(headers.get("Authorization")).toBe("Bearer tok");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("propaga campos faltantes e status sem confirmar sucesso", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(
      { message: "Preencha os campos destacados antes de gerar o documento.", code: "CONTRACT_INCOMPLETE", missingFields: [{ key: "contrato.valor", label: "Valor total", source: "CONTRACT" }] },
      { status: 422 })));
    const error = await contractsApi.generate("tok", "c1", 1).catch((e) => e);
    expect(error).toBeInstanceOf(ContractApiError);
    expect(error.status).toBe(422);
    expect(error.code).toBe("CONTRACT_INCOMPLETE");
    expect(error.missingFields.map((f: { key: string }) => f.key)).toEqual(["contrato.valor"]);
  });

  it("traduz falha de rede e resposta sem corpo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch")).mockResolvedValueOnce(new Response(null, { status: 409 })));
    await expect(contractsApi.get("tok", "c1")).rejects.toThrow(/Nada foi salvo/);
    await expect(contractsApi.get("tok", "c1")).rejects.toThrow(/alterado por outra pessoa/);
  });

  it("não chama a API sem sessão", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(contractsApi.list(null)).rejects.toThrow(/Conecte-se/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("assina com multipart sem forçar JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({}));
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["%PDF"], "assinado.pdf", { type: "application/pdf" });
    await contractsApi.sign("tok", "c1", { expectedVersion: 3, signedOn: "2026-10-14", note: " papel ", file });
    const init = fetchMock.mock.calls[0][1];
    const form = init.body as FormData;
    expect((init.headers as Headers).get("Content-Type")).toBeNull();
    expect(form.get("expectedVersion")).toBe("3");
    expect(form.get("note")).toBe("papel");
    expect((form.get("file") as File).name).toBe("assinado.pdf");
  });

  it("valida arquivos antes do envio", () => {
    expect(uploadProblem(null)).toMatch(/Escolha/);
    expect(uploadProblem(new File([], "a.pdf", { type: "application/pdf" }))).toMatch(/vazio/);
    expect(uploadProblem(new File(["x"], "a.exe", { type: "application/x-msdownload" }))).toMatch(/PDF/);
    expect(uploadProblem(new File(["x"], "a.png", { type: "image/png" }))).toBeNull();
  });
});
