// TEMPORARY: in-memory demo data so the storefront UI can be built before the
// database exists. When Stream 0 lands, replace these functions with
// Prisma queries in lib/tenant.ts (getTruckFromRequest etc.) and delete this
// file. Components only depend on the types in lib/types.ts.
//
// Service times are generated relative to "now" so the demo always has a
// live service, whenever you open it.

import type { Location, Menu, MenuItem, ModifierGroup, PickupSlot, Service, Truck } from "@/lib/types";
import { zonedTime } from "@/lib/time";

const TZ = "America/Chicago";

const truck: Truck = {
  id: "truck_demo",
  slug: "demo-truck",
  name: "Comal Taqueria",
  timezone: TZ,
  tagline: "Birria, al pastor, and handmade tortillas off the comal.",
  branding: { color: "#22603F", colorForeground: "#FFFFFF" },
  taxRateBps: 1025, // 10.25%
};

const locations: Location[] = [
  {
    id: "loc_riverside",
    name: "Riverside Brewing Co.",
    addressLine: "412 Mill St",
    city: "Northfield",
    lat: 41.9101,
    lng: -87.6553,
    notes: "Parked on the patio side, by the loading door.",
  },
  {
    id: "loc_halsted",
    name: "Halsted Office Park",
    addressLine: "2200 N Halsted Ave",
    city: "Northfield",
    lat: 41.9222,
    lng: -87.6487,
    notes: "Between buildings B and C.",
  },
  {
    id: "loc_nightmarket",
    name: "Lakeview Night Market",
    addressLine: "3300 N Clark St",
    city: "Lakeview",
    lat: 41.9412,
    lng: -87.6495,
    notes: null,
  },
  {
    id: "loc_farmers",
    name: "Northfield Farmers Market",
    addressLine: "Village Green, 1 Central Ave",
    city: "Northfield",
    lat: 41.9056,
    lng: -87.6612,
    notes: "Stall 14, north row.",
  },
];

// ─── Menu ──────────────────────────────────────────────────────────────────

const tortilla = (itemId: string): ModifierGroup => ({
  id: `${itemId}_tortilla`,
  name: "Tortilla",
  minSelect: 1,
  maxSelect: 1,
  required: true,
  options: [
    { id: `${itemId}_corn`, name: "Corn", priceDeltaCents: 0, isAvailable: true },
    { id: `${itemId}_flour`, name: "Flour", priceDeltaCents: 0, isAvailable: true },
  ],
});

const tacoExtras = (itemId: string): ModifierGroup => ({
  id: `${itemId}_extras`,
  name: "Extras",
  minSelect: 0,
  maxSelect: 3,
  required: false,
  options: [
    { id: `${itemId}_consome`, name: "Cup of consommé", priceDeltaCents: 200, isAvailable: true },
    { id: `${itemId}_queso`, name: "Melted queso", priceDeltaCents: 150, isAvailable: true },
    { id: `${itemId}_onion`, name: "Extra onion & cilantro", priceDeltaCents: 0, isAvailable: true },
  ],
});

const salsa = (itemId: string): ModifierGroup => ({
  id: `${itemId}_salsa`,
  name: "Salsa",
  minSelect: 1,
  maxSelect: 1,
  required: true,
  options: [
    { id: `${itemId}_verde`, name: "Verde", priceDeltaCents: 0, isAvailable: true },
    { id: `${itemId}_roja`, name: "Roja", priceDeltaCents: 0, isAvailable: true },
    { id: `${itemId}_habanero`, name: "Habanero", priceDeltaCents: 0, isAvailable: false },
  ],
});

const item = (p: Partial<MenuItem> & Pick<MenuItem, "id" | "name" | "priceCents">): MenuItem => ({
  description: "",
  isAvailable: true,
  modifierGroups: [],
  ...p,
});

