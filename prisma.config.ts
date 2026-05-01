import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Local development: prefer .env.local, then fallback to .env
loadEnv({ path: ".env.local" });
loadEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
