// TEMPORARY: until Stream C (createOrder + Stripe) exists, "placing" an order
// saves this snapshot in the browser so the order status page has something
// to show. Its shape follows Order + OrderLineItem, including price
// snapshots, so the status page won't need to change much.

export type DemoOrder = {
  orderNumber: string;
  truckSlug: string;
  customerName: string;
  pickupAt: string; // ISO, UTC
  locationName: string;
  locationAddress: string;
  lines: {
    nameSnapshot: string;
    modifiersSnapshot: string[];
    unitPriceCents: number;
    quantity: number;
    lineTotalCents: number;
  }[];
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
  placedAt: string;
};

const key = (truckSlug: string, orderNumber: string) => `order:${truckSlug}:${orderNumber}`;

export function saveDemoOrder(order: DemoOrder) {
  sessionStorage.setItem(key(order.truckSlug, order.orderNumber), JSON.stringify(order));
}

export function loadDemoOrder(truckSlug: string, orderNumber: string): DemoOrder | null {
  try {
    const raw = sessionStorage.getItem(key(truckSlug, orderNumber));
    return raw ? (JSON.parse(raw) as DemoOrder) : null;
  } catch {
    return null;
  }
}
