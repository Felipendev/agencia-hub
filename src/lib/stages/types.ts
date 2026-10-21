export type StageKind = "HOTEL" | "TRANSFER" | "ACTIVITY" | "OTHER";
export type StageStatus = "PLANNED" | "CONFIRMED" | "CANCELLED";

export type TripRef = {
  id: string; customerId: string; customerName: string; serviceType: string; bookingLocator: string | null; status: string;
  travelStartDate: string | null; travelEndDate: string | null;
};

export type StageLink = { id: string; type: "ATTACHMENT" | "LIBRARY"; targetId: string; title: string | null; detail: string | null; author: string; createdAt: string };

export type Stage = {
  id: string; kind: StageKind; title: string; startsAt: string; endsAt: string | null; timeZone: string;
  provider: string | null; confirmationCode: string | null; location: string | null; origin: string | null; destination: string | null;
  people: number | null; notes: string | null; status: StageStatus; statusReason: string | null; version: number;
  links: StageLink[]; warnings: string[]; updatedAt: string;
};

export type StageEvent = { id: string; stageId: string; action: string; detail: Record<string, unknown> | null; author: string; createdAt: string };

export type Itinerary = { trip: TripRef; stages: Stage[]; history: StageEvent[] };
export type StageDetail = { trip: TripRef; stage: Stage; history: StageEvent[] };

export type StageInput = {
  kind: StageKind; title: string; startsAt: string; endsAt: string | null; timeZone: string; provider: string | null;
  confirmationCode: string | null; location: string | null; origin: string | null; destination: string | null;
  people: number | null; notes: string | null; expectedVersion?: number;
};

export type TripAttachment = { id: string; filename: string; contentType: string; size: number; description: string };
export type LibraryResource = { id: string; title: string; category: string; kind: string };
