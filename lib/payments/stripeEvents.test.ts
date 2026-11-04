import Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";
import { processStripeEvent, verifyStripeEvent, type PaymentDeps } from "@/lib/payments/stripeEvents";

const SECRET = "whsec_test_secret";
const stripe = new Stripe("sk_test_dummy");

function signed(body: string, secret = SECRET) {
  return stripe.webhooks.generateTestHeaderString({ payload: body, secret });
}

describe("verifyStripeEvent", () => {
  const body = JSON.stringify({ id: "evt_1", object: "event", type: "checkout.session.completed", data: { object: {} } });

  it("accepts a correctly signed event", () => {
    expect(verifyStripeEvent(stripe, body, signed(body), SECRET)?.id).toBe("evt_1");
  });
  it("rejects a missing signature", () => {
    expect(verifyStripeEvent(stripe, body, null, SECRET)).toBeNull();
  });
  it("rejects a signature made with a different secret", () => {
    expect(verifyStripeEvent(stripe, body, signed(body, "whsec_other"), SECRET)).toBeNull();
  });
  it("rejects a body that was changed after signing", () => {
    expect(verifyStripeEvent(stripe, body.replace("evt_1", "evt_2"), signed(body), SECRET)).toBeNull();
  });
});

function session(over: Record<string, unknown> = {}) {
  return {
    id: "cs_1",
    payment_status: "paid",
    amount_total: 2500,
    payment_intent: "pi_1",
    metadata: { orderId: "o1", truckId: "t1" },
    ...over,
  };
}

function event(type: string, obj: Record<string, unknown>, id = "evt_1") {
  return { id, type, data: { object: obj } } as unknown as Stripe.Event;
}

function deps(over: Partial<PaymentDeps> = {}): PaymentDeps {
  return {
    claimEvent: vi.fn().mockResolvedValue(true),
    finishEvent: vi.fn().mockResolvedValue(undefined),
    getOrder: vi.fn().mockResolvedValue({ status: "PENDING_PAYMENT", totalCents: 2500, stripeCheckoutSessionId: "cs_1" }),
    markPaid: vi.fn().mockResolvedValue(undefined),
    cancelUnpaid: vi.fn().mockResolvedValue(true),
    ...over,
  };
}

describe("processStripeEvent", () => {
  it("marks the order paid when the payment succeeds", async () => {
    const d = deps();
    expect(await processStripeEvent(event("checkout.session.completed", session()), d)).toBe("paid");
    expect(d.markPaid).toHaveBeenCalledWith("t1", "o1", "pi_1");
    expect(d.finishEvent).toHaveBeenCalledWith("evt_1");
  });

  it("does nothing for an event it has already finished", async () => {
    const d = deps({ claimEvent: vi.fn().mockResolvedValue(false) });
    expect(await processStripeEvent(event("checkout.session.completed", session()), d)).toBe("duplicate");
    expect(d.markPaid).not.toHaveBeenCalled();
  });

  it("does not mark an order paid twice", async () => {
    const d = deps({ getOrder: vi.fn().mockResolvedValue({ status: "PAID", totalCents: 2500, stripeCheckoutSessionId: "cs_1" }) });
    expect(await processStripeEvent(event("checkout.session.completed", session()), d)).toBe("ignored");
    expect(d.markPaid).not.toHaveBeenCalled();
  });

  it("ignores a session that isn't paid yet", async () => {
    const d = deps();
    expect(await processStripeEvent(event("checkout.session.completed", session({ payment_status: "unpaid" })), d)).toBe("ignored");
    expect(d.markPaid).not.toHaveBeenCalled();
  });

  it("rejects a payment for a different amount", async () => {
    const d = deps();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await processStripeEvent(event("checkout.session.completed", session({ amount_total: 100 })), d)).toBe("rejected");
    expect(d.markPaid).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("rejects a payment from a different session than the one we created", async () => {
    const d = deps();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await processStripeEvent(event("checkout.session.completed", session({ id: "cs_other" })), d)).toBe("rejected");
    expect(d.markPaid).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("ignores sessions that aren't ours", async () => {
    const d = deps();
    expect(await processStripeEvent(event("checkout.session.completed", session({ metadata: {} })), d)).toBe("ignored");
    expect(d.getOrder).not.toHaveBeenCalled();
  });

  it("cancels the unpaid order when the session expires", async () => {
    const d = deps();
    expect(await processStripeEvent(event("checkout.session.expired", session({ payment_status: "unpaid" })), d)).toBe("cancelled");
    expect(d.cancelUnpaid).toHaveBeenCalledWith("t1", "o1");
  });

  it("ignores other event types", async () => {
    const d = deps();
    expect(await processStripeEvent(event("charge.refunded", {}), d)).toBe("ignored");
    expect(d.finishEvent).toHaveBeenCalled();
  });

  it("leaves the event unfinished if processing fails, so Stripe retries it", async () => {
    const d = deps({ markPaid: vi.fn().mockRejectedValue(new Error("db down")) });
    await expect(processStripeEvent(event("checkout.session.completed", session()), d)).rejects.toThrow("db down");
    expect(d.finishEvent).not.toHaveBeenCalled();
  });
});
