import { db } from "@/lib/db";
import { tasks } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { successResponse, errorResponse, validationError, getTodayISO } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const subjectId = searchParams.get("subject_id");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = db.select().from(tasks) as any;
  const conditions = [];
  if (status) conditions.push(eq(tasks.status, status));
  if (subjectId) conditions.push(eq(tasks.subjectId, Number(subjectId)));
  if (from) conditions.push(gte(tasks.planDate, from));
  if (to) conditions.push(lte(tasks.planDate, to));
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  return successResponse(query.all());
}

const createSchema = z.object({
  title: z.string().min(1),
  subjectId: z.number().int().nullable().optional(),
  knowledgePointIds: z.string().nullable().optional(),
  planDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  estimatedMinutes: z.number().int().nullable().optional(),
  status: z.enum(["todo","in_progress","done","skipped","overdue"]).default("todo"),
  note: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const result = db.insert(tasks).values(data as any).returning().get();
    return successResponse(result);
  } catch (e: any) {
    if (e instanceof z.ZodError) return validationError(e);
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
