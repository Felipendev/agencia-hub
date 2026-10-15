import { expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

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
