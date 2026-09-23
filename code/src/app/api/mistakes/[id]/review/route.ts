import { db } from "@/lib/db";
import { mistakeRecords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { successResponse, errorResponse, validationError, getTodayISO, addDays, nowISO } from "@/lib/utils";

const schema = z.object({ feedback: z.enum(["correct","wrong","unsure"]) });
const intervals = [1, 1, 3, 7, 14];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { feedback } = schema.parse(body);
    const mr = db.select().from(mistakeRecords).where(eq(mistakeRecords.id, Number(id))).get();
    if (!mr) return errorResponse("NOT_FOUND", "错题不存在", undefined, 404);

    const today = getTodayISO();
    let update: any = { reviewCount: (mr.reviewCount || 0) + 1, lastReviewedAt: nowISO() };

    if (feedback === "wrong" || feedback === "unsure") {
      update.sm2Stage = 1;
      update.nextReviewDate = addDays(today, 1);
      update.consecutiveCorrect = 0;
      update.status = "unmastered";
    } else {
      const newStage = Math.min((mr.sm2Stage || 0) + 1, 4);
      update.sm2Stage = newStage;
      update.nextReviewDate = addDays(today, intervals[newStage]);
      update.consecutiveCorrect = (mr.consecutiveCorrect || 0) + 1;
      if (update.consecutiveCorrect >= 2) {
        update.status = "mastered";
        update.removedAt = nowISO();
      } else {
        update.status = "reviewing";
      }
    }

    db.update(mistakeRecords).set(update).where(eq(mistakeRecords.id, Number(id))).run();
    return successResponse({ reviewed: true, nextReviewDate: update.nextReviewDate, status: update.status });
  } catch (e: any) {
    if (e instanceof z.ZodError) return validationError(e);
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
