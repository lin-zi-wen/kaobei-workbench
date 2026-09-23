import { db } from "@/lib/db";
import { questions } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { successResponse, errorResponse, validationError } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subject_id");
    const type = searchParams.get("type");
    const difficulty = searchParams.get("difficulty");
    const keyword = searchParams.get("keyword");
    let query = db.select().from(questions).where(eq(questions.isDeleted, false)) as any;
    const conditions = [eq(questions.isDeleted, false)];
    if (subjectId) conditions.push(eq(questions.subjectId, Number(subjectId)));
    if (type) conditions.push(eq(questions.type, type));
    if (difficulty) conditions.push(eq(questions.difficulty, Number(difficulty)));
    if (keyword) conditions.push(sql`${questions.stem} LIKE ${"%" + keyword + "%"}`);
    if (conditions.length > 0) query = query.where(and(...conditions));
    return successResponse(query.all());
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}

const createSchema = z.object({
  subjectId: z.number().int(),
  type: z.enum(["single_choice","multiple_choice","true_false","fill_blank","essay"]),
  stem: z.string().min(1),
  optionsJson: z.string().nullable().optional(),
  answer: z.string().min(1),
  explanation: z.string().nullable().optional(),
  difficulty: z.number().int().min(1).max(5).default(3),
  source: z.string().nullable().optional(),
  knowledgePointIds: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const result = db.insert(questions).values(data as any).returning().get();
    return successResponse(result);
  } catch (e: any) {
    if (e instanceof z.ZodError) return validationError(e);
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
