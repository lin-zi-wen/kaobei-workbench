import { NextResponse } from "next/server";
import { execSync } from "child_process";
import path from "path";

export async function POST() {
  try {
    const cwd = path.join(process.cwd());
    execSync("npm run db:seed", { cwd, stdio: "pipe", timeout: 60000 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Seed failed" }, { status: 500 });
  }
}
