import { successResponse } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body.text || "";
    if (text.length < 10) {
      return Response.json({ success: false, error: { code: "CONTENT_TOO_SHORT", message: "内容过短" } }, { status: 400 });
    }
    const lines = text.split("\n").filter((l: string) => l.trim());
    const parsed = lines.map((l: string, i: number) => ({ id: i + 1, name: l.trim(), level: l.startsWith(" ") ? 2 : 1 }));
    return successResponse({ subjects: [{ name: "综合知识", chapters: parsed.filter((p: any) => p.level === 1) }] });
  } catch (e: any) {
    return Response.json({ success: false, error: { code: "INTERNAL_ERROR", message: e.message } }, { status: 500 });
  }
}
