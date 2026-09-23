import { successResponse } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query } = body;
    return successResponse({
      candidates: [
        { title: `关于「${query}」的资料一`, url: "https://example.com/1", suggestedCategory: "knowledge_point" },
        { title: `关于「${query}」的资料二`, url: "https://example.com/2", suggestedCategory: "tips" },
      ]
    });
  } catch (e: any) {
    return Response.json({ success: false, error: { code: "INTERNAL_ERROR", message: e.message } }, { status: 500 });
  }
}
