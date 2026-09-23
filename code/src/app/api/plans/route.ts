import { NextResponse } from "next/server";
import db from "@/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const status = searchParams.get("status");
  let sql = "SELECT * FROM tasks WHERE 1=1";
  const params: any[] = [];
  if (date) { sql += " AND plan_date = ?"; params.push(date); }
  if (status) { sql += " AND status = ?"; params.push(status); }
  sql += " ORDER BY plan_date DESC, start_time";
  const rows = db.prepare(sql).all(...params) as any[];
  return NextResponse.json({ plans: rows });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, subjectId, planDate, startTime, endTime, estimatedMinutes, note } = body;
  const result = db.prepare(`
    INSERT INTO tasks (title, subject_id, plan_date, start_time, end_time, estimated_minutes, status, note)
    VALUES (?, ?, ?, ?, ?, ?, 'todo', ?)
  `).run(title, subjectId || null, planDate, startTime || null, endTime || null, estimatedMinutes || null, note || null);
  return NextResponse.json({ id: result.lastInsertRowid });
}
