export interface Subject {
  id: number;
  code: string;
  name: string;
  sortOrder: number;
}

export interface Chapter {
  id: number;
  subjectId: number;
  parentId: number | null;
  name: string;
  sortOrder: number;
  description: string | null;
}

export interface KnowledgePoint {
  id: number;
  chapterId: number;
  name: string;
  sortOrder: number;
  description: string | null;
  difficulty: number;
}

export interface Task {
  id: number;
  title: string;
  subjectId: number | null;
  knowledgePointIds: string | null;
  planDate: string;
  startTime: string | null;
  endTime: string | null;
  estimatedMinutes: number | null;
  status: "todo" | "done" | "cancelled";
  originalDate: string | null;
  postponeCount: number;
  focusSessionsJson: string | null;
  completedAt: string | null;
  note: string | null;
}

export interface KnowledgeItem {
  id: number;
  title: string;
  sourceType: string;
  category: string;
  subjectId: number | null;
  chapterId: number | null;
  knowledgePointIds: string | null;
  contentType: string;
  contentText: string | null;
  contentMarkdown: string | null;
  filePath: string | null;
  fileSizeBytes: number | null;
  pageCount: number | null;
  sourceUrl: string | null;
  sourceName: string | null;
  ocrText: string | null;
  status: string;
  parseError: string | null;
  collectedAt: string | null;
  confirmedAt: string | null;
  isIndexed: boolean;
}

export interface Question {
  id: number;
  subjectId: number | null;
  knowledgePointIds: string | null;
  type: string;
  stem: string;
  optionsJson: string | null;
  answer: string;
  explanation: string | null;
  difficulty: number;
  source: string | null;
  sourceType: string;
  similarToQuestionId: number | null;
  createdFromMistakeId: number | null;
  isDeleted: boolean;
}

export interface AnswerRecord {
  id: number;
  questionId: number;
  answerGiven: string;
  isCorrect: boolean | null;
  timeSpentSeconds: number | null;
  answeredAt: string;
  source: string;
  mockExamRecordId: number | null;
  isFirstAttempt: boolean;
}

export interface MistakeRecord {
  id: number;
  questionId: number;
  firstWrongAnswerRecordId: number | null;
  wrongCount: number;
  reviewCount: number;
  consecutiveCorrect: number;
  status: "unmastered" | "reviewing" | "mastered";
  sm2Stage: number;
  nextReviewDate: string;
  lastReviewedAt: string | null;
  errorTag: string;
  errorTagAiSuggested: string | null;
  isManuallyAdded: boolean;
  removedAt: string | null;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  subjectId: number | null;
  knowledgePointIds: string | null;
  mistakeRecordIds: string | null;
  sourceAiMessageId: number | null;
  isPinned: boolean;
  tagList: string | null;
}

export interface StudyRecord {
  id: number;
  recordDate: string;
  recordType: string;
  subjectId: number | null;
  taskId: number | null;
  durationSeconds: number;
  detailJson: string | null;
}

export interface MockExamRecord {
  id: number;
  subjectId: number | null;
  name: string;
  examDate: string;
  score: number;
  fullScore: number;
  timeSpentMinutes: number | null;
  questionCount: number;
  correctCount: number | null;
  knowledgePointCoverageJson: string | null;
  note: string | null;
}

export interface StudyReport {
  id: number;
  reportType: string;
  periodStart: string;
  periodEnd: string;
  dataJson: string;
  aiSummary: string | null;
  aiSummaryFailed: boolean;
  generatedAt: string;
}

export interface AiSession {
  id: number;
  title: string | null;
  mode: string;
}

export interface AiMessage {
  id: number;
  sessionId: number;
  role: "user" | "assistant" | "system";
  content: string;
  contentType: string;
  citationsJson: string | null;
  tokenCount: number | null;
  modelUsed: string | null;
}

export interface Settings {
  id: number;
  accessPasswordHash: string | null;
  accessPasswordEnabled: boolean;
  theme: "light" | "dark" | "system";
  animationEnabled: boolean;
  soundEnabled: boolean;
  dailyQuoteEnabled: boolean;
  focusDefaultDuration: number;
  focusMaxRounds: number;
  autoBackupEnabled: boolean;
  lastBackupAt: string | null;
  aiUsageStatsJson: string | null;
}

export interface Badge {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  iconName: string | null;
}

export interface ExamConfig {
  id: number;
  examName: string;
  examLevel: string;
  examDate: string | null;
  subjectsJson: string;
  weeklyAvailableDays: number;
  dailyAvailableMinutes: number;
  firstRunCompleted: boolean;
}
