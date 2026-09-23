import { db } from "@/lib/db";
import { questions } from "@/db/schema";
import { successResponse, errorResponse } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items = body.items || [];
    let count = 0;
    for (const item of items) {
      db.insert(questions).values(item).run();
      count++;
    }
    return successResponse({ imported: count });
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
