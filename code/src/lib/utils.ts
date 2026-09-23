export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${formatDate(dateStr)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getWeekDates() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }
  return dates;
}

export function getYearWeeks(year: number) {
  const weeks: { start: string; end: string; label: string }[] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  let current = new Date(start);
  while (current <= end) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);
    if (weekEnd > end) weekEnd.setTime(end.getTime());
    weeks.push({
      start: formatDate(weekStart.toISOString()),
      end: formatDate(weekEnd.toISOString()),
      label: `第${weeks.length + 1}周`,
    });
    current.setDate(current.getDate() + 7);
  }
  return weeks;
}

export function parseJson<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export function sm2Calculate(
  quality: number,
  stage: number,
  consecutiveCorrect: number
): { nextStage: number; nextInterval: number; newConsecutive: number } {
  // Simplified SM-2
  // quality: 0=wrong, 3=uncertain, 5=correct
  if (quality < 3) {
    return { nextStage: 0, nextInterval: 1, newConsecutive: 0 };
  }
  const newConsecutive = consecutiveCorrect + 1;
  let nextInterval: number;
  if (stage === 0) nextInterval = 1;
  else if (stage === 1) nextInterval = 3;
  else nextInterval = Math.round((stage === 2 ? 3 : (stage - 1) * 2.5) * 1.5);
  return { nextStage: stage + 1, nextInterval, newConsecutive };
}

export const KNOWLEDGE_CATEGORIES = [
  { key: "textbook", label: "教材", icon: "BookOpen" },
  { key: "past_exam", label: "历年真题", icon: "FileText" },
  { key: "video", label: "视频课程", icon: "PlayCircle" },
  { key: "article", label: "技术文章", icon: "Newspaper" },
  { key: "cheatsheet", label: "速查表", icon: "StickyNote" },
  { key: "mindmap", label: "思维导图", icon: "GitBranch" },
  { key: "note", label: "个人笔记", icon: "NotebookPen" },
  { key: "ai_summary", label: "AI 摘要", icon: "Sparkles" },
  { key: "web_collect", label: "网页收藏", icon: "Globe" },
  { key: "github_repo", label: "GitHub 仓库", icon: "Github" },
  { key: "pdf", label: "PDF 文档", icon: "FileType" },
  { key: "other", label: "其他", icon: "Box" },
];

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  single_choice: "单选题",
  multiple_choice: "多选题",
  true_false: "判断题",
  fill_blank: "填空题",
  essay: "论述题",
};

export const ERROR_TAG_LABELS: Record<string, string> = {
  concept_confusion: "概念混淆",
  calculation_error: "计算错误",
  misreading: "审题失误",
  memory_lapse: "记忆遗忘",
  other: "其他",
};
