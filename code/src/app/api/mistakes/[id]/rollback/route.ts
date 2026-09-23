import { db } from "@/lib/db";
import { mistakeRecords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse, getTodayISO, addDays } from "@/lib/utils";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const mr = db.select().from(mistakeRecords).where(eq(mistakeRecords.id, Number(id))).get();
    if (!mr) return errorResponse("NOT_FOUND", "错题不存在", undefined, 404);
    db.update(mistakeRecords).set({
      status: "reviewing",
      sm2Stage: 2,
      nextReviewDate: addDays(getTodayISO(), 3),
      consecutiveCorrect: 0,
      removedAt: null,
    }).where(eq(mistakeRecords.id, Number(id))).run();
    return successResponse({ rolledBack: true });
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
