import { db } from "@/lib/db";
import { knowledgePoints } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { successResponse, errorResponse, validationError } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const chapterId = searchParams.get("chapter_id");
  let query = db.select().from(knowledgePoints);
  if (chapterId) {
    query = query.where(eq(knowledgePoints.chapterId, Number(chapterId))) as any;
  }
  return successResponse(query.all());
}

const createSchema = z.object({
  chapterId: z.number().int(),
  name: z.string().min(1),
  sortOrder: z.number().int().default(0),
  description: z.string().nullable().optional(),
  difficulty: z.number().int().min(1).max(5).default(3),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const result = db.insert(knowledgePoints).values(data).returning().get();
    return successResponse(result);
  } catch (e: any) {
    if (e instanceof z.ZodError) return validationError(e);
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
