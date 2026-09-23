import { db } from "@/lib/db";
import { answerRecords } from "@/db/schema";
import { eq, gte, and } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get("days") || "30");
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split("T")[0];
    const rows = db.select().from(answerRecords).where(and(
      eq(answerRecords.isFirstAttempt, true),
      gte(answerRecords.answeredAt, sinceStr)
    )).all();
    const map: Record<string, { total: number; correct: number }> = {};
    for (const r of rows) {
      const d = r.answeredAt.split("T")[0];
      if (!map[d]) map[d] = { total: 0, correct: 0 };
      map[d].total++;
      if (r.isCorrect) map[d].correct++;
    }
    const result = Object.entries(map).map(([date, v]) => ({ date, accuracy: v.total > 0 ? v.correct / v.total : 0 }));
    return successResponse(result);
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
