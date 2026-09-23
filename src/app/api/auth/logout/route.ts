import { successResponse } from "@/lib/utils";

export async function POST() {
  return successResponse({ authenticated: false });
}
