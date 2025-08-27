import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;



export const pool = new Pool({ connectionString: "postgresql://postgres.jfhfryiyfqrytbtzsdtj:sourav@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true" });
export const db = drizzle({ client: pool, schema });