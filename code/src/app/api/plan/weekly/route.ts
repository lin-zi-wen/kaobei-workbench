import { db } from "@/lib/db";
import { tasks } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/utils";

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
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const [mon, sun] = getWeekRange(date);
    const rows = db.select().from(tasks).where(and(gte(tasks.planDate, mon), lte(tasks.planDate, sun))).all();
    return successResponse({ start: mon, end: sun, tasks: rows });
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
