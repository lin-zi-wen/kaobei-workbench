import { NextResponse } from "next/server";
import db from "@/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subjectId");
  const type = searchParams.get("type");
  const source = searchParams.get("source");
  let sql = "SELECT * FROM questions WHERE is_deleted = 0";
  const params: any[] = [];
  if (subjectId) { sql += " AND subject_id = ?"; params.push(subjectId); }
  if (type) { sql += " AND type = ?"; params.push(type); }
  if (source) { sql += " AND source = ?"; params.push(source); }
  sql += " ORDER BY id DESC";
  const rows = db.prepare(sql).all(...params) as any[];
  return NextResponse.json({ questions: rows });
}
