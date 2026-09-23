import { db } from "@/lib/db";
import { examConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { successResponse, errorResponse, validationError } from "@/lib/utils";

export async function GET() {
  const rows = db.select().from(examConfig).all();
  return successResponse(rows[0] ?? null);
}

const updateSchema = z.object({
  examName: z.string().optional(),
  examLevel: z.string().optional(),
  examDate: z.string().nullable().optional(),
  subjectsJson: z.string().optional(),
  weeklyAvailableDays: z.number().int().min(1).max(7).optional(),
  dailyAvailableMinutes: z.number().int().min(1).max(1440).optional(),
  firstRunCompleted: z.boolean().optional(),
});

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const data = updateSchema.parse(body);
    const rows = db.select().from(examConfig).all();
    if (rows.length === 0) {
      db.insert(examConfig).values(data as any).run();
    } else {
      db.update(examConfig).set(data as any).where(eq(examConfig.id, rows[0].id)).run();
    }
    const updated = db.select().from(examConfig).all()[0];
    return successResponse(updated);
  } catch (e: any) {
    if (e instanceof z.ZodError) return validationError(e);
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
