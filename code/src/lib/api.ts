const BASE = "";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Dashboard
  dashboard: () => fetchJson<any>("/api/dashboard"),

  // Plans
  plans: (params?: string) => fetchJson<any>(`/api/plans${params || ""}`),
  createPlan: (body: any) => fetchJson<any>("/api/plans", { method: "POST", body: JSON.stringify(body) }),
  updatePlan: (id: number, body: any) => fetchJson<any>(`/api/plans/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deletePlan: (id: number) => fetchJson<any>(`/api/plans/${id}`, { method: "DELETE" }),

  // Knowledge
  knowledge: (params?: string) => fetchJson<any>(`/api/knowledge${params || ""}`),
  knowledgeCategories: () => fetchJson<any>("/api/knowledge/categories"),

  // Chat
  chatSessions: () => fetchJson<any>("/api/chat"),
  chatMessages: (sessionId: number) => fetchJson<any>(`/api/chat/${sessionId}`),
  sendMessage: (body: any) => fetchJson<any>("/api/chat", { method: "POST", body: JSON.stringify(body) }),

  // Questions
  questions: (params?: string) => fetchJson<any>(`/api/questions${params || ""}`),
  questionDetail: (id: number) => fetchJson<any>(`/api/questions/${id}`),
  submitAnswer: (body: any) => fetchJson<any>("/api/questions/answer", { method: "POST", body: JSON.stringify(body) }),
  mockExams: () => fetchJson<any>("/api/questions/mock-exams"),

  // Mistakes
  mistakes: (params?: string) => fetchJson<any>(`/api/mistakes${params || ""}`),
  reviewMistake: (id: number, body: any) => fetchJson<any>(`/api/mistakes/${id}/review`, { method: "POST", body: JSON.stringify(body) }),

  // Notes
  notes: (params?: string) => fetchJson<any>(`/api/notes${params || ""}`),
  createNote: (body: any) => fetchJson<any>("/api/notes", { method: "POST", body: JSON.stringify(body) }),
  updateNote: (id: number, body: any) => fetchJson<any>(`/api/notes/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteNote: (id: number) => fetchJson<any>(`/api/notes/${id}`, { method: "DELETE" }),

  // Reports
  reports: (params?: string) => fetchJson<any>(`/api/reports${params || ""}`),

  // Settings
  settings: () => fetchJson<any>("/api/settings"),
  updateSettings: (body: any) => fetchJson<any>("/api/settings", { method: "PATCH", body: JSON.stringify(body) }),

  // Export / Import
  exportData: () => fetchJson<any>("/api/export"),
  importData: (body: any) => fetchJson<any>("/api/import", { method: "POST", body: JSON.stringify(body) }),

  // Seed
  seed: () => fetchJson<any>("/api/seed", { method: "POST" }),
};
