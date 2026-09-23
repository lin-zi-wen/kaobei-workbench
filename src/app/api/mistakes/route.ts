import { db } from "@/lib/db";
import { mistakeRecords, questions } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const subjectId = searchParams.get("subject_id");
    const errorTag = searchParams.get("error_tag");
    let query = db.select().from(mistakeRecords) as any;
    const conditions = [];
    if (status) conditions.push(eq(mistakeRecords.status, status));
    if (errorTag) conditions.push(eq(mistakeRecords.errorTag, errorTag));
    if (conditions.length > 0) query = query.where(and(...conditions));
    const rows = query.all();
    const enriched = rows.map((r: any) => {
      const q = db.select().from(questions).where(eq(questions.id, r.questionId)).get();
      return { ...r, question: q || null };
    });
    return successResponse(enriched);
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
