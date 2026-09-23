import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "app.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// Run migrations first
const migrationSql = fs.readFileSync(
  path.join(process.cwd(), "src", "db", "migrations", "0000_initial.sql"),
  "utf-8"
);
const statements = migrationSql.split(";").map(s => s.trim()).filter(s => s.length > 0);
for (const stmt of statements) {
  db.exec(stmt + ";");
}
console.log("[seed] Migrations applied.");

// Load seed data
const seedData = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "src", "scripts", "seed-data.json"), "utf-8")
);

function insertMany(table: string, rows: any[]) {
  if (rows.length === 0) return 0;
  const cols = Object.keys(rows[0]);
  const colStr = cols.join(", ");
  const placeholders = cols.map(() => "?").join(", ");
  const stmt = db.prepare(`INSERT INTO ${table} (${colStr}) VALUES (${placeholders})`);
  let count = 0;
  for (const row of rows) {
    const values = cols.map(c => {
      const v = row[c];
      if (v === undefined || v === null) return null;
      if (typeof v === "boolean") return v ? 1 : 0;
      if (typeof v === "number") return v;
      return String(v);
    });
    stmt.run(values);
    count++;
  }
  return count;
}

const counts: Record<string, number> = {};

// Insert in dependency order
counts.exam_config = insertMany("exam_config", seedData.exam_config ?? []);
counts.subjects = insertMany("subjects", seedData.subjects ?? []);
counts.chapters = insertMany("chapters", seedData.chapters ?? []);
counts.knowledge_points = insertMany("knowledge_points", seedData.knowledge_points ?? []);
counts.knowledge_items = insertMany("knowledge_items", seedData.knowledge_items ?? []);
counts.questions = insertMany("questions", seedData.questions ?? []);
counts.answer_records = insertMany("answer_records", seedData.answer_records ?? []);
counts.mistake_records = insertMany("mistake_records", seedData.mistake_records ?? []);
counts.notes = insertMany("notes", seedData.notes ?? []);
counts.study_records = insertMany("study_records", seedData.study_records ?? []);
counts.mock_exam_records = insertMany("mock_exam_records", seedData.mock_exam_records ?? []);
counts.study_reports = insertMany("study_reports", seedData.study_reports ?? []);
counts.ai_sessions = insertMany("ai_sessions", seedData.ai_sessions ?? []);
counts.ai_messages = insertMany("ai_messages", seedData.ai_messages ?? []);
counts.badges = insertMany("badges", seedData.badges ?? []);
counts.user_badges = insertMany("user_badges", seedData.user_badges ?? []);
counts.settings = insertMany("settings", seedData.settings ?? []);
counts.file_assets = insertMany("file_assets", seedData.file_assets ?? []);
counts.overdue_scan_logs = insertMany("overdue_scan_logs", seedData.overdue_scan_logs ?? []);

console.log("\n[seed] Insert counts:");
for (const [table, count] of Object.entries(counts)) {
  console.log(`  ${table}: ${count}`);
}

// Verification queries
const kiCount = (db.prepare("SELECT COUNT(*) as c FROM knowledge_items").get() as any).c;
const pastExamCount = (db.prepare("SELECT COUNT(*) as c FROM knowledge_items WHERE category = 'past_exam'").get() as any).c;
const damagedCount = (db.prepare("SELECT COUNT(*) as c FROM knowledge_items WHERE status = 'failed'").get() as any).c;
const subjectCount = (db.prepare("SELECT COUNT(*) as c FROM subjects").get() as any).c;
const badgeCount = (db.prepare("SELECT COUNT(*) as c FROM badges").get() as any).c;

console.log("\n[seed] Verification:");
console.log(`  knowledge_items total: ${kiCount} (expected: 138)`);
console.log(`  past_exam items: ${pastExamCount} (expected: 17+52=69, trimmed to ~68)`);
console.log(`  damaged items: ${damagedCount} (expected: 1)`);
console.log(`  subjects: ${subjectCount} (expected: 3)`);
console.log(`  badges: ${badgeCount} (expected: 7)`);

const passed = kiCount === 138 && damagedCount === 1 && subjectCount === 3;
console.log(`\n[seed] ${passed ? "PASSED" : "FAILED"}`);

db.close();
process.exit(passed ? 0 : 1);
