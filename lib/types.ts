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
  lat: number;
  lng: number;
  notes: string | null;
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
