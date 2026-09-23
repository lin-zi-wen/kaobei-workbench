import { db } from "@/lib/db";
import { subjects, chapters } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { successResponse, errorResponse, validationError } from "@/lib/utils";

export async function GET() {
  const subs = db.select().from(subjects).all();
  const chaps = db.select().from(chapters).all();
  const tree = subs.map(s => ({
    ...s,
    chapters: chaps.filter(c => c.subjectId === s.id),
  }));
  return successResponse(tree);
}

const createSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  sortOrder: z.number().int().default(0),
  examConfigId: z.number().int(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const result = db.insert(subjects).values(data).returning().get();
    return successResponse(result);
  } catch (e: any) {
    if (e instanceof z.ZodError) return validationError(e);
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
