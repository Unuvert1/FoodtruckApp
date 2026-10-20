// Team-invite rules that need no database, so they can be tested alone.
// The token in the link is the only secret: 256 random bits, never derived
// from anything guessable.

import { randomBytes } from "node:crypto";

export const INVITE_TTL_DAYS = 7;

export const newInviteToken = () => randomBytes(32).toString("base64url");

/** Rejects junk before it reaches the database. */
export const isWellFormedToken = (token: string) => /^[A-Za-z0-9_-]{43}$/.test(token);

export const inviteExpiry = (now: Date) => new Date(now.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

/** Emails are compared lower-cased and trimmed everywhere. */
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export type InviteState = "valid" | "expired" | "accepted" | "revoked";

/** Revoked beats accepted beats expired: the most final reason is the one shown. */
export function inviteState(
  invite: { acceptedAt: Date | null; revokedAt: Date | null; expiresAt: Date },
  now: Date
): InviteState {
  if (invite.revokedAt) return "revoked";
  if (invite.acceptedAt) return "accepted";
  if (invite.expiresAt.getTime() <= now.getTime()) return "expired";
  return "valid";
}
