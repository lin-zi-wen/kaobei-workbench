import { db } from "@/lib/db";
import { notes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { successResponse, errorResponse, validationError, parseJsonArray } from "@/lib/utils";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const row = db.select().from(notes).where(eq(notes.id, Number(id))).get();
    if (!row) return errorResponse("NOT_FOUND", "笔记不存在", undefined, 404);
    const kpIds = parseJsonArray(row.knowledgePointIds);
    const mrIds = parseJsonArray(row.mistakeRecordIds);
    if (body.knowledgePointId && !kpIds.includes(body.knowledgePointId)) kpIds.push(body.knowledgePointId);
    if (body.mistakeRecordId && !mrIds.includes(body.mistakeRecordId)) mrIds.push(body.mistakeRecordId);
    db.update(notes).set({
      knowledgePointIds: JSON.stringify(kpIds),
      mistakeRecordIds: JSON.stringify(mrIds),
    }).where(eq(notes.id, Number(id))).run();
    return successResponse({ linked: true });
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const row = db.select().from(notes).where(eq(notes.id, Number(id))).get();
    if (!row) return errorResponse("NOT_FOUND", "笔记不存在", undefined, 404);
    let kpIds = parseJsonArray(row.knowledgePointIds);
    let mrIds = parseJsonArray(row.mistakeRecordIds);
    if (body.knowledgePointId) kpIds = kpIds.filter((x: number) => x !== body.knowledgePointId);
    if (body.mistakeRecordId) mrIds = mrIds.filter((x: number) => x !== body.mistakeRecordId);
    db.update(notes).set({
      knowledgePointIds: JSON.stringify(kpIds),
      mistakeRecordIds: JSON.stringify(mrIds),
    }).where(eq(notes.id, Number(id))).run();
    return successResponse({ unlinked: true });
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
