import { describe, expect, it } from "vitest";
import { normalizePhone, phoneDigits, splitPhone, isValidPhone } from "./international-phone";
import { whatsappLink } from "./whatsapp";

describe("telefones internacionais", () => {
  it("preserva Portugal, EUA e Reino Unido no cadastro e no WhatsApp", () => {
    for (const phone of ["+351912345678", "+12025550123", "+447911123456"]) {
      expect(normalizePhone(phone)).toBe(phone);
      expect(isValidPhone(phone)).toBe(true);
      expect(whatsappLink(phone)).toBe(`https://wa.me/${phone.slice(1)}`);
      expect(whatsappLink(`https://wa.me/${phone.slice(1)}`)).toBe(`https://wa.me/${phone.slice(1)}`);
    }
    expect(splitPhone("+351912345678")).toEqual({ country: "351", national: "912345678" });
    expect(splitPhone("+12025550123")).toEqual({ country: "1", national: "2025550123" });
  });
  it("mantém compatibilidade com clientes brasileiros antigos", () => {
    expect(phoneDigits("(47) 9605-6356")).toBe("554796056356");
    expect(splitPhone("(11) 98765-4321")).toEqual({ country: "55", national: "11987654321" });
    expect(normalizePhone("00351 912 345 678")).toBe("+351912345678");
  });
  it("rejeita números inválidos e links de domínios inesperados", () => {
    for (const phone of ["+0", "+123", "+1234567890123456", "telefone123"]) expect(isValidPhone(phone)).toBe(false);
    expect(whatsappLink("https://evil.example/351912345678")).toBeNull();
  });
});
