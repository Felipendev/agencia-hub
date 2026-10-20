// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CustomerSimulations } from "./CustomerSimulations";
const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ token: "test" }),
}));
vi.mock("@/lib/api/authenticated-fetch", () => ({ apiFetch: request }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("consulta os mesmos planos por customerId sem criar perfil ou conta", async () => {
  request.mockResolvedValue([
    {
      id: "plan",
      assumptions: { title: "Plano Lisboa", destination: "Lisboa", months: 12 },
      version: 2,
    },
  ]);
  render(React.createElement(CustomerSimulations, { customerId: "person-a" }));
  await screen.findByText("Plano Lisboa");
  expect(request).toHaveBeenCalledTimes(1);
  expect(request.mock.calls[0][0]).toBe(
    "/accumulation-simulations?customerId=person-a",
  );
  expect(
    screen
      .getByRole("link", { name: "Consultar ou editar plano" })
      .getAttribute("href"),
  ).toBe("/milhas/simulador?customerId=person-a&simulationId=plan");
  expect(
    screen
      .getByRole("link", { name: "Novo plano para esta pessoa" })
      .getAttribute("href"),
  ).toBe("/milhas/simulador?customerId=person-a");
});
it("distingue ausência de planos de falha na consulta e oferece recarga", async () => {
  request
    .mockRejectedValueOnce(new Error("Serviço indisponível"))
    .mockResolvedValueOnce([]);
  render(React.createElement(CustomerSimulations, { customerId: "person-a" }));
  await screen.findByText("Serviço indisponível");
  expect(
    screen.queryByText("Nenhum plano vinculado a esta pessoa."),
  ).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Tentar carregar planos" }),
  );
  await screen.findByText("Nenhum plano vinculado a esta pessoa.");
});
