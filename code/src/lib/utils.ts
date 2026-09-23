import { ZodError } from "zod";

export function successResponse(data: any) {
  return Response.json({ success: true, data });
}

export function errorResponse(code: string, message: string, field?: string, status = 400) {
  const body: any = { success: false, error: { code, message } };
  if (field) body.error.field = field;
  return Response.json(body, { status });
}

export function validationError(error: ZodError) {
  const first = error.errors[0];
  return errorResponse("VALIDATION_ERROR", first.message, first.path.join("."));
}

export function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

export function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function nowISO() {
  return new Date().toISOString();
}

export function parseJsonArray(val: string | null | undefined): number[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
