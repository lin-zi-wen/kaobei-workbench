import { db } from "@/lib/db";
import { aiMessages, knowledgeItems } from "@/db/schema";
import { sql } from "drizzle-orm";
import { successResponse, errorResponse, validationError } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({ sessionId: z.number().int(), content: z.string().min(1), mode: z.enum(["local","web","local_web"]).optional() });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, content, mode } = schema.parse(body);
    const now = new Date().toISOString();
    db.insert(aiMessages).values({ sessionId, role: "user", content, contentType: "text", createdAt: now }).run();

    // RAG fallback: keyword search on content_text
    let citations: any[] = [];
    let answer = "";
    try {
      const items = db.select().from(knowledgeItems)
        .where(sql`${knowledgeItems.contentText} LIKE ${"%" + content.slice(0, 20) + "%"}`)
        .limit(3).all();
      if (items.length > 0) {
        citations = items.map(i => ({ source_type: i.sourceType, title: i.title, location: "内容匹配", knowledge_item_id: i.id }));
        answer = `根据知识库中的 ${items.length} 条资料：\n\n` + items.map((i, idx) => `[${idx + 1}] ${i.title}`).join("\n") + `\n\n关于您的问题「${content}」，资料中有相关内容可供参考。`;
      } else {
        answer = `资料未覆盖，以下仅为模型生成内容，不构成权威依据。\n\n关于「${content}」，当前知识库中暂无直接匹配的资料。`;
      }
    } catch {
      answer = `资料未覆盖，以下仅为模型生成内容，不构成权威依据。\n\n关于「${content}」，当前知识库中暂无直接匹配的资料。`;
    }

    const assistantMsg = db.insert(aiMessages).values({
      sessionId, role: "assistant", content: answer, contentType: "markdown",
      citationsJson: JSON.stringify(citations), modelUsed: "local-rag-fallback", createdAt: now,
    }).returning().get();

    return successResponse(assistantMsg);
  } catch (e: any) {
    if (e instanceof z.ZodError) return validationError(e);
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
