// Imported first by scripts run outside Next.js (seed), so .env.local is loaded
// before lib/db.ts creates the Prisma client.
import { config } from "dotenv";

config({ path: ".env.local" });
