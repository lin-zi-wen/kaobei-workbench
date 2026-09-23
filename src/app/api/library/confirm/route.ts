import { db } from "@/lib/db";
import { knowledgeItems } from "@/db/schema";
import { sql } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ids = body.ids || [];
    for (const id of ids) {
      db.update(knowledgeItems).set({ status: "archived", confirmedAt: new Date().toISOString() }).where(sql`${knowledgeItems.id} = ${id}`).run();
    }
    return successResponse({ confirmed: ids.length });
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
