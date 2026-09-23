import { db } from "@/lib/db";
import { aiMessages } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/utils";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = db.select().from(aiMessages).where(eq(aiMessages.sessionId, Number(id))).orderBy(asc(aiMessages.createdAt)).all();
    return successResponse(rows);
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
