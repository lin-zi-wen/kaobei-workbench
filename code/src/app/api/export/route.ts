import { NextResponse } from "next/server";
import db from "@/db";

const TABLES = [
  "exam_config", "subjects", "chapters", "knowledge_points",
  "tasks", "knowledge_items", "questions", "answer_records",
  "mistake_records", "notes", "study_records", "mock_exam_records",
  "study_reports", "ai_sessions", "ai_messages", "badges", "user_badges",
  "settings", "file_assets", "overdue_scan_logs"
];

export async function GET() {
  const data: Record<string, any[]> = {};
  for (const t of TABLES) {
    try {
      data[t] = db.prepare(`SELECT * FROM ${t}`).all() as any[];
    } catch {
      data[t] = [];
    }
  }
  return NextResponse.json({ exportedAt: new Date().toISOString(), data });
}
