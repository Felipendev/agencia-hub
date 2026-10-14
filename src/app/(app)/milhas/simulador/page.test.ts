// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import SimuladorAcumuloPage from "./page";
import { calculateAccumulation, type AccumulationAssumptions } from "@/lib/accumulation-simulation";
vi.mock("@/contexts/auth-context",()=>({useAuth:()=>({token:"test-token"})}));
vi.mock("@/lib/api/agencia-hub-env",()=>({getAgenciaHubApiBaseUrl:()=>"https://api.example"}));
const assumptions:AccumulationAssumptions={title:"Plano Lisboa",monthlySpending:10000,pointsPerDollar:2,exchangeRate:5,exchangeDate:"2026-01-01",months:12,passengers:2,milesPerPassenger:40000,destination:"Lisboa",scenarios:[{program:"Smiles",bonusPercent:100}]};
const row={id:"scenario",assumptions,result:calculateAccumulation(assumptions)!,createdAt:"2026-01-01T12:00:00Z",updatedAt:"2026-01-01T12:00:00Z",version:1};
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
it("edita o cenário pelo mesmo ID e envia a versão consultada",async()=>{
  const changed={...assumptions,title:"Plano atualizado"};
  const fetchMock=vi.fn().mockResolvedValueOnce(Response.json([row])).mockResolvedValueOnce(Response.json(row)).mockResolvedValueOnce(Response.json({...row,assumptions:changed,version:2}));
  vi.stubGlobal("fetch",fetchMock);vi.spyOn(window,"scrollTo").mockImplementation(()=>{});
  render(React.createElement(SimuladorAcumuloPage));await screen.findByRole("heading",{name:"Plano Lisboa"});
  fireEvent.click(screen.getByRole("button",{name:"Editar"}));await screen.findByDisplayValue("Plano Lisboa");
  fireEvent.change(screen.getByLabelText("Nome da simulação"),{target:{value:"Plano atualizado"}});
  fireEvent.click(screen.getByRole("button",{name:"Salvar alterações"}));await screen.findByText("Alterações salvas. A versão anterior permanece no histórico.");
  expect(fetchMock.mock.calls[2][0]).toBe("https://api.example/accumulation-simulations/scenario");
  expect(fetchMock.mock.calls[2][1].method).toBe("PATCH");
  expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toMatchObject({expectedVersion:1,assumptions:{title:"Plano atualizado"}});
  expect(screen.getAllByRole("heading",{name:"Plano atualizado"}).length).toBe(1);
});
it("duplicar cria um novo registro sem editar o original",async()=>{
  const copy={...assumptions,title:"Plano Lisboa (cópia)"};
  const fetchMock=vi.fn().mockResolvedValueOnce(Response.json([row])).mockResolvedValueOnce(Response.json({...row,id:"copy",assumptions:copy}));
  vi.stubGlobal("fetch",fetchMock);vi.spyOn(window,"scrollTo").mockImplementation(()=>{});
  render(React.createElement(SimuladorAcumuloPage));await screen.findByRole("heading",{name:"Plano Lisboa"});
  fireEvent.click(screen.getByRole("button",{name:"Duplicar"}));expect(screen.getByLabelText("Nome da simulação").getAttribute("value")).toBe(copy.title);
  fireEvent.click(screen.getByRole("button",{name:"Criar simulação"}));await screen.findByText("Simulação criada para consulta pela equipe.");
  expect(fetchMock.mock.calls[1][1].method).toBe("POST");expect(screen.getByRole("heading",{name:"Plano Lisboa"})).toBeTruthy();expect(screen.getByRole("heading",{name:copy.title})).toBeTruthy();
});
it("mantém a edição aberta quando outra pessoa atualizou o cenário",async()=>{
  const fetchMock=vi.fn().mockResolvedValueOnce(Response.json([row])).mockResolvedValueOnce(Response.json(row)).mockResolvedValueOnce(Response.json({message:"Recarregue o cenário"},{status:409}));
  vi.stubGlobal("fetch",fetchMock);vi.spyOn(window,"scrollTo").mockImplementation(()=>{});
  render(React.createElement(SimuladorAcumuloPage));await screen.findByRole("heading",{name:"Plano Lisboa"});
  fireEvent.click(screen.getByRole("button",{name:"Editar"}));await screen.findByDisplayValue("Plano Lisboa");
  fireEvent.change(screen.getByLabelText("Nome da simulação"),{target:{value:"Meu rascunho"}});fireEvent.click(screen.getByRole("button",{name:"Salvar alterações"}));
  await waitFor(()=>expect(screen.getByRole("alert").textContent).toBe("Recarregue o cenário"));
  expect(screen.getByDisplayValue("Meu rascunho")).toBeTruthy();expect(screen.queryByText("Alterações salvas. A versão anterior permanece no histórico.")).toBeNull();
});