const menu: Menu = {
  id: "menu_default",
  name: "Everyday",
  sections: [
    {
      id: "sec_tacos",
      name: "Tacos",
      items: [
        item({
          id: "birria",
          name: "Birria tacos",
          description: "Three tacos of slow-braised beef, dipped and crisped on the comal. Onion, cilantro, lime.",
          priceCents: 1350,
          modifierGroups: [tortilla("birria"), tacoExtras("birria")],
        }),
        item({
          id: "pastor",
          name: "Al pastor tacos",
          description: "Three tacos of chile-marinated pork shaved off the trompo, with pineapple.",
          priceCents: 1200,
          modifierGroups: [tortilla("pastor"), salsa("pastor")],
        }),
        item({
          id: "carnitas",
          name: "Carnitas tacos",
          description: "Three tacos of confit pork shoulder, pickled red onion, salsa verde.",
          priceCents: 1250,
          isAvailable: false,
          modifierGroups: [tortilla("carnitas")],
        }),
        item({
          id: "hongos",
          name: "Mushroom & poblano tacos",
          description: "Three tacos of charred mushrooms and rajas with crema and cotija. Vegetarian.",
          priceCents: 1150,
          modifierGroups: [tortilla("hongos"), salsa("hongos")],
        }),
      ],
    },
    {
      id: "sec_plates",
      name: "Plates",
      items: [
        item({
          id: "quesabirria",
          name: "Quesabirria plate",
          description: "Two cheese-crusted birria quesadillas, rice, beans, and a cup of consommé for dipping.",
          priceCents: 1550,
        }),
        item({
          id: "bowl",
          name: "Rice bowl",
          description: "Cilantro rice, black beans, pico, crema, and your choice of filling.",
          priceCents: 1250,
          modifierGroups: [
            {
              id: "bowl_protein",
              name: "Filling",
              minSelect: 1,
              maxSelect: 1,
              required: true,
              options: [
                { id: "bowl_birria", name: "Birria", priceDeltaCents: 100, isAvailable: true },
                { id: "bowl_pastor", name: "Al pastor", priceDeltaCents: 0, isAvailable: true },
                { id: "bowl_carnitas", name: "Carnitas", priceDeltaCents: 0, isAvailable: false },
                { id: "bowl_hongos", name: "Mushroom & poblano", priceDeltaCents: 0, isAvailable: true },
              ],
            },
          ],
        }),
      ],
    },
    {
      id: "sec_sides",
      name: "Sides",
      items: [
        item({ id: "elote", name: "Elote", description: "Grilled corn, mayo, cotija, chile, lime.", priceCents: 500 }),
        item({ id: "chips", name: "Chips & salsa", description: "Fried-to-order tortilla chips with roja.", priceCents: 450 }),
        item({ id: "churros", name: "Churros", description: "Four, rolled in cinnamon sugar, with cajeta.", priceCents: 550 }),
      ],
    },
    {
      id: "sec_drinks",
      name: "Drinks",
      items: [
        item({ id: "horchata", name: "Horchata", description: "House-made, 16 oz.", priceCents: 450 }),
        item({ id: "jamaica", name: "Agua de jamaica", description: "Hibiscus, lightly sweet, 16 oz.", priceCents: 400 }),
        item({ id: "coke", name: "Mexican Coke", description: "Glass bottle.", priceCents: 350 }),
        item({ id: "topo", name: "Topo Chico", description: "Sparkling mineral water.", priceCents: 300, isAvailable: false }),
      ],
    },
  ],
};

// ─── Services & slots ──────────────────────────────────────────────────────

function buildServices(now: Date): Service[] {
  const HOUR = 60 * 60 * 1000;
  // Live service: started up to 30 min ago, runs 3 hours.
  const liveStart = new Date(Math.floor(now.getTime() / (30 * 60 * 1000)) * 30 * 60 * 1000 - 30 * 60 * 1000);
  const liveEnd = new Date(liveStart.getTime() + 3 * HOUR);

  const service = (
    id: string,
    locationId: string,
    startsAt: Date,
    endsAt: Date,
    orderingOpensAt: Date,
    status: Service["status"] = "PUBLISHED"
  ): Service => ({
    id,
    locationId,
    menuId: menu.id,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    orderingOpensAt: orderingOpensAt.toISOString(),
    orderingClosesAt: new Date(endsAt.getTime() - 15 * 60 * 1000).toISOString(),
    slotMinutes: 15,
    ordersPerSlot: 6,
    status,
  });

  return [
    service("svc_live", "loc_riverside", liveStart, liveEnd, new Date(liveStart.getTime() - 48 * HOUR), "LIVE"),
    service(
      "svc_tomorrow",
      "loc_halsted",
      zonedTime(TZ, 1, 11, 0, now),
      zonedTime(TZ, 1, 14, 0, now),
      new Date(now.getTime() - HOUR)
    ),
    service(
      "svc_nightmarket",
      "loc_nightmarket",
      zonedTime(TZ, 2, 17, 0, now),
      zonedTime(TZ, 2, 21, 0, now),
      zonedTime(TZ, 2, 9, 0, now)
    ),
    service(
      "svc_farmers",
      "loc_farmers",
      zonedTime(TZ, 4, 9, 0, now),
      zonedTime(TZ, 4, 13, 0, now),
      zonedTime(TZ, 3, 17, 0, now)
    ),
  ];
}

function buildSlots(service: Service): PickupSlot[] {
  const slots: PickupSlot[] = [];
  const start = new Date(service.startsAt).getTime();
  const end = new Date(service.endsAt).getTime();
  const step = service.slotMinutes * 60 * 1000;
  // Deterministic "busyness" so the demo shows a few full slots at rush.
  const booked = [2, 4, 6, 6, 5, 3, 6, 2, 1, 4, 0, 1, 0, 2, 0, 0];
  for (let t = start, i = 0; t < end; t += step, i++) {
    slots.push({
      id: `${service.id}_slot_${i}`,
      serviceId: service.id,
      startsAt: new Date(t).toISOString(),
      capacity: service.ordersPerSlot,
      bookedCount: Math.min(booked[i % booked.length], service.ordersPerSlot),
    });
  }
  return slots;
}

// ─── Queries (stand-ins for lib/tenant.ts) ─────────────────────────────────

export function getTruckBySlug(slug: string): Truck | null {
  return slug === truck.slug ? truck : null;
}

export function getUpcomingServices(truckId: string, now: Date = new Date()): Service[] {
  if (truckId !== truck.id) return [];
  return buildServices(now).filter((s) => new Date(s.endsAt) > now);
}

export function getLocation(locationId: string): Location | null {
  return locations.find((l) => l.id === locationId) ?? null;
}

export function getMenu(menuId: string): Menu | null {
  return menuId === menu.id ? menu : null;
}

/** Slots a customer can still book: in the future (with lead time) and not full. */
export function getBookableSlots(service: Service, now: Date = new Date()): PickupSlot[] {
  const leadMs = 10 * 60 * 1000;
  return buildSlots(service).filter(
    (s) => new Date(s.startsAt).getTime() >= now.getTime() + leadMs && s.bookedCount < s.capacity
  );
}
