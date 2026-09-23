import { NextResponse } from "next/server";
import db from "@/db";

export async function GET() {
  const sessions = db.prepare("SELECT * FROM ai_sessions ORDER BY updated_at DESC").all() as any[];
  return NextResponse.json({ sessions });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { sessionId, content, mode } = body;

  let sid = sessionId;
  if (!sid) {
    const result = db.prepare("INSERT INTO ai_sessions (title, mode, created_at, updated_at) VALUES (?, ?, ?, ?)")
      .run(content.slice(0, 20), mode || "local_web", Date.now(), Date.now());
    sid = result.lastInsertRowid;
  }

  db.prepare("INSERT INTO ai_messages (session_id, role, content, content_type, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(sid, "user", content, "text", Date.now());

  // Simulated AI response
  const reply = `收到你的问题："${content}"\n\n（此为模拟回复，实际使用时请接入 AI 服务。）`;
  db.prepare("INSERT INTO ai_messages (session_id, role, content, content_type, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(sid, "assistant", reply, "text", Date.now());

  db.prepare("UPDATE ai_sessions SET updated_at = ? WHERE id = ?").run(Date.now(), sid);

  return NextResponse.json({ sessionId: sid, reply });
}
