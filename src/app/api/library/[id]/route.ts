import { db } from "@/lib/db";
import { knowledgeItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { successResponse, errorResponse, validationError } from "@/lib/utils";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const row = db.select().from(knowledgeItems).where(eq(knowledgeItems.id, Number(id))).get();
    if (!row) return errorResponse("NOT_FOUND", "条目不存在", undefined, 404);
    return successResponse(row);
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  category: z.string().optional(),
  subjectId: z.number().int().nullable().optional(),
  chapterId: z.number().int().nullable().optional(),
  status: z.enum(["pending","parsed","archived","failed"]).optional(),
}).passthrough();

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);
    db.update(knowledgeItems).set(data as any).where(eq(knowledgeItems.id, Number(id))).run();
    const row = db.select().from(knowledgeItems).where(eq(knowledgeItems.id, Number(id))).get();
    if (!row) return errorResponse("NOT_FOUND", "条目不存在", undefined, 404);
    return successResponse(row);
  } catch (e: any) {
    if (e instanceof z.ZodError) return validationError(e);
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    db.delete(knowledgeItems).where(eq(knowledgeItems.id, Number(id))).run();
    return successResponse({ deleted: true });
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
