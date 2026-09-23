import { db } from "@/lib/db";
import { studyReports } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/utils";

export async function GET(_req: Request, { params }: { params: Promise<{ period: string }> }) {
  try {
    const { period } = await params;
    const row = db.select().from(studyReports).where(and(
      eq(studyReports.reportType, "weekly"),
      eq(studyReports.periodStart, period)
    )).get();
    if (!row) return errorResponse("NOT_FOUND", "周报不存在", undefined, 404);
    return successResponse(row);
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
