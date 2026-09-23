import { successResponse } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return successResponse({ candidates: [{ title: "示例资料", url: "https://example.com", suggestedCategory: "knowledge_point" }] });
  } catch (e: any) {
    return Response.json({ success: false, error: { code: "INTERNAL_ERROR", message: e.message } }, { status: 500 });
  }
}
