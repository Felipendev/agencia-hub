import { describe, expect, it } from "vitest";
import {
  brPhoneDigits,
  formatBrPhoneDisplay,
  isValidBrazilianPhone,
} from "./br-phone";

describe("brPhoneDigits", () => {
  it("strips non-digits and caps length", () => {
    expect(brPhoneDigits("(31) 98261-5986")).toBe("31982615986");
    expect(brPhoneDigits("abc")).toBe("");
  });
});

describe("formatBrPhoneDisplay", () => {
  it("formats 11-digit mobile", () => {
    expect(formatBrPhoneDisplay("31982615986")).toBe("(31) 98261-5986");
  });

  it("formats partial input progressively", () => {
    expect(formatBrPhoneDisplay("31")).toBe("(31");
    expect(formatBrPhoneDisplay("3198")).toBe("(31) 98");
  });
});

describe("isValidBrazilianPhone", () => {
  it("accepts valid mobile with 9", () => {
    expect(isValidBrazilianPhone("31982615986")).toBe(true);
  });

  it("rejects wrong length or invalid DDD", () => {
    expect(isValidBrazilianPhone("31876543210")).toBe(false);
    expect(isValidBrazilianPhone("1098765432")).toBe(false);
  });
});
