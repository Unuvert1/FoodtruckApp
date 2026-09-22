// Demo data: Comal Taqueria at /demo-truck, with a menu, four stops, and a few
// orders in the queue. Safe to re-run: it rebuilds the demo truck's data with
// fresh dates (today's stop runs 8 am–10 pm truck time, so a demo works any
// time that day) and keeps anyone who has joined the truck as an owner.
//
//   npx prisma db seed

import "./load-env";
import { prisma } from "@/lib/db";
import { priceOrder, type RequestedLine } from "@/lib/pricing";
import { formatOrderNumber } from "@/lib/orders/order-number";
import { zonedTime } from "@/lib/time";
import type { Prisma } from "@/lib/generated/prisma/client";

const SLUG = "demo-truck";
const TZ = "America/Chicago";

// ─── Menu ──────────────────────────────────────────────────────────────────

type GroupSeed = Omit<Prisma.ModifierGroupCreateWithoutMenuItemInput, "options"> & {
  options: { name: string; priceDeltaCents?: number; isAvailable?: boolean }[];
};

const tortilla: GroupSeed = {
  name: "Tortilla",
  minSelect: 1,
  maxSelect: 1,
  required: true,
  options: [{ name: "Corn" }, { name: "Flour" }],
};

const salsa: GroupSeed = {
  name: "Salsa",
  minSelect: 1,
  maxSelect: 1,
  required: true,
  options: [{ name: "Verde" }, { name: "Roja" }, { name: "Habanero", isAvailable: false }],
};

const tacoExtras: GroupSeed = {
  name: "Extras",
  minSelect: 0,
  maxSelect: 3,
  required: false,
  options: [
    { name: "Cup of consommé", priceDeltaCents: 200 },
    { name: "Melted queso", priceDeltaCents: 150 },
    { name: "Extra onion & cilantro" },
  ],
};

type ItemSeed = {
  name: string;
  description: string;
  priceCents: number;
  isAvailable?: boolean;
  groups?: GroupSeed[];
};

const MENU: { section: string; items: ItemSeed[] }[] = [
  {
    section: "Tacos",
    items: [
      {
        name: "Birria tacos",
        description: "Three tacos of slow-braised beef, dipped and crisped on the comal. Onion, cilantro, lime.",
        priceCents: 1350,
        groups: [tortilla, tacoExtras],
      },
      {
        name: "Al pastor tacos",
        description: "Three tacos of chile-marinated pork shaved off the trompo, with pineapple.",
        priceCents: 1200,
        groups: [tortilla, salsa],
      },
      {
        name: "Carnitas tacos",
        description: "Three tacos of confit pork shoulder, pickled red onion, salsa verde.",
        priceCents: 1250,
        isAvailable: false,
        groups: [tortilla],
      },
      {
        name: "Mushroom & poblano tacos",
        description: "Three tacos of charred mushrooms and rajas with crema and cotija. Vegetarian.",
        priceCents: 1150,
        groups: [tortilla, salsa],
      },
    ],
  },
  {
    section: "Plates",
    items: [
      {
        name: "Quesabirria plate",
        description: "Two cheese-crusted birria quesadillas, rice, beans, and a cup of consommé for dipping.",
        priceCents: 1550,
      },
      {
        name: "Rice bowl",
        description: "Cilantro rice, black beans, pico, crema, and your choice of filling.",
        priceCents: 1250,
        groups: [
          {
            name: "Filling",
            minSelect: 1,
            maxSelect: 1,
            required: true,
            options: [
              { name: "Birria", priceDeltaCents: 100 },
              { name: "Al pastor" },
              { name: "Carnitas", isAvailable: false },
              { name: "Mushroom & poblano" },
            ],
          },
        ],
      },
    ],
  },
  {
    section: "Sides",
    items: [
      { name: "Elote", description: "Grilled corn, mayo, cotija, chile, lime.", priceCents: 500 },
      { name: "Chips & salsa", description: "Fried-to-order tortilla chips with roja.", priceCents: 450 },
      { name: "Churros", description: "Four, rolled in cinnamon sugar, with cajeta.", priceCents: 550 },
    ],
  },
  {
    section: "Drinks",
    items: [
      { name: "Horchata", description: "House-made, 16 oz.", priceCents: 450 },
      { name: "Agua de jamaica", description: "Hibiscus, lightly sweet, 16 oz.", priceCents: 400 },
      { name: "Mexican Coke", description: "Glass bottle.", priceCents: 350 },
      { name: "Topo Chico", description: "Sparkling mineral water.", priceCents: 300, isAvailable: false },
    ],
  },
];

