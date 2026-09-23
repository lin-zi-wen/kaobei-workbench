import { db } from "@/lib/db";
import { subjects, chapters, knowledgePoints } from "@/db/schema";
import { successResponse, errorResponse } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tree = body.tree || [];
    for (const sub of tree) {
      const s = db.insert(subjects).values({ code: sub.code || "zk", name: sub.name, sortOrder: sub.sortOrder || 0, examConfigId: 1 }).returning().get();
      for (const chap of sub.chapters || []) {
        db.insert(chapters).values({ subjectId: s.id, name: chap.name, sortOrder: chap.sortOrder || 0 }).run();
      }
    }
    return successResponse({ confirmed: true });
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
