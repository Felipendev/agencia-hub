export type Product = "TRAVEL" | "MILES";
export type Channel = "CONVERSATION" | "WHATSAPP" | "SOCIAL_MEDIA" | "EVENT" | "OTHER";
export type Status = "RECEIVED" | "CONTACTED" | "CONVERTED" | "NOT_CONVERTED" | "CANCELLED";

export type Referral = {
  id: string; product: Product; status: Status; statusReason: string | null;
  referrerId: string; referrerName: string;
  referredCustomerId: string | null; referredCustomerName: string | null;
  referredName: string | null; referredPhone: string | null; referredEmail: string | null;
  referredOn: string; channel: Channel; channelDetail: string | null;
  responsibleId: string | null; responsibleName: string | null; notes: string | null;
  convertedOn: string | null; saleId: string | null; everConverted: boolean;
  version: number; createdAt: string; updatedAt: string;
};

/** Aviso sem bloqueio: contato digitado coincide com pessoa do CRM ou outra indicação ativa do produto. */
export type Warning = { kind: "CUSTOMER" | "REFERRAL"; id: string; label: string };

export type ReferralEvent = { id: string; action: string; detail: Record<string, unknown> | null; author: string; createdAt: string };

export type Detail = { referral: Referral; warnings: Warning[]; history: ReferralEvent[] };

export type Summary = { counts: Record<Status, number>; topReferrers: { customerId: string; name: string; total: number; converted: number }[] };

export type Member = { id: string; name: string };

export type ReferralInput = {
  product: Product; referrerId: string; referredCustomerId: string | null; referredName: string | null; referredPhone: string | null;
  referredEmail: string | null; referredOn: string; channel: Channel; channelDetail: string | null; responsibleId: string | null;
  notes: string | null; expectedVersion?: number;
};

export type Filters = { product?: Product; status?: Status; customerId?: string; from?: string; to?: string; q?: string };