const LOCATIONS = [
  {
    key: "riverside",
    name: "Riverside Brewing Co.",
    addressLine: "412 Mill St",
    city: "Northfield",
    lat: 41.9101,
    lng: -87.6553,
    notes: "Parked on the patio side, by the loading door.",
  },
  {
    key: "halsted",
    name: "Halsted Office Park",
    addressLine: "2200 N Halsted Ave",
    city: "Northfield",
    lat: 41.9222,
    lng: -87.6487,
    notes: "Between buildings B and C.",
  },
  {
    key: "nightmarket",
    name: "Lakeview Night Market",
    addressLine: "3300 N Clark St",
    city: "Lakeview",
    lat: 41.9412,
    lng: -87.6495,
    notes: null,
  },
  {
    key: "farmers",
    name: "Northfield Farmers Market",
    addressLine: "Village Green, 1 Central Ave",
    city: "Northfield",
    lat: 41.9056,
    lng: -87.6612,
    notes: "Stall 14, north row.",
  },
] as const;

// ─── Seed ──────────────────────────────────────────────────────────────────

async function main() {
  const now = new Date();

  const truckData = {
    name: "Comal Taqueria",
    tagline: "Birria, al pastor, and handmade tortillas off the comal.",
    timezone: TZ,
    brandColor: "#22603F",
    brandColorForeground: "#FFFFFF",
    taxRateBps: 1025,
    platformFeeBps: 250,
  };
  const truck = await prisma.truck.upsert({
    where: { slug: SLUG },
    update: truckData,
    create: { slug: SLUG, ...truckData },
  });

  // Clear the demo truck's data (children before parents), keeping memberships.
  await prisma.order.deleteMany({ where: { truckId: truck.id } });
  await prisma.service.deleteMany({ where: { truckId: truck.id } });
  await prisma.menuItem.deleteMany({ where: { truckId: truck.id } });
  await prisma.menu.deleteMany({ where: { truckId: truck.id } });
  await prisma.location.deleteMany({ where: { truckId: truck.id } });

  // Menu
  const menu = await prisma.menu.create({ data: { truckId: truck.id, name: "Everyday", isDefault: true } });
  for (const [sectionIndex, { section, items }] of MENU.entries()) {
    const created = await prisma.menuSection.create({
      data: { menuId: menu.id, name: section, sortOrder: sectionIndex },
    });
    for (const [itemIndex, item] of items.entries()) {
      await prisma.menuItem.create({
        data: {
          truckId: truck.id,
          sectionId: created.id,
          name: item.name,
          description: item.description,
          priceCents: item.priceCents,
          isAvailable: item.isAvailable ?? true,
          sortOrder: itemIndex,
          modifierGroups: {
            create: (item.groups ?? []).map(({ options, ...group }, groupIndex) => ({
              ...group,
              sortOrder: groupIndex,
              options: {
                create: options.map((o, optionIndex) => ({
                  name: o.name,
                  priceDeltaCents: o.priceDeltaCents ?? 0,
                  isAvailable: o.isAvailable ?? true,
                  sortOrder: optionIndex,
                })),
              },
            })),
          },
        },
      });
    }
  }

  // Locations
  const locationIds: Record<string, string> = {};
  for (const { key, ...location } of LOCATIONS) {
    locationIds[key] = (await prisma.location.create({ data: { truckId: truck.id, ...location } })).id;
  }

  // Services, each with its pickup slots
  const HOUR = 60 * 60 * 1000;
  const stops = [
    { location: "riverside", start: zonedTime(TZ, 0, 8, 0, now), end: zonedTime(TZ, 0, 22, 0, now), opens: new Date(now.getTime() - 24 * HOUR) },
    { location: "halsted", start: zonedTime(TZ, 1, 11, 0, now), end: zonedTime(TZ, 1, 14, 0, now), opens: new Date(now.getTime() - HOUR) },
    { location: "nightmarket", start: zonedTime(TZ, 2, 17, 0, now), end: zonedTime(TZ, 2, 21, 0, now), opens: zonedTime(TZ, 2, 9, 0, now) },
    { location: "farmers", start: zonedTime(TZ, 4, 9, 0, now), end: zonedTime(TZ, 4, 13, 0, now), opens: zonedTime(TZ, 3, 17, 0, now) },
  ];
  const SLOT_MINUTES = 15;
  const ORDERS_PER_SLOT = 6;
  const serviceIds: string[] = [];
  for (const stop of stops) {
    const slots: { startsAt: Date; capacity: number }[] = [];
    for (let t = stop.start.getTime(); t < stop.end.getTime(); t += SLOT_MINUTES * 60 * 1000) {
      slots.push({ startsAt: new Date(t), capacity: ORDERS_PER_SLOT });
    }
    const service = await prisma.service.create({
      data: {
        truckId: truck.id,
        locationId: locationIds[stop.location],
        menuId: menu.id,
        startsAt: stop.start,
        endsAt: stop.end,
        orderingOpensAt: stop.opens,
        orderingClosesAt: new Date(stop.end.getTime() - 15 * 60 * 1000),
        slotMinutes: SLOT_MINUTES,
        ordersPerSlot: ORDERS_PER_SLOT,
        status: "PUBLISHED",
        pickupSlots: { create: slots },
      },
    });
    serviceIds.push(service.id);
  }

  await seedSampleOrders(truck.id, serviceIds[0], now);

  console.log(`Seeded ${truckData.name} at /${SLUG}: ${MENU.flatMap((s) => s.items).length} items, ${stops.length} stops.`);
}

