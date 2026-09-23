import { db } from "@/lib/db";
import { knowledgeItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/utils";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    db.update(knowledgeItems).set({ status: "parsed", parseError: null }).where(eq(knowledgeItems.id, Number(id))).run();
    return successResponse({ retried: true });
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
