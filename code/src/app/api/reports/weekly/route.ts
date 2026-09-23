import { db } from "@/lib/db";
import { studyReports } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/utils";

export async function GET() {
  try {
    const rows = db.select().from(studyReports).where(sql`${studyReports.reportType} = 'weekly'`).orderBy(desc(studyReports.periodStart)).all();
    return successResponse(rows);
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
