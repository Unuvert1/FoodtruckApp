import { describe, expect, it } from "vitest";
import { inviteExpiry, inviteState, isWellFormedToken, newInviteToken, normalizeEmail } from "@/lib/invites";

const now = new Date("2026-10-20T12:00:00Z");
const base = { acceptedAt: null, revokedAt: null, expiresAt: new Date("2026-10-21T12:00:00Z") };

describe("inviteState", () => {
  it("is valid before expiry", () => expect(inviteState(base, now)).toBe("valid"));
  it("is expired at the expiry instant", () => expect(inviteState({ ...base, expiresAt: now }, now)).toBe("expired"));
  it("is accepted once used", () => expect(inviteState({ ...base, acceptedAt: now }, now)).toBe("accepted"));
  it("is revoked even if also expired or accepted", () => {
    expect(inviteState({ ...base, revokedAt: now, expiresAt: now }, now)).toBe("revoked");
    expect(inviteState({ ...base, revokedAt: now, acceptedAt: now }, now)).toBe("revoked");
  });
});

describe("tokens", () => {
  it("generates well-formed, unique tokens", () => {
    const a = newInviteToken();
    expect(isWellFormedToken(a)).toBe(true);
    expect(a).not.toBe(newInviteToken());
  });
  it("rejects malformed tokens", () => {
    expect(isWellFormedToken("")).toBe(false);
    expect(isWellFormedToken("short")).toBe(false);
    expect(isWellFormedToken(`${newInviteToken()}x`)).toBe(false);
  });
  it("expires in 7 days", () => expect(inviteExpiry(now).toISOString()).toBe("2026-10-27T12:00:00.000Z"));
  it("normalizes emails", () => expect(normalizeEmail("  Sam@Truck.COM ")).toBe("sam@truck.com"));
});
