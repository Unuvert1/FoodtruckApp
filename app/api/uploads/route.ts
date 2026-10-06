// Vendor dish-photo upload. The browser downscales and re-encodes the image
// before it gets here (see components/dashboard/photo-field.tsx), so what
// arrives is already small; these checks are the server not trusting that.

import { NextResponse } from "next/server";
import { createDishPhoto, requireTruckAccess } from "@/lib/tenant";

export const runtime = "nodejs";

const MAX_BYTES = 2_000_000;
const MAX_EDGE = 4000;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

export async function POST(request: Request) {
  // Never takes a truckId from the request: the upload lands on the truck the
  // signed-in vendor actually belongs to.
  const { truck } = await requireTruckAccess();

  const form = await request.formData();
  const file = form.get("photo");
  const width = Number(form.get("width"));
  const height = Number(form.get("height"));

  if (!(file instanceof File)) return bad("Choose a photo to upload.");
  if (!ALLOWED_TYPES.has(file.type)) return bad("Use a JPEG, PNG, or WebP image.");
  if (file.size > MAX_BYTES) return bad("That photo is too large. Try one under 2 MB.");

  const sane = (n: number) => Number.isInteger(n) && n > 0 && n <= MAX_EDGE;
  if (!sane(width) || !sane(height)) return bad("That photo couldn't be read. Try a different one.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const url = await createDishPhoto(truck.id, { contentType: file.type, width, height, bytes });
  return NextResponse.json({ url });
}
