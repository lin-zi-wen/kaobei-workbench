import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), "data", "app.db");
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// Create tables directly using SQL to avoid dependency issues in seed step
const sql = fs.readFileSync(path.join(__dirname, "migrations", "0000_initial.sql"), "utf-8");
const statements = sql.split(";").map(s => s.trim()).filter(s => s.length > 0);

for (const stmt of statements) {
  db.exec(stmt + ";");
}

console.log("Migrations applied successfully.");
db.close();
