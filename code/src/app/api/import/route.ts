import { NextResponse } from "next/server";
import db from "@/db";

export async function POST(req: Request) {
  const body = await req.json();
  const { data } = body;
  if (!data || typeof data !== "object") {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const counts: Record<string, number> = {};
  for (const [table, rows] of Object.entries(data)) {
    if (!Array.isArray(rows)) continue;
    const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
    if (cols.length === 0) continue;
    const placeholders = cols.map(() => "?").join(", ");
    const stmt = db.prepare(`INSERT OR REPLACE INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`);
    let count = 0;
    for (const row of rows) {
      try {
        stmt.run(...cols.map(c => (row as any)[c] ?? null));
        count++;
      } catch {
        // skip bad rows
      }
    }
    counts[table] = count;
  }

  return NextResponse.json({ ok: true, counts });
}
