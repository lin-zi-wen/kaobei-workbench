import bcryptjs from "bcryptjs";
import { db } from "@/lib/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getSettings() {
  const rows = db.select().from(settings).where(eq(settings.id, 1)).all();
  if (rows.length === 0) {
    db.insert(settings).values({ id: 1 }).run();
    return db.select().from(settings).where(eq(settings.id, 1)).get()!;
  }
  return rows[0];
}

export async function verifyPassword(input: string): Promise<boolean> {
  const s = await getSettings();
  if (!s.accessPasswordEnabled || !s.accessPasswordHash) return true;
  return bcryptjs.compare(input, s.accessPasswordHash);
}

export async function setPassword(password: string | null) {
  if (password === null) {
    db.update(settings)
      .set({ accessPasswordEnabled: false, accessPasswordHash: null })
      .where(eq(settings.id, 1))
      .run();
    return;
  }
  const hash = await bcryptjs.hash(password, 10);
  db.update(settings)
    .set({ accessPasswordEnabled: true, accessPasswordHash: hash })
    .where(eq(settings.id, 1))
      .run();
}
