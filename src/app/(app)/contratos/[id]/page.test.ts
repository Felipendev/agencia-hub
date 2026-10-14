// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ContratoPage from "./page";

const push = vi.fn();
let accountKind = "AGENCY_OWNER";
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ token: "tok", user: { accountKind } }) }));
vi.mock("@/lib/api/agencia-hub-env", () => ({ getAgenciaHubApiBaseUrl: () => "https://api.example" }));
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "c1" }),
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); push.mockReset(); accountKind = "AGENCY_OWNER"; });

const template = { id: "t1", name: "Assessoria", description: null, currentVersion: 1, archived: false, rowVersion: 1, contractCount: 1, updatedAt: "2026-10-14T12:00:00Z" };
const missingPrice = [{ key: "contrato.valor", label: "Valor total", source: "CONTRACT" }];
function detail(overrides: Record<string, unknown> = {}, contract: Record<string, unknown> = {}) {
  return {
    contract: { id: "c1", customerId: "p1", customerName: "Ana", templateId: "t1", templateName: "Assessoria", templateVersion: 1, title: "Assessoria anual",
      status: "DRAFT", planName: null, price: null, startDate: null, endDate: null, latestDocumentVersion: null, documentCurrent: false, rowVersion: 1,
      updatedAt: "2026-10-14T12:00:00Z", ...contract },
    paymentMode: null, installments: null, paymentTerms: null, notes: null, dataRevision: 1, latestTemplateVersion: 1, sentOn: null, signedOn: null,
    cancelledAt: null, cancelReason: null, missingFields: [], documents: [], attachments: [], receivables: [], history: [], ...overrides,
  };
}
const calls = (mock: ReturnType<typeof vi.fn>) => mock.mock.calls.map(([url, init]) => `${init?.method ?? "GET"} ${String(url).replace("https://api.example", "")}`);

