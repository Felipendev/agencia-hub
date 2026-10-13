// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PhoneInput } from "./phone-input";
afterEach(cleanup);
function Form() {
  const [phone,setPhone]=React.useState("+5511987654321");
  return React.createElement(React.Fragment,null,React.createElement(PhoneInput,{id:"phone",value:phone,onChange:setPhone}),React.createElement("output",null,phone));
}
describe("prefixo editável",()=>{
  it("preserva número nacional enquanto o DDI é digitado",()=>{
    render(React.createElement(Form));
    const country=screen.getByLabelText("Código do país — phone");
    fireEvent.change(country,{target:{value:"3"}});
    fireEvent.change(country,{target:{value:"35"}});
    fireEvent.change(country,{target:{value:"351"}});
    expect(screen.getByRole("status").textContent).toBe("+35111987654321");
    const number=document.querySelector('input[type="tel"]')!;
    fireEvent.change(number,{target:{value:"912345678"}});
    expect(screen.getByRole("status").textContent).toBe("+351912345678");
    fireEvent.change(number,{target:{value:"+12025550123"}});
    expect((country as HTMLInputElement).value).toBe("1");
    expect(screen.getByRole("status").textContent).toBe("+12025550123");
  });
});
