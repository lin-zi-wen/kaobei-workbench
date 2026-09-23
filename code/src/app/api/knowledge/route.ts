import { NextResponse } from "next/server";
import db from "@/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q");
  const subjectId = searchParams.get("subjectId");
  let sql = "SELECT ki.*, s.name as subjectName FROM knowledge_items ki LEFT JOIN subjects s ON ki.subject_id = s.id WHERE 1=1";
  const params: any[] = [];
  if (category) { sql += " AND ki.category = ?"; params.push(category); }
  if (subjectId) { sql += " AND ki.subject_id = ?"; params.push(subjectId); }
  if (q) { sql += " AND (ki.title LIKE ? OR ki.content_text LIKE ?)"; params.push(`%${q}%`, `%${q}%`); }
  sql += " ORDER BY ki.created_at DESC";
  const rows = db.prepare(sql).all(...params) as any[];
  return NextResponse.json({ items: rows });
}
