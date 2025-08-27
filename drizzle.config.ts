import { defineConfig } from "drizzle-kit";


export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://postgres.jfhfryiyfqrytbtzsdtj:sourav@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
  },
});
