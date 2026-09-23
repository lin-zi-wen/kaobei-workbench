import { db } from "@/lib/db";
import { mistakeRecords } from "@/db/schema";
import { z } from "zod";
import { successResponse, errorResponse, validationError, getTodayISO } from "@/lib/utils";

const schema = z.object({
  questionId: z.number().int(),
  errorTag: z.enum(["concept_confusion","calculation_error","misreading","memory_lapse","other"]).default("other"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { questionId, errorTag } = schema.parse(body);
    const result = db.insert(mistakeRecords).values({
      questionId,
      errorTag,
      isManuallyAdded: true,
      status: "unmastered",
      sm2Stage: 0,
      nextReviewDate: getTodayISO(),
    }).returning().get();
    return successResponse(result);
  } catch (e: any) {
    if (e instanceof z.ZodError) return validationError(e);
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
