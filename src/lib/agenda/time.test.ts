import { describe, expect, it } from "vitest";
import { addDays, fromIso, offsetMinutes, toZonedIso, todayIn } from "./time";

describe("fuso da agenda", () => {
  it("converte data/hora local em ISO com o offset do fuso", () => {
    expect(toZonedIso("2026-10-21", "14:00", "America/Fortaleza")).toBe("2026-10-21T14:00:00-03:00");
    expect(toZonedIso("2026-07-01", "09:30", "Europe/Lisbon")).toBe("2026-07-01T09:30:00+01:00");
    expect(toZonedIso("2026-01-15", "09:30", "Europe/Lisbon")).toBe("2026-01-15T09:30:00+00:00");
    expect(toZonedIso("2026-01-15", "09:30", "America/New_York")).toBe("2026-01-15T09:30:00-05:00");
  });

  it("ida e volta preservam data e hora no fuso do compromisso", () => {
    const iso = toZonedIso("2026-11-01", "23:30", "America/Fortaleza");
    expect(new Date(iso).toISOString()).toBe("2026-11-02T02:30:00.000Z");
    expect(fromIso("2026-11-02T02:30:00Z", "America/Fortaleza")).toEqual({ date: "2026-11-01", time: "23:30" });
    expect(fromIso("2026-11-02T02:30:00Z", "UTC")).toEqual({ date: "2026-11-02", time: "02:30" });
  });

  it("calcula hoje no fuso da agência e soma dias sem deslocar", () => {
    expect(todayIn("America/Fortaleza", new Date("2026-03-10T02:00:00Z"))).toBe("2026-03-09");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(offsetMinutes(new Date("2026-10-21T12:00:00Z"), "America/Fortaleza")).toBe(-180);
  });

  it("recusa data ou hora inválidas", () => {
    expect(() => toZonedIso("", "10:00", "UTC")).toThrow();
    expect(() => toZonedIso("2026-02-30", "10:00", "UTC")).toThrow();
    expect(() => toZonedIso("2026-03-08", "02:30", "America/New_York")).toThrow(/não existe/);
  });
});
