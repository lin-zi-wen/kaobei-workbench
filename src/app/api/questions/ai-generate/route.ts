import { successResponse } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { knowledgePointId, count } = body;
    const generated = Array.from({ length: count || 1 }).map((_, i) => ({
      stem: `AI生成题目 ${i + 1}（知识点 ${knowledgePointId}）`,
      optionsJson: JSON.stringify([{ label: "A", text: "选项A" }, { label: "B", text: "选项B" }]),
      answer: "A",
      explanation: "AI生成解析",
    }));
    return successResponse({ generated });
  } catch (e: any) {
    return Response.json({ success: false, error: { code: "INTERNAL_ERROR", message: e.message } }, { status: 500 });
  }
}
