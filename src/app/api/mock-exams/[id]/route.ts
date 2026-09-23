import { db } from "@/lib/db";
import { mockExamRecords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/utils";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const row = db.select().from(mockExamRecords).where(eq(mockExamRecords.id, Number(id))).get();
    if (!row) return errorResponse("NOT_FOUND", "模考记录不存在", undefined, 404);
    return successResponse(row);
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
