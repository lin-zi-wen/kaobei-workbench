import { db } from "@/lib/db";
import { mistakeRecords, questions } from "@/db/schema";
import { eq, and, lte, inArray } from "drizzle-orm";
import { successResponse, errorResponse, getTodayISO } from "@/lib/utils";

export async function GET() {
  try {
    const today = getTodayISO();
    const rows = db.select().from(mistakeRecords)
      .where(and(
        inArray(mistakeRecords.status, ["unmastered", "reviewing"]),
        lte(mistakeRecords.nextReviewDate, today)
      )).orderBy(mistakeRecords.sm2Stage).all();
    const enriched = rows.map((r: any) => {
      const q = db.select().from(questions).where(eq(questions.id, r.questionId)).get();
      return { ...r, question: q || null };
    });
    return successResponse(enriched);
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
