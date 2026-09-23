import { db } from "@/lib/db";
import { notes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { successResponse, errorResponse, validationError } from "@/lib/utils";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const row = db.select().from(notes).where(eq(notes.id, Number(id))).get();
    if (!row) return errorResponse("NOT_FOUND", "笔记不存在", undefined, 404);
    return successResponse(row);
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  subjectId: z.number().int().nullable().optional(),
  knowledgePointIds: z.string().nullable().optional(),
  mistakeRecordIds: z.string().nullable().optional(),
  isPinned: z.boolean().optional(),
  tagList: z.string().nullable().optional(),
}).passthrough();

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);
    db.update(notes).set(data as any).where(eq(notes.id, Number(id))).run();
    const row = db.select().from(notes).where(eq(notes.id, Number(id))).get();
    if (!row) return errorResponse("NOT_FOUND", "笔记不存在", undefined, 404);
    return successResponse(row);
  } catch (e: any) {
    if (e instanceof z.ZodError) return validationError(e);
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    db.delete(notes).where(eq(notes.id, Number(id))).run();
    return successResponse({ deleted: true });
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
