import { db } from "@/lib/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { successResponse, errorResponse, validationError } from "@/lib/utils";

export async function GET() {
  try {
    const rows = db.select().from(settings).all();
    return successResponse(rows[0] ?? null);
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}

const updateSchema = z.object({
  theme: z.enum(["light","dark","system"]).optional(),
  animationEnabled: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
  dailyQuoteEnabled: z.boolean().optional(),
  focusDefaultDuration: z.number().int().min(1).optional(),
  focusMaxRounds: z.number().int().min(1).optional(),
  autoBackupEnabled: z.boolean().optional(),
}).passthrough();

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const data = updateSchema.parse(body);
    const rows = db.select().from(settings).all();
    if (rows.length === 0) {
      db.insert(settings).values({ id: 1, ...data } as any).run();
    } else {
      db.update(settings).set(data as any).where(eq(settings.id, 1)).run();
    }
    const updated = db.select().from(settings).all()[0];
    return successResponse(updated);
  } catch (e: any) {
    if (e instanceof z.ZodError) return validationError(e);
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
