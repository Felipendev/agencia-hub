/** Contrato JSON do módulo F07 (`/appointments`). */

export type Product = "TRAVEL" | "MILES";
export type Format = "IN_PERSON" | "VIDEO" | "PHONE" | "OTHER";
export type Status = "SCHEDULED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";

export type Member = { id: string; name: string };

export type Appointment = {
  id: string;
  product: Product;
  customerId: string;
  customerName: string;
  tripId: string | null;
  title: string;
  purpose: string | null;
  /** Instante em UTC (ISO-8601). */
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  /** Fuso IANA em que o compromisso foi marcado; usado na exibição. */
  timeZone: string;
  format: Format;
  location: string | null;
  meetingUrl: string | null;
  responsibleId: string;
  responsibleName: string;
  status: Status;
  statusReason: string | null;
  statusChangedAt: string | null;
  version: number;
  minutesVersion: number | null;
  createdAt: string;
  updatedAt: string;
};

export type NextStep = { description: string; owner: string | null; dueOn: string | null };
export type Minutes = { participants: string | null; summary: string | null; decisions: string[]; nextSteps: NextStep[] };

export type Event = { id: string; action: string; detail: Record<string, unknown> | null; author: string; createdAt: string };

export type Detail = {
  appointment: Appointment;
  minutes: { data: Minutes; version: number; updatedAt: string } | null;
  minutesVersions: { version: number; author: string; createdAt: string }[];
  overlaps: { id: string; title: string; startsAt: string; durationMinutes: number }[];
  history: Event[];
};

export type AppointmentInput = {
  customerId: string;
  product: Product;
  tripId: string | null;
  title: string;
  purpose: string | null;
  startsAt: string;
  durationMinutes: number;
  timeZone: string;
  format: Format;
  location: string | null;
  meetingUrl: string | null;
  responsibleId: string;
  expectedVersion?: number;
};

export type Filters = { customerId?: string; product?: Product; status?: Status; responsibleId?: string; from?: string; to?: string; q?: string };
