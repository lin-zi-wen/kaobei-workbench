import { setPassword, verifyPassword } from "@/lib/auth";
import { z } from "zod";
import { successResponse, errorResponse, validationError } from "@/lib/utils";

const schema = z.object({ password: z.string().nullable() });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password } = schema.parse(body);
    await setPassword(password);
    return successResponse({ updated: true });
  } catch (e: any) {
    if (e instanceof z.ZodError) return validationError(e);
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
