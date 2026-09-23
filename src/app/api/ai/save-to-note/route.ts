import { db } from "@/lib/db";
import { notes } from "@/db/schema";
import { successResponse, errorResponse } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messageId, title, content } = body;
    const now = new Date().toISOString();
    const result = db.insert(notes).values({
      title: title || "AI整理笔记",
      content: content || "",
      sourceAiMessageId: messageId,
      createdAt: now,
      updatedAt: now,
    }).returning().get();
    return successResponse(result);
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
