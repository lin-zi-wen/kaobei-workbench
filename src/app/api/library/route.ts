import { db } from "@/lib/db";
import { knowledgeItems } from "@/db/schema";
import { eq, like, and, sql } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || "1");
    const pageSize = Number(searchParams.get("pageSize") || "20");
    const category = searchParams.get("category");
    const subjectId = searchParams.get("subject_id");
    const keyword = searchParams.get("keyword");
    const sourceType = searchParams.get("source_type");

    let query = db.select().from(knowledgeItems) as any;
    const conditions = [];
    if (category) conditions.push(eq(knowledgeItems.category, category));
    if (subjectId) conditions.push(eq(knowledgeItems.subjectId, Number(subjectId)));
    if (sourceType) conditions.push(eq(knowledgeItems.sourceType, sourceType));
    if (keyword) {
      conditions.push(
        sql`(${knowledgeItems.title} LIKE ${"%" + keyword + "%"} OR ${knowledgeItems.contentText} LIKE ${"%" + keyword + "%"})`
      );
    }
    if (conditions.length > 0) query = query.where(and(...conditions));

    const allRows = query.all();
    const total = allRows.length;
    const rows = allRows.slice((page - 1) * pageSize, page * pageSize);
    return successResponse({ rows, total, page, pageSize });
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
