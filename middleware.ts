// Clerk session handling for every request. Access control lives in the pages
// and actions themselves (requireTruckAccess() in lib/tenant.ts), which is
// what Clerk recommends over path matching in middleware.
// TODO(later): subdomain / custom domain → truck slug rewrite goes here too.
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