/** A few orders at different stages on today's stop, so the queue isn't empty. */
async function seedSampleOrders(truckId: string, serviceId: string, now: Date) {
  const items = await prisma.menuItem.findMany({
    where: { truckId },
    include: { modifierGroups: { include: { options: true } } },
  });
  const find = (name: string) => items.find((i) => i.name === name)!;
  const option = (itemName: string, optionName: string) =>
    find(itemName).modifierGroups.flatMap((g) => g.options).find((o) => o.name === optionName)!.id;

  // Upcoming slots, soonest first. (Late at night there may be none left: then skip.)
  const slots = await prisma.pickupSlot.findMany({
    where: { serviceId, startsAt: { gte: new Date(now.getTime() + 5 * 60 * 1000) } },
    orderBy: { startsAt: "asc" },
    take: 4,
  });
  if (slots.length === 0) return;

  const samples: { name: string; phone: string; status: "PAID" | "ACCEPTED" | "PREPARING" | "READY"; slot: number; lines: RequestedLine[] }[] = [
    {
      name: "Maya",
      phone: "(312) 555-0142",
      status: "READY",
      slot: 0,
      lines: [{ menuItemId: find("Quesabirria plate").id, optionIds: [], quantity: 1 }],
    },
    {
      name: "Devon",
      phone: "(312) 555-0187",
      status: "PREPARING",
      slot: 0,
      lines: [
        {
          menuItemId: find("Birria tacos").id,
          optionIds: [option("Birria tacos", "Corn"), option("Birria tacos", "Cup of consommé")],
          quantity: 2,
        },
        { menuItemId: find("Horchata").id, optionIds: [], quantity: 2 },
      ],
    },
    {
      name: "Priya",
      phone: "(773) 555-0119",
      status: "ACCEPTED",
      slot: 1,
      lines: [
        {
          menuItemId: find("Al pastor tacos").id,
          optionIds: [option("Al pastor tacos", "Flour"), option("Al pastor tacos", "Verde")],
          quantity: 1,
        },
        { menuItemId: find("Elote").id, optionIds: [], quantity: 1 },
      ],
    },
    {
      name: "Sam",
      phone: "(312) 555-0163",
      status: "PAID",
      slot: 2,
      lines: [
        { menuItemId: find("Rice bowl").id, optionIds: [option("Rice bowl", "Mushroom & poblano")], quantity: 1 },
        { menuItemId: find("Agua de jamaica").id, optionIds: [], quantity: 1 },
      ],
    },
    {
      name: "Luis",
      phone: "(773) 555-0178",
      status: "PAID",
      slot: 3,
      lines: [{ menuItemId: find("Churros").id, optionIds: [], quantity: 2 }],
    },
  ];

  let count = 0;
  for (const sample of samples) {
    const slot = slots[Math.min(sample.slot, slots.length - 1)];
    const priced = priceOrder({ items, lines: sample.lines, taxRateBps: 1025, tipBps: 1500, platformFeeBps: 250 });
    count += 1;
    await prisma.order.create({
      data: {
        truckId,
        serviceId,
        pickupSlotId: slot.id,
        orderNumber: formatOrderNumber(count),
        customerName: sample.name,
        customerPhone: sample.phone,
        subtotalCents: priced.subtotalCents,
        taxCents: priced.taxCents,
        tipCents: priced.tipCents,
        platformFeeCents: priced.platformFeeCents,
        totalCents: priced.totalCents,
        status: sample.status,
        placedAt: new Date(now.getTime() - (samples.length - count + 1) * 4 * 60 * 1000),
        readyAt: sample.status === "READY" ? now : null,
        lineItems: { create: priced.lines },
      },
    });
    await prisma.pickupSlot.update({ where: { id: slot.id }, data: { bookedCount: { increment: 1 } } });
  }
  await prisma.service.update({ where: { id: serviceId }, data: { orderCount: count } });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
