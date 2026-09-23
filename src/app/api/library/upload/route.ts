import { successResponse, errorResponse } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return errorResponse("VALIDATION_ERROR", "未提供文件", "file", 400);
    return successResponse({ uploaded: true, name: file.name, size: file.size });
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
