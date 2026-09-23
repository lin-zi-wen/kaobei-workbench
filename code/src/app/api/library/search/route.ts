import { sqlite, db } from "@/lib/db";
import { knowledgeItems } from "@/db/schema";
import { sql } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    if (!q.trim()) return successResponse({ rows: [], total: 0 });
    const rows = sqlite.prepare(`SELECT rowid, rank FROM knowledge_items_fts WHERE knowledge_items_fts MATCH ? ORDER BY rank LIMIT 20`).all(q);
    const ids = (rows as any[]).map((r: any) => r.rowid);
    if (ids.length === 0) return successResponse({ rows: [], total: 0 });
    const items = db.select().from(knowledgeItems).where(sql`${knowledgeItems.id} IN (${sql.join(ids, sql`, `)})`).all();
    return successResponse({ rows: items, total: items.length });
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
