// ★ The tenancy chokepoint. Every query on a tenant table lives in this file,
// and every function takes the truckId it is allowed to touch. Truck A reading
// or changing truck B's data is the worst bug this codebase can have, so:
//   - storefront code gets its truck from getTruckFromRequest(slug)
//   - dashboard code gets its truck from requireTruckAccess() (never from input)
//   - every where-clause below includes truckId (directly or via a parent)

import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import type { MembershipRole, OrderStatus } from "@/lib/generated/prisma/enums";
import type {
  Location,
  ManagedSection,
  Menu,
  MenuItem,
  OrderView,
  PickupSlot,
  Service,
  Truck,
} from "@/lib/types";
import type { PricingItem } from "@/lib/pricing";
import { formatOrderNumber } from "@/lib/orders/order-number";

type Tx = Prisma.TransactionClient;

/** Customers can't book a slot that starts sooner than this. */
const SLOT_LEAD_MS = 10 * 60 * 1000;

// ─── Row → view mappers ────────────────────────────────────────────────────

type TruckRow = Prisma.TruckGetPayload<object>;

function toTruck(row: TruckRow): Truck {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    timezone: row.timezone,
    tagline: row.tagline,
    branding: { color: row.brandColor, colorForeground: row.brandColorForeground },
    taxRateBps: row.taxRateBps,
  };
}

function toLocation(row: Prisma.LocationGetPayload<object>): Location {
  return {
    id: row.id,
    name: row.name,
    addressLine: row.addressLine,
    city: row.city,
    lat: row.lat,
    lng: row.lng,
    notes: row.notes,
  };
}

function toService(row: Prisma.ServiceGetPayload<object>): Service {
  return {
    id: row.id,
    locationId: row.locationId,
    menuId: row.menuId,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    orderingOpensAt: row.orderingOpensAt.toISOString(),
    orderingClosesAt: row.orderingClosesAt.toISOString(),
    slotMinutes: row.slotMinutes,
    ordersPerSlot: row.ordersPerSlot,
    status: row.status,
  };
}

const itemInclude = {
  modifierGroups: {
    orderBy: { sortOrder: "asc" },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  },
} satisfies Prisma.MenuItemInclude;

type ItemRow = Prisma.MenuItemGetPayload<{ include: typeof itemInclude }>;

function toMenuItem(row: ItemRow): MenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priceCents: row.priceCents,
    isAvailable: row.isAvailable,
    modifierGroups: row.modifierGroups.map((g) => ({
      id: g.id,
      name: g.name,
      minSelect: g.minSelect,
      maxSelect: g.maxSelect,
      required: g.required,
      options: g.options.map((o) => ({
        id: o.id,
        name: o.name,
        priceDeltaCents: o.priceDeltaCents,
        isAvailable: o.isAvailable,
      })),
    })),
  };
}

const orderInclude = {
  pickupSlot: { select: { startsAt: true } },
  lineItems: { orderBy: { id: "asc" } },
} satisfies Prisma.OrderInclude;

type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

function modifierNames(snapshot: Prisma.JsonValue): string[] {
  if (!Array.isArray(snapshot)) return [];
  return snapshot.flatMap((m) =>
    m && typeof m === "object" && !Array.isArray(m) && typeof m.name === "string" ? [m.name] : []
  );
}

function toOrderView(row: OrderRow): OrderView {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    pickupAt: row.pickupSlot.startsAt.toISOString(),
    placedAt: row.placedAt.toISOString(),
    lines: row.lineItems.map((l) => ({
      id: l.id,
      name: l.nameSnapshot,
      quantity: l.quantity,
      modifiers: modifierNames(l.modifiersSnapshot),
      lineTotalCents: l.lineTotalCents,
    })),
    subtotalCents: row.subtotalCents,
    taxCents: row.taxCents,
    tipCents: row.tipCents,
    totalCents: row.totalCents,
  };
}

// ─── Tenant resolution ─────────────────────────────────────────────────────

/** Storefront: the truck for a URL slug. (Custom domains resolve to a slug in middleware.) */
export const getTruckFromRequest = cache(async (slug: string): Promise<Truck | null> => {
  const row = await prisma.truck.findUnique({ where: { slug } });
  return row ? toTruck(row) : null;
});

export type TruckAccess = {
  userId: string;
  role: MembershipRole;
  truck: Truck;
  notificationEmail: string | null;
};

/**
 * Dashboard: the signed-in user's truck, via their Membership. Redirects to
 * sign-in or onboarding when there isn't one. Dashboard code must take its
 * truckId from here, never from a form field or URL.
 */
