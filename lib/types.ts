// Storefront-facing shapes. These mirror the data model in CLAUDE.md so that
// swapping lib/mock-data.ts for real Prisma queries doesn't touch components.
// Dates are ISO strings (UTC) because these objects cross the server → client
// boundary as props.

export type Truck = {
  id: string;
  slug: string;
  name: string;
  timezone: string; // IANA, e.g. "America/Chicago"
  tagline: string;
  branding: {
    color: string; // brand background, e.g. "#22603F"
    colorForeground: string; // text on the brand color
  };
  taxRateBps: number;
};

export type Location = {
  id: string;
  name: string;
  addressLine: string;
  city: string;
  region: string; // state/province; "" when unknown
  postcode: string;
  lat: number | null; // null when the vendor saved the spot without coordinates
  lng: number | null;
  notes: string | null; // parking note
  provider: string; // "geoapify" | "photon" | "manual"
  providerPlaceId: string | null;
  archivedAt: string | null;
};

export type ServiceStatus = "DRAFT" | "PUBLISHED" | "LIVE" | "ENDED" | "CANCELLED";

export type Service = {
  id: string;
  locationId: string;
  menuId: string;
  startsAt: string;
  endsAt: string;
  orderingOpensAt: string;
  orderingClosesAt: string;
  slotMinutes: number;
  ordersPerSlot: number;
  status: ServiceStatus;
  publicNote: string; // one-off note for this stop only; "" when none
};

export type PickupSlot = {
  id: string;
  serviceId: string;
  startsAt: string;
  capacity: number;
  bookedCount: number;
};

export type ModifierOption = {
  id: string;
  name: string;
  priceDeltaCents: number;
  isAvailable: boolean;
};

export type ModifierGroup = {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  required: boolean;
  options: ModifierOption[];
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  isAvailable: boolean;
  modifierGroups: ModifierGroup[];
};

export type MenuSection = {
  id: string;
  name: string;
  items: MenuItem[];
};

export type Menu = {
  id: string;
  name: string;
  sections: MenuSection[];
};

// ─── Orders ────────────────────────────────────────────────────────────────

/** How a counter sale was paid. A web order has none: Stripe handled it. */
export type TenderType = "CASH" | "CARD" | "OTHER";

/** Where an order came from. */
export type OrderSource = "WEB" | "SMS" | "API" | "COUNTER";

/** The three things between a new truck and its first order. */
export type SetupProgress = { hasMenu: boolean; hasStop: boolean; hasOrder: boolean };

/** The day so far, in the truck's own timezone. Counts web orders and counter sales alike. */
export type TodaysNumbers = {
  orderCount: number;
  netCents: number; // taken, less anything voided back
  counterCents: number;
  onlineCents: number;
  cashCents: number;
  topItems: { name: string; quantity: number }[];
  busiestSlot: { startsAt: Date; count: number } | null;
};

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "PICKED_UP"
  | "CANCELLED"
  | "REFUNDED";

/** An order as a customer or vendor sees it. Lines are the price snapshots taken at checkout. */
export type OrderLine = {
  id: string;
  name: string;
  quantity: number;
  modifiers: string[]; // names only; the snapshot's price deltas stay server-side
  unitPriceCents: number;
  lineTotalCents: number;
  voidedAt: string | null;
  voidedReason: string | null;
  voidedCents: number;
};

export type OrderView = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  // Both null for a counter sale: nobody to call, and no pickup time to wait for.
  customerPhone: string | null;
  customerEmail: string | null;
  /** How it arrived: WEB is a preorder, COUNTER a walk-up rung up on the POS. */
  source: OrderSource;
  /** Counter sales only: how it was paid. */
  tender: TenderType | null;
  pickupAt: string | null;
  placedAt: string;
  acceptedAt: string | null;
  readyAt: string | null;
  pickedUpAt: string | null;
  autoCompletedAt: string | null;
  lines: OrderLine[];
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
  refundedCents: number;
};

// ─── Dashboard ─────────────────────────────────────────────────────────────

/** A menu item as the vendor manages it, including archived ones. */
export type ManagedItem = MenuItem & {
  sectionId: string;
  archived: boolean;
};

export type ManagedSection = {
  id: string;
  name: string;
  items: ManagedItem[];
};

// ─── Dashboard settings ────────────────────────────────────────────────────
// Kept apart from `Truck` on purpose: storefront components depend on that
// shape, and these fields are for the vendor only.

export type TruckSettings = {
  name: string;
  slug: string;
  tagline: string;
  logoUrl: string | null;
  customDomain: string | null;
  brandColor: string;
  brandColorForeground: string;
  heroImageUrl: string | null;
  timezone: string;
  taxRateBps: number;
  platformFeeBps: number;
  notificationEmail: string | null;
  notifyNewOrder: boolean;
  notifyCancellation: boolean;
  notifyDailySummary: boolean;
  archivedAt: string | null; // set = the truck is closed: see getTruckFromRequest
  stripeAccountId: string | null;
  stripeOnboarded: boolean;
};

export type OrderingDefaults = {
  timezone: string;
  defaultSlotMinutes: number;
  defaultOrdersPerSlot: number;
  orderingOpensHoursBefore: number;
  orderingClosesMinutesBefore: number;
  slotLeadMinutes: number;
};

/** Which Stripe keys the server is running on. See lib/stripe.ts. */
export type PaymentsMode = "off" | "test" | "live";

export type TeamMember = {
  id: string;
  clerkUserId: string;
  email: string | null; // captured when they join; older members have none
  role: "OWNER" | "STAFF";
  joinedAt: string;
};

/** A team invite still waiting on its person. */
export type PendingInvite = {
  id: string;
  email: string;
  role: "OWNER" | "STAFF";
  expiresAt: string;
  expired: boolean;
  token: string; // owner-only page: lets the owner copy the link when email can't be sent
};

// ─── Dashboard schedule ────────────────────────────────────────────────────

/** A stop on the vendor's schedule, with how many live orders hang off it. */
export type ScheduleRow = { service: Service; location: Location; orderCount: number };

/** A standing commitment that generates stops: see lib/schedule/rules.ts. */
export type ScheduleRule = {
  id: string;
  locationId: string;
  weekdays: number[]; // 0 = Sunday … 6 = Saturday
  startTime: string; // "HH:mm" in the truck's timezone
  endTime: string;
  opensHoursBefore: number;
  closesMinutesBefore: number;
  slotMinutes: number;
  ordersPerSlot: number;
  publicNote: string;
  active: boolean;
};

export type ScheduleRuleRow = { rule: ScheduleRule; location: Location };

/** The repeating-stop form's values. Same vocabulary as StopDraft, minus the date. */
export type ScheduleRuleInput = Omit<ScheduleRule, "id">;

export type RuleDraft = Omit<ScheduleRule, "id" | "active"> & {
  ruleId?: string; // present = editing that rule
  locationId: string;
};

/** The stop form's values, in the wall-clock terms its inputs speak (the truck's timezone). */
export type StopDraft = {
  serviceId?: string; // present = editing that stop
  locationId: string | null;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;
  opensHoursBefore: number; // 0 = as soon as the stop is published
  closesMinutesBefore: number;
  slotMinutes: number;
  ordersPerSlot: number;
  publicNote: string;
};
