import { describe, expect, it } from "vitest";
import { applySelectionAfterDash, lastSegmentAfterDash } from "./airport-autocomplete";

describe("lastSegmentAfterDash", () => {
  it("returns the whole value when there is no dash yet", () => {
    expect(lastSegmentAfterDash("Sao Paulo")).toBe("Sao Paulo");
  });

  it("returns only the text after the last dash", () => {
    expect(lastSegmentAfterDash("São Paulo (GRU) — Po")).toBe("Po");
  });

  it("trims the extracted segment", () => {
    expect(lastSegmentAfterDash("São Paulo —   Po")).toBe("Po");
  });
});

describe("applySelectionAfterDash", () => {
  const suggestion = { iata: "BPS", city: "Porto Seguro", name: "Porto Seguro Airport", country: "Brazil", label: "Porto Seguro (BPS)" };

  it("appends a trailing dash when nothing was typed yet", () => {
    expect(applySelectionAfterDash("", suggestion)).toBe("Porto Seguro (BPS) — ");
  });

  it("keeps the origin side and replaces only the destination side", () => {
    expect(applySelectionAfterDash("São Paulo (GRU) — Po", suggestion)).toBe("São Paulo (GRU) — Porto Seguro (BPS)");
  });

  it("does not duplicate spacing around the dash", () => {
    expect(applySelectionAfterDash("São Paulo (GRU) —   ", suggestion)).toBe("São Paulo (GRU) — Porto Seguro (BPS)");
  });
});
