import { db } from "@/lib/db";
import { questions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { successResponse, errorResponse, validationError } from "@/lib/utils";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const row = db.select().from(questions).where(eq(questions.id, Number(id))).get();
    if (!row) return errorResponse("NOT_FOUND", "题目不存在", undefined, 404);
    return successResponse(row);
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}

const updateSchema = z.object({
  stem: z.string().min(1).optional(),
  optionsJson: z.string().nullable().optional(),
  answer: z.string().min(1).optional(),
  explanation: z.string().nullable().optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  isDeleted: z.boolean().optional(),
}).passthrough();

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);
    db.update(questions).set(data as any).where(eq(questions.id, Number(id))).run();
    const row = db.select().from(questions).where(eq(questions.id, Number(id))).get();
    if (!row) return errorResponse("NOT_FOUND", "题目不存在", undefined, 404);
    return successResponse(row);
  } catch (e: any) {
    if (e instanceof z.ZodError) return validationError(e);
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    db.update(questions).set({ isDeleted: true }).where(eq(questions.id, Number(id))).run();
    return successResponse({ deleted: true });
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
