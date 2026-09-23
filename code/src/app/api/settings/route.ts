import { NextResponse } from "next/server";
import db from "@/db";

export async function GET() {
  const row = db.prepare("SELECT * FROM settings WHERE id = 1").get() as any;
  return NextResponse.json(row || {});
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const sets: string[] = [];
  const vals: any[] = [];
  for (const [k, v] of Object.entries(body)) {
    const col = k.replace(/[A-Z]/g, m => "_" + m.toLowerCase());
    sets.push(`${col} = ?`);
    vals.push(v);
  }
  if (sets.length === 0) return NextResponse.json({ ok: true });
  vals.push(1);
  db.prepare(`UPDATE settings SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  return NextResponse.json({ ok: true });
}
