import { expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

it("protege listagem, cadastro e detalhe de indicações e permite sessão existente",()=>{
  for(const path of ["/indicacoes","/indicacoes/nova","/indicacoes/referral"]){
    const response=middleware(new NextRequest(`https://app.example${path}`));
    const location=new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");expect(location.searchParams.get("from")).toBe(path);
    const allowed=middleware(new NextRequest(`https://app.example${path}`,{headers:{cookie:"ah_auth=1"}}));
    expect(allowed.headers.get("location")).toBeNull();
  }
});

it("protege a agenda, o cadastro e os detalhes sem sessão", () => {
  for (const path of ["/agenda", "/agenda/novo", "/agenda/appointment"]) {
    const response = middleware(new NextRequest(`https://app.example${path}`));
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("from")).toBe(path);
  }
});

it("a área de milhas exige login inclusive nas rotas de carteira e simulador",()=>{
  for(const path of ["/milhas","/milhas/clientes/person","/milhas/simulador","/contratos","/contratos/modelos","/contratos/novo","/contratos/contract","/economia","/economia/relatorios","/economia/viagens/trip"]){
    const response=middleware(new NextRequest(`https://app.example${path}`));
    const location=new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");expect(location.searchParams.get("from")).toBe(path);
  }
});
it("uma sessão presente pode entrar na área de milhas sem trocar de identidade",()=>{
  const response=middleware(new NextRequest("https://app.example/milhas/clientes/person",{headers:{cookie:"ah_auth=1"}}));
  expect(response.headers.get("location")).toBeNull();expect(response.headers.get("x-middleware-next")).toBe("1");
});
