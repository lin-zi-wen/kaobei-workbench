import { NextResponse } from "next/server";
import db from "@/db";

export async function POST(req: Request) {
  const body = await req.json();
  const { questionId, answerGiven, timeSpentSeconds, source } = body;
  const question = db.prepare("SELECT * FROM questions WHERE id = ?").get(questionId) as any;
  if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const isCorrect = answerGiven.trim().toLowerCase() === question.answer.trim().toLowerCase();
  const answeredAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO answer_records (question_id, answer_given, is_correct, time_spent_seconds, answered_at, source, is_first_attempt)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `).run(questionId, answerGiven, isCorrect ? 1 : 0, timeSpentSeconds || 0, answeredAt, source || "practice");

  if (!isCorrect) {
    const existing = db.prepare("SELECT * FROM mistake_records WHERE question_id = ? AND removed_at IS NULL").get(questionId) as any;
    if (existing) {
      db.prepare("UPDATE mistake_records SET wrong_count = wrong_count + 1, updated_at = ? WHERE id = ?")
        .run(Date.now(), existing.id);
    } else {
      db.prepare(`
        INSERT INTO mistake_records (question_id, wrong_count, next_review_date, status, sm2_stage, created_at, updated_at)
        VALUES (?, 1, date('now', '+1 day'), 'unmastered', 0, ?, ?)
      `).run(questionId, Date.now(), Date.now());
    }
  }

  return NextResponse.json({ isCorrect, correctAnswer: question.answer, explanation: question.explanation });
}
