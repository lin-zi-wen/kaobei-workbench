import { db } from "@/lib/db";
import { tasks } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { successResponse, errorResponse, getTodayISO } from "@/lib/utils";

function getWeekRange(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diff));
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  return [mon.toISOString().split("T")[0], sun.toISOString().split("T")[0]];
}

export async function GET(req: Request) {
  try {
    const today = getTodayISO();
    const [mon, sun] = getWeekRange(today);
    const rows = db.select().from(tasks).where(and(gte(tasks.planDate, mon), lte(tasks.planDate, sun))).all();
    const done = rows.filter(r => r.status === "done").length;
    const total = rows.length;
    const rate = total > 0 ? done / total : 0;
    const suggestions = [];
    if (rate < 0.5) suggestions.push("本周计划完成率较低，建议减少下周任务量或调整科目配比。");
    if (rows.filter(r => r.status === "overdue").length > 3) suggestions.push("逾期任务较多，建议优先处理积压任务。");
    if (suggestions.length === 0) suggestions.push("本周节奏良好，建议保持当前计划。");
    return successResponse({ completionRate: rate, suggestions });
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
