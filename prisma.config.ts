// Prisma CLI config (migrate, seed, studio). The app itself connects in lib/db.ts.
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js reads .env.local; load the same file for the Prisma CLI.
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct/session connection. Supabase's transaction pooler
    // (DATABASE_URL, port 6543) is for the running app.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
