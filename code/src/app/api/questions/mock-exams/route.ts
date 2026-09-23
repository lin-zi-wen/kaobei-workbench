import { NextResponse } from "next/server";
import db from "@/db";

export async function GET() {
  const rows = db.prepare("SELECT * FROM knowledge_items WHERE category = 'past_exam' ORDER BY collected_at DESC").all() as any[];
  return NextResponse.json({ exams: rows });
}
