import { z } from "zod";

// Top-level paths a truck slug can't take, since /<slug> is the storefront.
export const RESERVED_SLUGS = new Set(["dashboard", "sign-in", "sign-up", "api", "order", "admin", "settings", "help", "about"]);

/** The rules for a storefront address, shared by onboarding and Settings. */
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/, "Use 3–40 lowercase letters, numbers, and dashes.")
  .refine((s) => !RESERVED_SLUGS.has(s), "That address is reserved. Try another.");
