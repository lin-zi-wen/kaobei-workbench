import { db } from "@/lib/db";
import { notes } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { successResponse, errorResponse, validationError } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subject_id");
    const tag = searchParams.get("tag");
    let query = db.select().from(notes) as any;
    const conditions = [];
    if (subjectId) conditions.push(eq(notes.subjectId, Number(subjectId)));
    if (tag) conditions.push(sql`${notes.tagList} LIKE ${"%" + tag + "%"}`);
    if (conditions.length > 0) query = query.where(and(...conditions));
    const rows = query.orderBy(notes.isPinned).all();
    return successResponse(rows);
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  subjectId: z.number().int().nullable().optional(),
  knowledgePointIds: z.string().nullable().optional(),
  mistakeRecordIds: z.string().nullable().optional(),
  tagList: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const now = new Date().toISOString();
    const result = db.insert(notes).values({ ...data, createdAt: now, updatedAt: now }).returning().get();
    return successResponse(result);
  } catch (e: any) {
    if (e instanceof z.ZodError) return validationError(e);
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
