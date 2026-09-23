import { db } from "@/lib/db";
import { mistakeRecords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { successResponse, errorResponse, validationError } from "@/lib/utils";

const schema = z.object({ errorTag: z.enum(["concept_confusion","calculation_error","misreading","memory_lapse","other"]) });

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { errorTag } = schema.parse(body);
    db.update(mistakeRecords).set({ errorTag }).where(eq(mistakeRecords.id, Number(id))).run();
    return successResponse({ updated: true });
  } catch (e: any) {
    if (e instanceof z.ZodError) return validationError(e);
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
