import { describe, expect, it } from "vitest";
import { centsToDisplay, formatCurrencyInput, parseCurrencyInput } from "./currency-input";

describe("formatCurrencyInput", () => {
  it("treats typed digits as cents", () => {
    expect(formatCurrencyInput("2500")).toBe("25,00");
    expect(formatCurrencyInput("150000")).toBe("1.500,00");
  });

  it("strips non-digits before formatting", () => {
    expect(formatCurrencyInput("R$ 1.234,56")).toBe("1.234,56");
  });

  it("handles empty input", () => {
    expect(formatCurrencyInput("")).toBe("0,00");
  });
});

describe("parseCurrencyInput", () => {
  it("round-trips a value with a thousands separator correctly", () => {
    // This is the bug this module exists to prevent: naive `parseFloat(str.replace(",", "."))`
    // on "1.500,00" reads the thousands dot as a decimal point and yields 1.5, not 1500.
    expect(parseCurrencyInput(formatCurrencyInput("150000"))).toBe(1500);
    expect(parseCurrencyInput("1.234,56")).toBe(1234.56);
  });

  it("handles values with no thousands separator", () => {
    expect(parseCurrencyInput("25,00")).toBe(25);
  });

  it("returns 0 for empty/invalid input", () => {
    expect(parseCurrencyInput("")).toBe(0);
  });
});

describe("centsToDisplay", () => {
  it("formats a number coming from the API back into the masked display format", () => {
    expect(centsToDisplay(1500)).toBe("1.500,00");
    expect(centsToDisplay(0)).toBe("0,00");
  });

  it("round-trips with parseCurrencyInput", () => {
    expect(parseCurrencyInput(centsToDisplay(1999.9))).toBe(1999.9);
  });
});
