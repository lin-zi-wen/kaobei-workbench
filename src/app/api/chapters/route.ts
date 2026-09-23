import { db } from "@/lib/db";
import { chapters } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { successResponse, errorResponse, validationError } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subject_id");
  let query = db.select().from(chapters);
  if (subjectId) {
    query = query.where(eq(chapters.subjectId, Number(subjectId))) as any;
  }
  return successResponse(query.all());
}

const createSchema = z.object({
  subjectId: z.number().int(),
  parentId: z.number().int().nullable().optional(),
  name: z.string().min(1),
  sortOrder: z.number().int().default(0),
  description: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const result = db.insert(chapters).values(data as any).returning().get();
    return successResponse(result);
  } catch (e: any) {
    if (e instanceof z.ZodError) return validationError(e);
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
