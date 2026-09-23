import { db } from "@/lib/db";
import { studyRecords } from "@/db/schema";
import { eq, gte, and } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get("days") || "30");
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split("T")[0];
    const rows = db.select().from(studyRecords).where(and(
      eq(studyRecords.recordType, "focus"),
      gte(studyRecords.recordDate, sinceStr)
    )).all();
    const map: Record<string, number> = {};
    for (const r of rows) {
      map[r.recordDate] = (map[r.recordDate] || 0) + (r.durationSeconds || 0);
    }
    return successResponse(map);
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
