import { db } from "./src/lib/db";
import { notes } from "./src/db/schema";
import { eq, and, sql } from "drizzle-orm";

async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subject_id");
    const tag = searchParams.get("tag");
    let query = db.select().from(notes) as any;
    const conditions: any[] = [];
    if (subjectId) conditions.push(eq(notes.subjectId, Number(subjectId)));
    if (tag) conditions.push(sql`${notes.tagList} LIKE ${"%" + tag + "%"}`);
    if (conditions.length > 0) query = query.where(and(...conditions));
    const rows = query.orderBy(notes.isPinned).all();
    return Response.json({ success: true, data: rows });
  } catch (e: any) {
    return Response.json({ success: false, error: { code: "INTERNAL_ERROR", message: e.message } }, { status: 500 });
  }
}

async function main() {
  const req = new Request("http://localhost:3000/api/notes");
  const res = await GET(req);
  const body = await res.json();
  console.log("status:", res.status, "body:", JSON.stringify(body).slice(0, 200));
}

main();