export const requireTruckAccess = cache(async (): Promise<TruckAccess> => {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const membership = await prisma.membership.findFirst({
    where: { clerkUserId: userId },
    orderBy: { createdAt: "asc" },
    include: { truck: true },
  });
  if (!membership) redirect("/dashboard/onboarding");

  return {
    userId,
    role: membership.role,
    truck: toTruck(membership.truck),
    notificationEmail: membership.truck.notificationEmail,
  };
});

/** Onboarding: whether this user already belongs to a truck. */
export async function userHasTruck(clerkUserId: string): Promise<boolean> {
  return (await prisma.membership.count({ where: { clerkUserId } })) > 0;
}

// ─── Storefront reads ──────────────────────────────────────────────────────

export async function getUpcomingServices(
  truckId: string,
  now: Date
): Promise<{ services: Service[]; locations: Record<string, Location> }> {
  const rows = await prisma.service.findMany({
    where: { truckId, status: { in: ["PUBLISHED", "LIVE"] }, endsAt: { gt: now } },
    orderBy: { startsAt: "asc" },
    take: 8,
    include: { location: true },
  });
  const locations: Record<string, Location> = {};
  for (const row of rows) locations[row.locationId] = toLocation(row.location);
  return { services: rows.map(toService), locations };
}

export async function getServiceWithLocation(
  truckId: string,
  serviceId: string
): Promise<{ service: Service; location: Location } | null> {
  const row = await prisma.service.findFirst({
    where: { id: serviceId, truckId, status: { in: ["PUBLISHED", "LIVE"] } },
    include: { location: true },
  });
  return row ? { service: toService(row), location: toLocation(row.location) } : null;
}

/** The menu customers see: archived items left out, sold-out items kept (shown disabled). */
export async function getStorefrontMenu(truckId: string, menuId: string): Promise<Menu | null> {
  const row = await prisma.menu.findFirst({
    where: { id: menuId, truckId },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: {
          items: { where: { archivedAt: null }, orderBy: { sortOrder: "asc" }, include: itemInclude },
        },
      },
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    sections: row.sections
      .filter((s) => s.items.length > 0)
      .map((s) => ({ id: s.id, name: s.name, items: s.items.map(toMenuItem) })),
  };
}

/** Slots a customer can still book: far enough in the future and not full. */
export async function getBookableSlots(truckId: string, serviceId: string, now: Date): Promise<PickupSlot[]> {
  const rows = await prisma.pickupSlot.findMany({
    where: {
      serviceId,
      service: { truckId },
      startsAt: { gte: new Date(now.getTime() + SLOT_LEAD_MS) },
      bookedCount: { lt: prisma.pickupSlot.fields.capacity },
    },
    orderBy: { startsAt: "asc" },
  });
  return rows.map((s) => ({
    id: s.id,
    serviceId: s.serviceId,
    startsAt: s.startsAt.toISOString(),
    capacity: s.capacity,
    bookedCount: s.bookedCount,
  }));
}

/** The customer's order status page. The URL carries the unguessable order id. */
export async function getOrderForCustomer(
  truckId: string,
  orderId: string
): Promise<{ order: OrderView; location: Location } | null> {
  const row = await prisma.order.findFirst({
    where: { id: orderId, truckId, status: { not: "PENDING_PAYMENT" } },
    include: { ...orderInclude, service: { include: { location: true } } },
  });
  return row ? { order: toOrderView(row), location: toLocation(row.service.location) } : null;
}

// ─── Order creation primitives (used only by lib/orders/*) ─────────────────

/** Runs `fn` in one database transaction. */
export function withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return prisma.$transaction(fn);
}

export async function getOrderingContext(tx: Tx, truckId: string, serviceId: string) {
  const service = await tx.service.findFirst({
    where: { id: serviceId, truckId, status: { in: ["PUBLISHED", "LIVE"] } },
    include: { truck: true },
  });
  if (!service) return null;
  return {
    orderingOpensAt: service.orderingOpensAt,
    orderingClosesAt: service.orderingClosesAt,
    taxRateBps: service.truck.taxRateBps,
    platformFeeBps: service.truck.platformFeeBps,
  };
}

export async function getPricingItems(tx: Tx, truckId: string, itemIds: string[]): Promise<PricingItem[]> {
  const rows = await tx.menuItem.findMany({ where: { truckId, id: { in: itemIds } }, include: itemInclude });
  return rows.map((row) => ({ ...toMenuItem(row), archivedAt: row.archivedAt }));
}

/**
 * Take one seat in a pickup slot. A single conditional UPDATE
 * (bookedCount < capacity), so two customers can never both get the last seat.
 */
