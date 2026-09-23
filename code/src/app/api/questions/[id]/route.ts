import { NextResponse } from "next/server";
import db from "@/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = db.prepare("SELECT * FROM questions WHERE id = ? AND is_deleted = 0").get(id) as any;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}
