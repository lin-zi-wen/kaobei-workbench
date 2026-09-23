import { NextResponse } from "next/server";
import db from "@/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const due = searchParams.get("due");
  let sql = `SELECT mr.*, q.stem as questionStem, q.type as questionType, q.answer as correctAnswer, q.explanation
    FROM mistake_records mr
    JOIN questions q ON mr.question_id = q.id
    WHERE mr.removed_at IS NULL`;
  const params: any[] = [];
  if (status) { sql += " AND mr.status = ?"; params.push(status); }
  if (due === "today") { sql += " AND mr.next_review_date <= date('now')"; }
  sql += " ORDER BY mr.next_review_date ASC";
  const rows = db.prepare(sql).all(...params) as any[];
  return NextResponse.json({ mistakes: rows });
}
