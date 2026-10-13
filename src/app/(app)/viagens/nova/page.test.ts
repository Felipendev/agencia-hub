// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import NovaViagemPage from "./page";
const mocks=vi.hoisted(()=>({push:vi.fn(),query:"clienteId=customer&cotacaoId=quote",customers:[],quotes:[]}));
vi.mock("next/navigation",()=>({useRouter:()=>({push:mocks.push}),useSearchParams:()=>new URLSearchParams(mocks.query)}));
vi.mock("@/contexts/auth-context",()=>({useAuth:()=>({token:"test-token"})}));
vi.mock("@/contexts/data-context",()=>({useData:()=>({clientes:mocks.customers,cotacoes:mocks.quotes})}));
vi.mock("@/components/cliente/ClientePicker",()=>({ClientePicker:()=>null}));
vi.mock("@/components/cliente/NovoClienteModal",()=>({NovoClienteModal:()=>null}));
afterEach(()=>{cleanup();vi.clearAllMocks();vi.unstubAllGlobals();vi.unstubAllEnvs();});
it("reutiliza a viagem ao abrir um link antigo de conversão",async()=>{
  mocks.query="clienteId=customer&cotacaoId=quote"; vi.stubEnv("NEXT_PUBLIC_AGENCIA_HUB_API_URL","https://api.example");
  const fetchMock=vi.fn((url:string)=>Promise.resolve(Response.json(url.endsWith("supplier-options")?[]:[{id:"existing",serviceType:"FLIGHT"}]))); vi.stubGlobal("fetch",fetchMock);
  render(React.createElement(NovaViagemPage)); fireEvent.click(screen.getByRole("button",{name:"Registrar viagem"}));
  await waitFor(()=>expect(mocks.push).toHaveBeenCalledWith("/viagens/existing"));
  expect(fetchMock.mock.calls.some(call=>call[0]==="https://api.example/trips")).toBe(false);
});
it("envia uma chave de repetição e bloqueia dois submits simultâneos",async()=>{
  mocks.query="clienteId=customer"; vi.stubEnv("NEXT_PUBLIC_AGENCIA_HUB_API_URL","https://api.example");
  let complete!:(r:Response)=>void;const pending=new Promise<Response>(resolve=>{complete=resolve;});
  const fetchMock=vi.fn((url:string)=>url.endsWith("supplier-options")?Promise.resolve(Response.json([])):pending);vi.stubGlobal("fetch",fetchMock);
  render(React.createElement(NovaViagemPage));const form=screen.getByRole("button",{name:"Registrar viagem"}).closest("form")!;
  fireEvent.submit(form);fireEvent.submit(form);
  const calls=fetchMock.mock.calls as unknown as [string,RequestInit][];const posts=calls.filter(([,init])=>init?.method==="POST");expect(posts.length).toBe(1);
  expect((posts[0][1].headers as Record<string,string>)["Idempotency-Key"]).toBeTruthy();
  await act(async()=>{complete(Response.json({trip:{id:"created"}}));await pending;});
  expect(mocks.push).toHaveBeenCalledWith("/viagens/created");
});
