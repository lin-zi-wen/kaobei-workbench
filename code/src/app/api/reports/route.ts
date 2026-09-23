import { NextResponse } from "next/server";
import db from "@/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "weekly";
  const rows = db.prepare("SELECT * FROM study_reports WHERE report_type = ? ORDER BY period_start DESC LIMIT 12").all(type) as any[];
  return NextResponse.json({ reports: rows });
}
