import { sqlite, db } from "./src/lib/db";
import { knowledgeItems } from "./src/db/schema";
import { sql } from "drizzle-orm";

async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    console.log("q:", q);
    if (!q.trim()) return new Response(JSON.stringify({ success: true, data: { rows: [], total: 0 } }), { status: 200 });
    const rows = sqlite.prepare(`SELECT docid, rank FROM knowledge_items_fts WHERE knowledge_items_fts MATCH ? ORDER BY rank LIMIT 20`).all(q);
    console.log("fts rows:", rows.length);
    const ids = (rows as any[]).map((r: any) => r.docid);
    if (ids.length === 0) return new Response(JSON.stringify({ success: true, data: { rows: [], total: 0 } }), { status: 200 });
    const items = db.select().from(knowledgeItems).where(sql`${knowledgeItems.id} IN (${sql.join(ids, sql`, `)})`).all();
    return new Response(JSON.stringify({ success: true, data: { rows: items, total: items.length } }), { status: 200 });
  } catch (e: any) {
    console.error("error:", e.message);
    return new Response(JSON.stringify({ success: false, error: { code: "INTERNAL_ERROR", message: e.message } }), { status: 500 });
  }
}

async function main() {
  const req = new Request("http://localhost:3000/api/library/search?q=计算机");
  const res = await GET(req);
  const body = await res.json();
  console.log("status:", res.status, "body:", JSON.stringify(body).slice(0, 200));
}

main();
