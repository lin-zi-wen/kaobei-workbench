import { successResponse, errorResponse } from "@/lib/utils";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return errorResponse("VALIDATION_ERROR", "未提供文件", "file", 400);
    const dbPath = path.join(process.cwd(), "data", "app.db");
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(dbPath, buffer);
    return successResponse({ imported: true });
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
