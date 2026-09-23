import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/utils";
import fs from "fs";
import path from "path";

export async function POST() {
  try {
    const dbPath = path.join(process.cwd(), "data", "app.db");
    const exportDir = path.join(process.cwd(), "content", "backups");
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const dest = path.join(exportDir, `backup-${ts}.db`);
    fs.copyFileSync(dbPath, dest);
    return successResponse({ exported: true, path: dest });
  } catch (e: any) {
    return errorResponse("INTERNAL_ERROR", e.message, undefined, 500);
  }
}
