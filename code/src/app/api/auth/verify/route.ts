import { z } from "zod";
import { successResponse, errorResponse, validationError } from "@/lib/utils";
import { verifyPassword } from "@/lib/auth";

const schema = z.object({ password: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password } = schema.parse(body);
    const ok = await verifyPassword(password);
    if (!ok) {
      return errorResponse("INVALID_PASSWORD", "访问口令错误", undefined, 401);
    }
    return successResponse({ authenticated: true });
  } catch (e: any) {
    if (e instanceof z.ZodError) return validationError(e);
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
