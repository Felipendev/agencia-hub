/** Conversões de fuso sem bibliotecas: data/hora locais de um fuso IANA ⇄ instante ISO com offset. */

export const AGENCY_ZONE = "America/Fortaleza";

export const ZONES: { id: string; label: string }[] = [
  { id: "America/Fortaleza", label: "Fortaleza (padrão da agência)" },
  { id: "America/Sao_Paulo", label: "Brasília/São Paulo" },
  { id: "America/Manaus", label: "Manaus" },
  { id: "America/Rio_Branco", label: "Rio Branco" },
  { id: "America/Noronha", label: "Fernando de Noronha" },
  { id: "Europe/Lisbon", label: "Lisboa" },
  { id: "America/New_York", label: "Nova York" },
  { id: "UTC", label: "UTC" },
];

function parts(instant: Date, zone: string) {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  const map = Object.fromEntries(fmt.formatToParts(instant).map((p) => [p.type, p.value]));
  return { year: +map.year, month: +map.month, day: +map.day, hour: +map.hour, minute: +map.minute, second: +map.second };
}

/** Offset do fuso no instante, em minutos (ex.: Fortaleza = −180). */
export function offsetMinutes(instant: Date, zone: string): number {
  const p = parts(instant, zone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60000);
}

function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

/** "2026-10-21" + "14:00" em Fortaleza → "2026-10-21T14:00:00-03:00". */
export function toZonedIso(date: string, time: string, zone: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  if (!y || !m || !d || Number.isNaN(h) || Number.isNaN(min)) throw new Error("Informe data e horário válidos.");
  const naive = Date.UTC(y, m - 1, d, h, min);
  // Duas iterações resolvem a mudança de offset (horário de verão) perto do instante.
  let offset = offsetMinutes(new Date(naive), zone);
  offset = offsetMinutes(new Date(naive - offset * 60000), zone);
  const iso = `${date}T${time.slice(0, 5)}:00${formatOffset(offset)}`;
  const roundTrip = fromIso(iso, zone);
  if (roundTrip.date !== date || roundTrip.time !== time.slice(0, 5)) {
    throw new Error("Este horário não existe no fuso escolhido. Revise a data e o horário, inclusive mudanças de horário de verão.");
  }
  return iso;
}

/** Instante ISO → data e hora no fuso indicado. */
export function fromIso(iso: string, zone: string): { date: string; time: string } {
  const p = parts(new Date(iso), zone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return { date: `${p.year}-${pad(p.month)}-${pad(p.day)}`, time: `${pad(p.hour)}:${pad(p.minute)}` };
}

export function formatInZone(iso: string, zone: string, withDate = true): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: zone,
    ...(withDate ? { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" } : {}),
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function todayIn(zone = AGENCY_ZONE, now = new Date()): string {
  return fromIso(now.toISOString(), zone).date;
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
