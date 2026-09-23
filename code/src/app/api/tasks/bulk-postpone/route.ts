import { db } from "@/lib/db";
import { tasks } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { successResponse, errorResponse, validationError, getTodayISO } from "@/lib/utils";

const schema = z.object({ ids: z.array(z.number().int()) });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ids } = schema.parse(body);
    const today = getTodayISO();
    for (const id of ids) {
      const row = db.select().from(tasks).where(eq(tasks.id, id)).get();
      if (row && row.status === "todo") {
        db.update(tasks).set({
          planDate: today,
          originalDate: row.originalDate || row.planDate,
          postponeCount: (row.postponeCount || 0) + 1,
        }).where(eq(tasks.id, id)).run();
      }
    }
    return successResponse({ postponed: ids.length });
  } catch (e: any) {
    if (e instanceof z.ZodError) return validationError(e);
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
