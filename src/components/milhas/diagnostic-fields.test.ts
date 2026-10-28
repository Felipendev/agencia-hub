// @vitest-environment jsdom
import {createElement,useState} from "react";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {afterEach,expect,it} from "vitest";
import {DiagnosticFields,DiagnosticRead} from "./diagnostic-fields";
import {emptyDiagnostic} from "@/lib/miles-diagnostics";
afterEach(cleanup);
function Harness(){const [value,setValue]=useState(emptyDiagnostic);return createElement("div",null,createElement(DiagnosticFields,{value,onChange:setValue,internal:true}),createElement("output",null,JSON.stringify(value)));}
it("edita perfil, vários tipos e valores opcionais sem converter vazio em zero",()=>{
 render(createElement(Harness));fireEvent.change(screen.getByLabelText("Objetivos"),{target:{value:"Meta"}});fireEvent.change(screen.getByLabelText("Plano de ações da agência"),{target:{value:"Revisão"}});fireEvent.click(screen.getByRole("button",{name:"Adicionar conta"}));fireEvent.change(screen.getByLabelText("Programa · registro 1"),{target:{value:"Programa teste"}});fireEvent.change(screen.getByLabelText("Saldo inicial declarado · registro 1"),{target:{value:"1000"}});fireEvent.click(screen.getByRole("button",{name:"Adicionar cartão"}));fireEvent.change(screen.getByLabelText("Pontos por dólar · registro 2"),{target:{value:"2.5"}});fireEvent.change(screen.getByLabelText("Pontos por dólar · registro 2"),{target:{value:""}});fireEvent.click(screen.getByRole("button",{name:"Adicionar clube"}));expect(screen.getByRole("status").textContent).toContain('"pointsPerDollar":null');expect(screen.getByRole("status").textContent).toContain('"openingBalance":1000');fireEvent.click(screen.getByRole("button",{name:"Remover registro 2"}));expect(screen.queryByText("Cartões · registro 2")).toBeNull();expect(screen.getByText("Clubes · registro 2")).toBeTruthy();
});
it("leitura apresenta campos ausentes e registros sem expor objeto técnico",()=>{
 render(createElement(DiagnosticRead,{data:{...emptyDiagnostic(),phone:"+351123",name:"Pessoa",items:[{kind:"CARD",data:{issuer:"Banco"}}]}}));expect(screen.getByText(/\+351123/)).toBeTruthy();expect(screen.getAllByText("Não informado").length).toBeGreaterThan(1);expect(screen.getByText("Banco")).toBeTruthy();
});
