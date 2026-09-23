import { successResponse } from "@/lib/utils";
import { getSettings } from "@/lib/auth";

export async function GET() {
  const s = await getSettings();
  return successResponse({ enabled: s.accessPasswordEnabled });
}
