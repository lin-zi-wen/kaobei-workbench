import { NextResponse } from "next/server";
import db from "@/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const sets: string[] = [];
  const vals: any[] = [];
  for (const [k, v] of Object.entries(body)) {
    const col = k.replace(/[A-Z]/g, m => "_" + m.toLowerCase());
    sets.push(`${col} = ?`);
    vals.push(v);
  }
  vals.push(id);
  db.prepare(`UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
