import { neon } from "@neondatabase/serverless";
import type { Query } from "./garden-store";
export function database(): Query {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured. See README.md.");
  const sql = neon(url);
  return async (statement, params = []) =>
    (await sql.query(statement, params)) as Record<string, unknown>[];
}
