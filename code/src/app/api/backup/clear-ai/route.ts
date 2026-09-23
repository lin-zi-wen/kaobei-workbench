import { db } from "@/lib/db";
import { aiSessions, aiMessages } from "@/db/schema";
import { successResponse, errorResponse } from "@/lib/utils";

export async function POST() {
  try {
    db.delete(aiMessages).run();
    db.delete(aiSessions).run();
    return successResponse({ cleared: true });
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
