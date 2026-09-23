import { NextResponse } from "next/server";
import db from "@/db";

function sm2Next(quality: number, stage: number, consecutiveCorrect: number) {
  if (quality < 3) return { stage: 0, interval: 1, consecutiveCorrect: 0 };
  const cc = consecutiveCorrect + 1;
  let interval: number;
  if (stage === 0) interval = 1;
  else if (stage === 1) interval = 3;
  else interval = Math.round((stage === 2 ? 3 : (stage - 1) * 2.5) * 1.5);
  return { stage: stage + 1, interval, consecutiveCorrect: cc };
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { quality } = body; // 0=wrong, 3=uncertain, 5=correct

  const mr = db.prepare("SELECT * FROM mistake_records WHERE id = ?").get(id) as any;
  if (!mr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const calc = sm2Next(quality, mr.sm2_stage, mr.consecutive_correct);
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + calc.interval);

  let status = mr.status;
  if (calc.consecutiveCorrect >= 3) status = "mastered";
  else if (calc.stage > 0) status = "reviewing";

  db.prepare(`
    UPDATE mistake_records
    SET sm2_stage = ?, next_review_date = ?, consecutive_correct = ?, review_count = review_count + 1,
        status = ?, last_reviewed_at = ?, updated_at = ?
    WHERE id = ?
  `).run(calc.stage, nextDate.toISOString().slice(0, 10), calc.consecutiveCorrect, status, new Date().toISOString(), Date.now(), id);

  return NextResponse.json({ ok: true, nextReviewDate: nextDate.toISOString().slice(0, 10), status });
}
