// Serves a dish photo. Public: menu photos are visible to anyone who can see
// the storefront, and the customer fetching one has no session.

import { getDishPhoto } from "@/lib/tenant";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photo = await getDishPhoto(id);
  if (!photo) return new Response("Not found", { status: 404 });

  return new Response(photo.bytes, {
    headers: {
      "Content-Type": photo.contentType,
      "Content-Length": String(photo.bytes.byteLength),
      // A replaced photo gets a new id, so this URL's bytes never change.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
