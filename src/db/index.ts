import Database from "better-sqlite3";
import path from "path";

const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), "data", "app.db");

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

export default db;