describe("detalhe do contrato", () => {
  it("destaca campos faltantes, salva o rascunho pelo mesmo ID e só confirma após a API", async () => {
    const saved = detail({}, { price: 1200, rowVersion: 2 });
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/contracts/c1") && init?.method === "PATCH") return Response.json(saved);
      if (url.endsWith("/contracts/c1")) return Response.json(detail({ missingFields: missingPrice }));
      if (url.includes("/contract-templates")) return Response.json([template]);
      if (url.includes("/sales/receivables")) return Response.json([]);
      throw new Error(`unexpected ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(ContratoPage));
    expect(await screen.findByText("Preencha antes de gerar o documento:")).toBeTruthy();
    expect(screen.getByLabelText("Valor total (R$)").className).toContain("border-amber-400");
    expect((screen.getByRole("button", { name: "Gerar documento" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Valor total (R$)"), { target: { value: "1.200,00" } });
    expect(screen.getByText("Salve o rascunho antes de gerar ou enviar.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Salvar rascunho" }));
    await screen.findByText("Rascunho salvo.");
    const patch = fetchMock.mock.calls.find(([, init]) => init?.method === "PATCH")!;
    expect(JSON.parse(String(patch[1]!.body))).toMatchObject({ customerId: "p1", price: 1200, expectedVersion: 1 });
    expect((screen.getByRole("button", { name: "Gerar documento" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("mantém o rascunho e mostra os campos quando a API recusa a geração", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/documents") && init?.method === "POST") {
        return Response.json({ message: "Preencha os campos destacados antes de gerar o documento.", code: "CONTRACT_INCOMPLETE", missingFields: missingPrice }, { status: 422 });
      }
      if (url.endsWith("/contracts/c1")) return Response.json(detail());
      if (url.includes("/contract-templates")) return Response.json([template]);
      return Response.json([]);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(ContratoPage));
    fireEvent.click(await screen.findByRole("button", { name: "Gerar documento" }));
    await waitFor(() => expect(screen.getAllByRole("alert").map((a) => a.textContent).join(" ")).toContain("Preencha os campos destacados"));
    expect(screen.getByText("Valor total")).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
    expect((screen.getByLabelText(/^Título/) as HTMLInputElement).value).toBe("Assessoria anual");
  });

  it("exige evidência para registrar a assinatura e envia multipart", async () => {
    const sent = detail({ sentOn: "2026-10-14", documents: [{ version: 1, dataRevision: 1, templateId: "t1", templateVersion: 1, contentSha256: "a".repeat(64), author: "Gestor", createdAt: "2026-10-14T12:00:00Z" }] },
      { status: "SENT", latestDocumentVersion: 1, documentCurrent: true, rowVersion: 3 });
    const signed = detail({ signedOn: "2026-10-14", attachments: [{ id: "e1", kind: "SIGNED_EVIDENCE", documentVersion: 1, description: null, filename: "assinado.pdf", contentType: "application/pdf", byteSize: 4, author: "Gestor", createdAt: "2026-10-14T12:00:00Z" }] },
      { status: "SIGNED", latestDocumentVersion: 1, documentCurrent: true, rowVersion: 4 });
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/sign")) return Response.json(signed);
      if (url.endsWith("/contracts/c1")) return Response.json(sent);
      if (url.includes("/contract-templates")) return Response.json([template]);
      return Response.json([]);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(ContratoPage));
    const register = await screen.findByRole("button", { name: "Registrar assinatura" });
    expect((register as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/Não há assinatura eletrônica integrada/)).toBeTruthy();
    expect(screen.queryByText("Dados do rascunho")).toBeNull();

    fireEvent.change(screen.getByLabelText(/Evidência/), { target: { files: [new File(["%PDF"], "assinado.pdf", { type: "application/pdf" })] } });
    fireEvent.click(register);
    await screen.findByText("Assinatura registrada com a evidência anexada.");
    const sign = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/sign"))!;
    const form = sign[1]!.body as FormData;
    expect(form.get("expectedVersion")).toBe("3");
    expect(screen.getByText("Evidência de assinatura")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Registrar assinatura" })).toBeNull();
  });

  it("vendedor não vê financeiro nem cancela contrato enviado", async () => {
    accountKind = "SALES_AGENT";
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/contracts/c1")) return Response.json(detail({ receivables: null, sentOn: "2026-10-14" }, { status: "SENT", latestDocumentVersion: 1, documentCurrent: true }));
      if (url.includes("/contract-templates")) return Response.json([template]);
      throw new Error(`unexpected ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(ContratoPage));
    await screen.findByText(/Somente o gestor cancela/);
    expect(screen.queryByRole("button", { name: "Cancelar contrato" })).toBeNull();
    expect(screen.queryByText("Recebíveis vinculados")).toBeNull();
    expect(calls(fetchMock).some((c) => c.includes("/sales/receivables"))).toBe(false);
  });

  it("vincula recebível existente sem criar lançamentos", async () => {
    const receivable = { id: "r1", saleId: "s1", customerId: "p1", dueDate: "2026-11-10", amount: 300, status: "PENDING", installmentNumber: 1, installmentsTotal: 2, itemTag: null };
    const linked = detail({ receivables: [{ receivableId: "r1", saleId: "s1", installmentNumber: 1, amount: 300, dueDate: "2026-11-10", status: "PENDING", author: "Gestor", linkedAt: "2026-10-14T12:00:00Z" }] });
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/receivables/r1") && init?.method === "PUT") return Response.json(linked);
      if (url.endsWith("/contracts/c1")) return Response.json(detail());
      if (url.includes("/contract-templates")) return Response.json([template]);
      if (url.includes("/sales/receivables?customerId=p1")) return Response.json([receivable]);
      throw new Error(`unexpected ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(ContratoPage));
    await screen.findByText(/Parcela 1\/2/);
    fireEvent.change(screen.getByLabelText("Recebível existente da pessoa"), { target: { value: "r1" } });
    fireEvent.click(screen.getByRole("button", { name: "Vincular" }));
    await screen.findByText(/Nenhum lançamento financeiro foi criado/);
    expect(calls(fetchMock).filter((c) => !c.startsWith("GET"))).toEqual(["PUT /contracts/c1/receivables/r1"]);
  });
});