export async function reserveSlot(tx: Tx, truckId: string, serviceId: string, slotId: string, now: Date) {
  const { count } = await tx.pickupSlot.updateMany({
    where: {
      id: slotId,
      serviceId,
      service: { truckId },
      startsAt: { gte: new Date(now.getTime() + SLOT_LEAD_MS) },
      bookedCount: { lt: tx.pickupSlot.fields.capacity },
    },
    data: { bookedCount: { increment: 1 } },
  });
  return count === 1;
}

/** Hands out the next order number for a service with an atomic increment. */
export async function nextOrderNumber(tx: Tx, truckId: string, serviceId: string): Promise<string> {
  const { orderCount } = await tx.service.update({
    where: { id: serviceId, truckId },
    data: { orderCount: { increment: 1 } },
    select: { orderCount: true },
  });
  return formatOrderNumber(orderCount);
}

export async function insertOrder(
  tx: Tx,
  truckId: string,
  data: Omit<Prisma.OrderUncheckedCreateInput, "truckId" | "lineItems"> & {
    lineItems: Omit<Prisma.OrderLineItemUncheckedCreateWithoutOrderInput, "id">[];
  }
): Promise<string> {
  const { lineItems, ...order } = data;
  const row = await tx.order.create({
    data: { ...order, truckId, lineItems: { create: lineItems } },
    select: { id: true },
  });
  return row.id;
}

/** PENDING_PAYMENT → PAID. Returns false if it was already paid (safe to call twice). */
export async function setOrderPaid(truckId: string, orderId: string): Promise<boolean> {
  const { count } = await prisma.order.updateMany({
    where: { id: orderId, truckId, status: "PENDING_PAYMENT" },
    data: { status: "PAID" },
  });
  return count === 1;
}

/** Everything the new-order email needs. */
export async function getOrderNotification(truckId: string, orderId: string) {
  const row = await prisma.order.findFirst({
    where: { id: orderId, truckId },
    include: { ...orderInclude, truck: true, service: { include: { location: true } } },
  });
  if (!row) return null;
  return {
    order: toOrderView(row),
    truck: toTruck(row.truck),
    notificationEmail: row.truck.notificationEmail,
    locationName: row.service.location.name,
  };
}

// ─── Dashboard: service screen ─────────────────────────────────────────────

/** Services a vendor might be working: anything not long finished, soonest first. */
export async function getDashboardServices(
  truckId: string,
  now: Date
): Promise<{ services: Service[]; locations: Record<string, Location> }> {
  const rows = await prisma.service.findMany({
    where: {
      truckId,
      status: { in: ["PUBLISHED", "LIVE"] },
      endsAt: { gt: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
    },
    orderBy: { startsAt: "asc" },
    take: 10,
    include: { location: true },
  });
  const locations: Record<string, Location> = {};
  for (const row of rows) locations[row.locationId] = toLocation(row.location);
  return { services: rows.map(toService), locations };
}

/** Paid orders for one service, in pickup order. Unpaid checkouts aren't the kitchen's business yet. */
export async function getServiceOrders(truckId: string, serviceId: string): Promise<OrderView[]> {
  const rows = await prisma.order.findMany({
    where: { truckId, serviceId, status: { notIn: ["PENDING_PAYMENT"] } },
    include: orderInclude,
    orderBy: [{ pickupSlot: { startsAt: "asc" } }, { placedAt: "asc" }],
  });
  return rows.map(toOrderView);
}

/**
 * Move an order one step. Only succeeds if it's still in `from`, so two staff
 * tapping the same ticket can't skip a step.
 */
export async function advanceOrderStatus(
  truckId: string,
  orderId: string,
  from: OrderStatus,
  to: OrderStatus
): Promise<boolean> {
  const now = new Date();
  const { count } = await prisma.order.updateMany({
    where: { id: orderId, truckId, status: from },
    data: {
      status: to,
      ...(to === "READY" && { readyAt: now }),
      ...(to === "PICKED_UP" && { pickedUpAt: now }),
    },
  });
  return count === 1;
}

const CANCELLABLE: OrderStatus[] = ["PAID", "ACCEPTED", "PREPARING", "READY"];

/** Cancel an order and give its pickup-slot seat back. */
export async function cancelOrder(truckId: string, orderId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, truckId, status: { in: CANCELLABLE } },
      select: { pickupSlotId: true, status: true },
    });
    if (!order) return false;
    const { count } = await tx.order.updateMany({
      where: { id: orderId, truckId, status: order.status },
      data: { status: "CANCELLED" },
    });
    if (count !== 1) return false;
    await tx.pickupSlot.updateMany({
      where: { id: order.pickupSlotId, bookedCount: { gt: 0 } },
      data: { bookedCount: { decrement: 1 } },
    });
    return true;
  });
}

