import { db } from "@/lib/db";
import { mockExamRecords } from "@/db/schema";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { successResponse, errorResponse, validationError } from "@/lib/utils";

export async function GET() {
  try {
    const rows = db.select().from(mockExamRecords).orderBy(desc(mockExamRecords.examDate)).all();
    return successResponse(rows);
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}

const createSchema = z.object({
  subjectId: z.number().int().nullable().optional(),
  name: z.string().min(1),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  score: z.number().int().min(0),
  fullScore: z.number().int().min(1),
  timeSpentMinutes: z.number().int().nullable().optional(),
  questionCount: z.number().int().min(1),
  correctCount: z.number().int().nullable().optional(),
  note: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    if (data.score > data.fullScore) {
      return errorResponse("SCORE_EXCEEDS_FULL", "得分不能超满分", undefined, 409);
    }
    const result = db.insert(mockExamRecords).values(data as any).returning().get();
    return successResponse(result);
  } catch (e: any) {
    if (e instanceof z.ZodError) return validationError(e);
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
