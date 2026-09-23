import { db } from "@/lib/db";
import { mockExamRecords, answerRecords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse, nowISO } from "@/lib/utils";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const answers = body.answers || [];
    let correct = 0;
    for (const a of answers) {
      if (a.isCorrect) correct++;
      db.insert(answerRecords).values({
        questionId: a.questionId,
        answerGiven: a.answer,
        isCorrect: a.isCorrect,
        answeredAt: nowISO(),
        source: "mock_exam",
        mockExamRecordId: Number(id),
      }).run();
    }
    db.update(mockExamRecords).set({ correctCount: correct }).where(eq(mockExamRecords.id, Number(id))).run();
    return successResponse({ submitted: true, correctCount: correct });
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
