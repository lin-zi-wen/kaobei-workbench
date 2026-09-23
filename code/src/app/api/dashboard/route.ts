import { NextResponse } from "next/server";
import db from "@/db";

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const year = new Date().getFullYear();

  // Today's tasks
  const tasksToday = (db.prepare("SELECT * FROM tasks WHERE plan_date = ? ORDER BY start_time").all(today) as any[]).map(row => ({
    ...row,
    status: row.status,
  }));

  // Check-in streak
  const streakRows = db.prepare(`
    SELECT record_date FROM study_records
    WHERE record_type = 'check_in'
    GROUP BY record_date
    ORDER BY record_date DESC
  `).all() as any[];
  let streak = 0;
  if (streakRows.length > 0) {
    const dates = streakRows.map(r => r.record_date);
    const todayDate = new Date(today);
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(todayDate);
      expected.setDate(todayDate.getDate() - i);
      const expectedStr = expected.toISOString().slice(0, 10);
      if (dates.includes(expectedStr)) streak++;
      else break;
    }
  }

  // Heatmap data (last 365 days)
  const heatmapRows = db.prepare(`
    SELECT record_date, SUM(duration_seconds) as total FROM study_records
    WHERE record_date >= date(?, '-365 days')
    GROUP BY record_date
  `).all(`${year}-01-01`) as any[];
  const heatmap: Record<string, number> = {};
  for (const r of heatmapRows) heatmap[r.record_date] = r.total;

  // Weekly progress
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const weekTasks = db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done FROM tasks WHERE plan_date >= ?").get(weekStartStr) as any;

  // Subject progress
  const subjects = db.prepare("SELECT * FROM subjects ORDER BY sort_order").all() as any[];
  const subjectProgress = subjects.map(s => {
    const totalQ = (db.prepare("SELECT COUNT(*) as c FROM questions WHERE subject_id = ? AND is_deleted = 0").get(s.id) as any).c;
    const correctQ = (db.prepare("SELECT COUNT(DISTINCT question_id) as c FROM answer_records ar JOIN questions q ON ar.question_id = q.id WHERE q.subject_id = ? AND ar.is_correct = 1").get(s.id) as any).c;
    return { ...s, totalQuestions: totalQ, correctQuestions: correctQ };
  });

  // Mock exam records
  const mockExams = db.prepare("SELECT * FROM mock_exam_records ORDER BY exam_date DESC LIMIT 5").all() as any[];

  // Badges
  const badges = db.prepare("SELECT b.* FROM badges b JOIN user_badges ub ON b.id = ub.badge_id ORDER BY ub.unlocked_at DESC LIMIT 5").all() as any[];

  return NextResponse.json({
    today,
    tasksToday,
    streak,
    heatmap,
    weekly: { total: weekTasks.total, done: weekTasks.done || 0 },
    subjectProgress,
    mockExams,
    badges,
  });
}
