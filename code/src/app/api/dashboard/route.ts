import { db } from "@/lib/db";
import { tasks, mistakeRecords, studyRecords, examConfig } from "@/db/schema";
import { eq, and, gte, lte, inArray, sql } from "drizzle-orm";
import { successResponse, errorResponse, getTodayISO } from "@/lib/utils";

export async function GET() {
  try {
    const today = getTodayISO();
    const todayTasks = db.select().from(tasks).where(eq(tasks.planDate, today)).all();
    const reviewQueue = db.select().from(mistakeRecords).where(and(
      inArray(mistakeRecords.status, ["unmastered", "reviewing"]),
      lte(mistakeRecords.nextReviewDate, today)
    )).all();

    // Check-in: at least one focus session >= 25min today
    const focusToday = db.select().from(studyRecords).where(and(
      eq(studyRecords.recordDate, today),
      eq(studyRecords.recordType, "focus")
    )).all();
    const checkIn = focusToday.some(r => (r.durationSeconds || 0) >= 25 * 60);

    // Heatmap: last 84 days
    const heatmapRows = db.select().from(studyRecords).where(and(
      eq(studyRecords.recordType, "focus"),
      gte(studyRecords.recordDate, sql`date(${today}, '-83 days')`)
    )).all();
    const heatmapMap: Record<string, number> = {};
    for (const r of heatmapRows) {
      heatmapMap[r.recordDate] = (heatmapMap[r.recordDate] || 0) + (r.durationSeconds || 0);
    }

    // Streak
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today + "T00:00:00");
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      const dayFocus = db.select().from(studyRecords).where(and(
        eq(studyRecords.recordDate, ds),
        eq(studyRecords.recordType, "focus")
      )).all();
      const dayCheckIn = dayFocus.some(r => (r.durationSeconds || 0) >= 25 * 60);
      if (dayCheckIn) streak++;
      else if (i > 0) break;
    }

    const cfg = db.select().from(examConfig).all()[0];
    const examDate = cfg?.examDate;
    let daysUntilExam: number | null = null;
    if (examDate) {
      daysUntilExam = Math.ceil((new Date(examDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
    }

    return successResponse({
      today: { date: today, tasks: todayTasks, reviewQueueCount: reviewQueue.length, checkIn },
      streak,
      daysUntilExam,
      heatmap: heatmapMap,
    });
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
