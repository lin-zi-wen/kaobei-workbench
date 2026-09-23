import { db } from "@/lib/db";
import { tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse, getTodayISO } from "@/lib/utils";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const row = db.select().from(tasks).where(eq(tasks.id, Number(id))).get();
    if (!row) return errorResponse("NOT_FOUND", "任务不存在", undefined, 404);
    if (row.status !== "done") return errorResponse("CONFLICT", "任务未完成", undefined, 409);
    const completedDate = row.completedAt ? row.completedAt.split("T")[0] : null;
    if (completedDate !== getTodayISO()) {
      return errorResponse("CONFLICT", "只能撤销当日完成的任务", undefined, 409);
    }
    db.update(tasks).set({ status: "todo", completedAt: null }).where(eq(tasks.id, Number(id))).run();
    return successResponse({ undone: true });
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