// ─── Dashboard: menu management ────────────────────────────────────────────

async function getDefaultMenuId(truckId: string): Promise<string | null> {
  const menu = await prisma.menu.findFirst({
    where: { truckId },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
    select: { id: true },
  });
  return menu?.id ?? null;
}

/** The whole default menu, archived items included, for the vendor. */
export async function getManagedMenu(truckId: string): Promise<{ menuId: string; sections: ManagedSection[] } | null> {
  const menuId = await getDefaultMenuId(truckId);
  if (!menuId) return null;
  const sections = await prisma.menuSection.findMany({
    where: { menuId, menu: { truckId } },
    orderBy: { sortOrder: "asc" },
    include: { items: { where: { truckId }, orderBy: { sortOrder: "asc" }, include: itemInclude } },
  });
  return {
    menuId,
    sections: sections.map((s) => ({
      id: s.id,
      name: s.name,
      items: s.items.map((row) => ({ ...toMenuItem(row), sectionId: row.sectionId, archived: row.archivedAt !== null })),
    })),
  };
}

export async function setItemAvailability(truckId: string, itemId: string, isAvailable: boolean): Promise<boolean> {
  const { count } = await prisma.menuItem.updateMany({
    where: { id: itemId, truckId, archivedAt: null },
    data: { isAvailable },
  });
  return count === 1;
}

async function sectionBelongsToTruck(truckId: string, sectionId: string): Promise<boolean> {
  return (await prisma.menuSection.count({ where: { id: sectionId, menu: { truckId } } })) === 1;
}

export type MenuItemInput = {
  sectionId: string;
  name: string;
  description: string;
  priceCents: number;
  isAvailable: boolean;
};

export async function createMenuItem(truckId: string, input: MenuItemInput): Promise<boolean> {
  if (!(await sectionBelongsToTruck(truckId, input.sectionId))) return false;
  const sortOrder = await prisma.menuItem.count({ where: { truckId, sectionId: input.sectionId } });
  await prisma.menuItem.create({ data: { ...input, truckId, sortOrder } });
  return true;
}

export async function updateMenuItem(truckId: string, itemId: string, input: MenuItemInput): Promise<boolean> {
  if (!(await sectionBelongsToTruck(truckId, input.sectionId))) return false;
  const { count } = await prisma.menuItem.updateMany({ where: { id: itemId, truckId }, data: input });
  return count === 1;
}

/** Soft delete (or restore). Items are never hard-deleted: past orders may reference them. */
export async function setItemArchived(truckId: string, itemId: string, archived: boolean): Promise<boolean> {
  const { count } = await prisma.menuItem.updateMany({
    where: { id: itemId, truckId },
    data: { archivedAt: archived ? new Date() : null },
  });
  return count === 1;
}

export async function createSection(truckId: string, name: string): Promise<boolean> {
  const menuId = await getDefaultMenuId(truckId);
  if (!menuId) return false;
  const sortOrder = await prisma.menuSection.count({ where: { menuId } });
  await prisma.menuSection.create({ data: { menuId, name, sortOrder } });
  return true;
}

// ─── Dashboard: settings & onboarding ──────────────────────────────────────

export async function updateNotificationEmail(truckId: string, email: string | null): Promise<void> {
  await prisma.truck.update({ where: { id: truckId }, data: { notificationEmail: email } });
}

export async function isSlugTaken(slug: string): Promise<boolean> {
  return (await prisma.truck.count({ where: { slug } })) > 0;
}

/** A brand-new truck, owned by this user, with an empty default menu. */
export async function createTruckForUser(
  clerkUserId: string,
  input: { name: string; slug: string; timezone: string; notificationEmail: string | null }
): Promise<void> {
  await prisma.truck.create({
    data: {
      ...input,
      memberships: { create: { clerkUserId, role: "OWNER" } },
      menus: { create: { name: "Menu", isDefault: true, sections: { create: { name: "Menu", sortOrder: 0 } } } },
    },
  });
}

export const DEMO_TRUCK_SLUG = "demo-truck";

/** Development helper: make this user an owner of the seeded demo truck. */
export async function joinDemoTruck(clerkUserId: string, email: string | null): Promise<boolean> {
  const truck = await prisma.truck.findUnique({ where: { slug: DEMO_TRUCK_SLUG } });
  if (!truck) return false;
  await prisma.membership.upsert({
    where: { truckId_clerkUserId: { truckId: truck.id, clerkUserId } },
    update: {},
    create: { truckId: truck.id, clerkUserId, role: "OWNER" },
  });
  if (email && !truck.notificationEmail) {
    await prisma.truck.update({ where: { id: truck.id }, data: { notificationEmail: email } });
  }
  return true;
}
