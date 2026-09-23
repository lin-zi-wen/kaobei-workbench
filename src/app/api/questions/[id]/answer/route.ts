import { db } from "@/lib/db";
import { questions, answerRecords, mistakeRecords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { successResponse, errorResponse, validationError, getTodayISO, nowISO } from "@/lib/utils";

const schema = z.object({
  answer: z.string().min(1),
  timeSpentSeconds: z.number().int().default(0),
  source: z.enum(["practice","mock_exam","review"]).default("practice"),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { answer, timeSpentSeconds, source } = schema.parse(body);
    const q = db.select().from(questions).where(eq(questions.id, Number(id))).get();
    if (!q) return errorResponse("NOT_FOUND", "题目不存在", undefined, 404);

    const isObjective = ["single_choice","multiple_choice","true_false"].includes(q.type);
    let isCorrect: boolean | null = null;
    if (isObjective) {
      isCorrect = answer.trim().toUpperCase() === q.answer.trim().toUpperCase();
    }

    const now = nowISO();
    const firstAttempt = db.select().from(answerRecords).where(eq(answerRecords.questionId, Number(id))).all().length === 0;
    const record = db.insert(answerRecords).values({
      questionId: Number(id), answerGiven: answer, isCorrect,
      timeSpentSeconds, answeredAt: now, source,
      isFirstAttempt: firstAttempt,
    }).returning().get();

    // Auto add to mistake book if wrong
    if (isCorrect === false) {
      const existing = db.select().from(mistakeRecords).where(eq(mistakeRecords.questionId, Number(id))).get();
      if (existing) {
        db.update(mistakeRecords).set({
          wrongCount: (existing.wrongCount || 0) + 1,
          status: "unmastered",
          sm2Stage: 1,
          nextReviewDate: getTodayISO(),
          lastReviewedAt: now,
        }).where(eq(mistakeRecords.id, existing.id)).run();
      } else {
        db.insert(mistakeRecords).values({
          questionId: Number(id),
          firstWrongAnswerRecordId: record.id,
          wrongCount: 1,
          status: "unmastered",
          sm2Stage: 0,
          nextReviewDate: getTodayISO(),
          lastReviewedAt: now,
        }).run();
      }
    }

    return successResponse({ record, isCorrect, correctAnswer: q.answer });
  } catch (e: any) {
    if (e instanceof z.ZodError) return validationError(e);
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
