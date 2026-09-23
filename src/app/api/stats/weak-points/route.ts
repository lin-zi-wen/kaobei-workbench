import { db } from "@/lib/db";
import { answerRecords, questions } from "@/db/schema";
import { eq, gte, and, sql } from "drizzle-orm";
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
    const wrongByKp: Record<string, number> = {};
    for (const r of rows) {
      if (!r.isCorrect) {
        const q = db.select().from(questions).where(eq(questions.id, r.questionId)).get();
        if (q?.knowledgePointIds) {
          try {
            const kpIds = JSON.parse(q.knowledgePointIds);
            for (const kpId of kpIds) {
              wrongByKp[String(kpId)] = (wrongByKp[String(kpId)] || 0) + 1;
            }
          } catch {}
        }
      }
    }
    const sorted = Object.entries(wrongByKp).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([kpId, count]) => ({ kpId: Number(kpId), wrongCount: count }));
    return successResponse(sorted);
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
