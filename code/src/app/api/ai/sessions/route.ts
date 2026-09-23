import { db } from "@/lib/db";
import { aiSessions } from "@/db/schema";
import { desc } from "drizzle-orm";
import { successResponse, errorResponse, validationError } from "@/lib/utils";
import { z } from "zod";

export async function GET() {
  try {
    const rows = db.select().from(aiSessions).orderBy(desc(aiSessions.createdAt)).all();
    return successResponse(rows);
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}

const createSchema = z.object({ title: z.string().optional(), mode: z.enum(["local","web","local_web"]).default("local_web") });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const now = new Date().toISOString();
    const result = db.insert(aiSessions).values({ ...data, createdAt: now, updatedAt: now }).returning().get();
    return successResponse(result);
  } catch (e: any) {
    if (e instanceof z.ZodError) return validationError(e);
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
