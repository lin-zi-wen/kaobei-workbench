import Database from "better-sqlite3";
import path from "path";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/db/schema";

const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), "data", "app.db");
export const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
export { schema };
