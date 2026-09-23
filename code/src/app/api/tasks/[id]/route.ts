import { db } from "@/lib/db";
import { tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { successResponse, errorResponse, validationError } from "@/lib/utils";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  subjectId: z.number().int().nullable().optional(),
  knowledgePointIds: z.string().nullable().optional(),
  planDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  estimatedMinutes: z.number().int().nullable().optional(),
  status: z.enum(["todo","in_progress","done","skipped","overdue"]).optional(),
  note: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
}).passthrough();

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);
    db.update(tasks).set(data as any).where(eq(tasks.id, Number(id))).run();
    const row = db.select().from(tasks).where(eq(tasks.id, Number(id))).get();
    if (!row) return errorResponse("NOT_FOUND", "任务不存在", undefined, 404);
    return successResponse(row);
  } catch (e: any) {
    if (e instanceof z.ZodError) return validationError(e);
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    db.delete(tasks).where(eq(tasks.id, Number(id))).run();
    return successResponse({ deleted: true });
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
