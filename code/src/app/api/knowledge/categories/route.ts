import { NextResponse } from "next/server";
import db from "@/db";

export async function GET() {
  const rows = db.prepare("SELECT category, COUNT(*) as count FROM knowledge_items GROUP BY category").all() as any[];
  return NextResponse.json({ categories: rows });
}
