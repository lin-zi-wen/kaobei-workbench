import { sqlite } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/utils";

export async function POST() {
  try {
    const tables = [
      "exam_config","subjects","chapters","knowledge_points","tasks",
      "knowledge_items","knowledge_items_fts","questions","answer_records",
      "mistake_records","notes","study_records","mock_exam_records",
      "study_reports","ai_sessions","ai_messages","badges","user_badges",
      "settings","file_assets","overdue_scan_logs"
    ];
    for (const t of tables) {
      try { sqlite.exec(`DELETE FROM ${t}`); } catch {}
    }
    return successResponse({ cleared: true });
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
