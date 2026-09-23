import { NextResponse } from "next/server";
import db from "@/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subjectId");
  let sql = "SELECT * FROM notes WHERE 1=1";
  const params: any[] = [];
  if (subjectId) { sql += " AND subject_id = ?"; params.push(subjectId); }
  sql += " ORDER BY is_pinned DESC, updated_at DESC";
  const rows = db.prepare(sql).all(...params) as any[];
  return NextResponse.json({ notes: rows });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, content, subjectId, tagList } = body;
  const result = db.prepare(`
    INSERT INTO notes (title, content, subject_id, tag_list, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(title, content, subjectId || null, tagList || null, Date.now(), Date.now());
  return NextResponse.json({ id: result.lastInsertRowid });
}
