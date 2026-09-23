import { sqliteTable, integer, text, real, index, foreignKey, primaryKey } from "drizzle-orm/sqlite-core";

// ============================================
// 3.2 考试配置与科目树
// ============================================

export const examConfig = sqliteTable("exam_config", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  examName: text("exam_name").notNull(),
  examLevel: text("exam_level").notNull(),
  examDate: text("exam_date"),
  subjectsJson: text("subjects_json").notNull(),
  weeklyAvailableDays: integer("weekly_available_days", { mode: "number" }).notNull().default(5),
  dailyAvailableMinutes: integer("daily_available_minutes", { mode: "number" }).notNull().default(150),
  firstRunCompleted: integer("first_run_completed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const subjects = sqliteTable("subjects", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order", { mode: "number" }).notNull().default(0),
  examConfigId: integer("exam_config_id", { mode: "number" }).references(() => examConfig.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const chapters = sqliteTable("chapters", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  subjectId: integer("subject_id", { mode: "number" }).references(() => subjects.id, { onDelete: "cascade" }),
  parentId: integer("parent_id", { mode: "number" }).references(() => chapters.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order", { mode: "number" }).notNull().default(0),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const knowledgePoints = sqliteTable("knowledge_points", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  chapterId: integer("chapter_id", { mode: "number" }).references(() => chapters.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order", { mode: "number" }).notNull().default(0),
  description: text("description"),
  difficulty: integer("difficulty", { mode: "number" }).default(3),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// 3.3 计划任务
// ============================================

export const tasks = sqliteTable("tasks", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  subjectId: integer("subject_id", { mode: "number" }).references(() => subjects.id, { onDelete: "set null" }),
  knowledgePointIds: text("knowledge_point_ids"),
  planDate: text("plan_date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  estimatedMinutes: integer("estimated_minutes", { mode: "number" }),
  status: text("status").notNull().default("todo"),
  originalDate: text("original_date"),
  postponeCount: integer("postpone_count", { mode: "number" }).notNull().default(0),
  focusSessionsJson: text("focus_sessions_json"),
  completedAt: text("completed_at"),
  note: text("note"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// 3.4 知识库条目
// ============================================

export const knowledgeItems = sqliteTable("knowledge_items", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  sourceType: text("source_type").notNull(), // user_upload / web_collect
  category: text("category").notNull(),
  subjectId: integer("subject_id", { mode: "number" }).references(() => subjects.id, { onDelete: "set null" }),
  chapterId: integer("chapter_id", { mode: "number" }).references(() => chapters.id, { onDelete: "set null" }),
  knowledgePointIds: text("knowledge_point_ids"),
  contentType: text("content_type").notNull(), // pdf / word / markdown / text / image / webpage
  contentText: text("content_text"),
  contentMarkdown: text("content_markdown"),
  filePath: text("file_path"),
  fileSizeBytes: integer("file_size_bytes", { mode: "number" }),
  pageCount: integer("page_count", { mode: "number" }),
  sourceUrl: text("source_url"),
  sourceName: text("source_name"),
  ocrText: text("ocr_text"),
  status: text("status").notNull().default("pending"), // pending / parsed / archived / failed
  parseError: text("parse_error"),
  collectedAt: text("collected_at"),
  confirmedAt: text("confirmed_at"),
  isIndexed: integer("is_indexed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// FTS5 虚拟表
export const knowledgeItemsFts = sqliteTable("knowledge_items_fts", {
  docid: integer("docid", { mode: "number" }).primaryKey(),
  title: text("title").notNull(),
  contentText: text("content_text"),
  ocrText: text("ocr_text"),
});

// ============================================
// 3.5 题目与做题记录
// ============================================

export const questions = sqliteTable("questions", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  subjectId: integer("subject_id", { mode: "number" }).references(() => subjects.id, { onDelete: "cascade" }),
  knowledgePointIds: text("knowledge_point_ids"),
  type: text("type").notNull(), // single_choice / multiple_choice / true_false / fill_blank / essay
  stem: text("stem").notNull(),
  optionsJson: text("options_json"),
  answer: text("answer").notNull(),
  explanation: text("explanation"),
  difficulty: integer("difficulty", { mode: "number" }).default(3),
  source: text("source"),
  sourceType: text("source_type").notNull().default("manual"), // manual / import / ai_generated
  similarToQuestionId: integer("similar_to_question_id", { mode: "number" }),
  createdFromMistakeId: integer("created_from_mistake_id", { mode: "number" }),
  isDeleted: integer("is_deleted", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const answerRecords = sqliteTable("answer_records", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  questionId: integer("question_id", { mode: "number" }).references(() => questions.id, { onDelete: "cascade" }),
  answerGiven: text("answer_given").notNull(),
  isCorrect: integer("is_correct", { mode: "boolean" }),
  timeSpentSeconds: integer("time_spent_seconds", { mode: "number" }),
  answeredAt: text("answered_at").notNull(),
  source: text("source").notNull().default("practice"), // practice / mock_exam / review
  mockExamRecordId: integer("mock_exam_record_id", { mode: "number" }),
  isFirstAttempt: integer("is_first_attempt", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// 3.6 错题本与 SM-2 复习状态
// ============================================

export const mistakeRecords = sqliteTable("mistake_records", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  questionId: integer("question_id", { mode: "number" }).references(() => questions.id, { onDelete: "cascade" }),
  firstWrongAnswerRecordId: integer("first_wrong_answer_record_id", { mode: "number" }),
  wrongCount: integer("wrong_count", { mode: "number" }).notNull().default(1),
  reviewCount: integer("review_count", { mode: "number" }).notNull().default(0),
  consecutiveCorrect: integer("consecutive_correct", { mode: "number" }).notNull().default(0),
  status: text("status").notNull().default("unmastered"), // unmastered / reviewing / mastered
  sm2Stage: integer("sm2_stage", { mode: "number" }).notNull().default(0),
  nextReviewDate: text("next_review_date").notNull(),
  lastReviewedAt: text("last_reviewed_at"),
  errorTag: text("error_tag").default("other"), // concept_confusion / calculation_error / misreading / memory_lapse / other
  errorTagAiSuggested: text("error_tag_ai_suggested"),
  isManuallyAdded: integer("is_manually_added", { mode: "boolean" }).notNull().default(false),
  removedAt: text("removed_at"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// 3.7 笔记
// ============================================

export const notes = sqliteTable("notes", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  subjectId: integer("subject_id", { mode: "number" }).references(() => subjects.id, { onDelete: "set null" }),
  knowledgePointIds: text("knowledge_point_ids"),
  mistakeRecordIds: text("mistake_record_ids"),
  sourceAiMessageId: integer("source_ai_message_id", { mode: "number" }),
  isPinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),
  tagList: text("tag_list"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// 3.8 学习记录
// ============================================

export const studyRecords = sqliteTable("study_records", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  recordDate: text("record_date").notNull(),
  recordType: text("record_type").notNull(), // focus / check_in / question / review
  subjectId: integer("subject_id", { mode: "number" }).references(() => subjects.id, { onDelete: "set null" }),
  taskId: integer("task_id", { mode: "number" }).references(() => tasks.id, { onDelete: "set null" }),
  durationSeconds: integer("duration_seconds", { mode: "number" }).notNull().default(0),
  detailJson: text("detail_json"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// 3.9 模考记录
// ============================================

export const mockExamRecords = sqliteTable("mock_exam_records", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  subjectId: integer("subject_id", { mode: "number" }).references(() => subjects.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  examDate: text("exam_date").notNull(),
  score: integer("score", { mode: "number" }).notNull(),
  fullScore: integer("full_score", { mode: "number" }).notNull(),
  timeSpentMinutes: integer("time_spent_minutes", { mode: "number" }),
  questionCount: integer("question_count", { mode: "number" }).notNull(),
  correctCount: integer("correct_count", { mode: "number" }),
  knowledgePointCoverageJson: text("knowledge_point_coverage_json"),
  note: text("note"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// 3.10 学习报告
// ============================================

export const studyReports = sqliteTable("study_reports", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  reportType: text("report_type").notNull(), // weekly / monthly
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  dataJson: text("data_json").notNull(),
  aiSummary: text("ai_summary"),
  aiSummaryFailed: integer("ai_summary_failed", { mode: "boolean" }).notNull().default(false),
  generatedAt: text("generated_at").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// 3.11 AI 会话
// ============================================

export const aiSessions = sqliteTable("ai_sessions", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  title: text("title"),
  mode: text("mode").notNull().default("local_web"), // local / web / local_web
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const aiMessages = sqliteTable("ai_messages", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id", { mode: "number" }).references(() => aiSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // user / assistant / system
  content: text("content").notNull(),
  contentType: text("content_type").notNull().default("text"), // text / markdown
  citationsJson: text("citations_json"),
  tokenCount: integer("token_count", { mode: "number" }),
  modelUsed: text("model_used"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// 3.12 激励与徽章
// ============================================

export const badges = sqliteTable("badges", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // streak / milestone / progress
  iconName: text("icon_name"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const userBadges = sqliteTable("user_badges", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  badgeId: integer("badge_id", { mode: "number" }).references(() => badges.id, { onDelete: "cascade" }),
  unlockedAt: text("unlocked_at").notNull(),
  isNew: integer("is_new", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// 3.13 设置与系统
// ============================================

export const settings = sqliteTable("settings", {
  id: integer("id", { mode: "number" }).primaryKey().default(1),
  accessPasswordHash: text("access_password_hash"),
  accessPasswordEnabled: integer("access_password_enabled", { mode: "boolean" }).notNull().default(false),
  theme: text("theme").notNull().default("system"), // light / dark / system
  animationEnabled: integer("animation_enabled", { mode: "boolean" }).notNull().default(true),
  soundEnabled: integer("sound_enabled", { mode: "boolean" }).notNull().default(true),
  dailyQuoteEnabled: integer("daily_quote_enabled", { mode: "boolean" }).notNull().default(true),
  focusDefaultDuration: integer("focus_default_duration", { mode: "number" }).notNull().default(25),
  focusMaxRounds: integer("focus_max_rounds", { mode: "number" }).notNull().default(8),
  autoBackupEnabled: integer("auto_backup_enabled", { mode: "boolean" }).notNull().default(false),
  lastBackupAt: text("last_backup_at"),
  aiUsageStatsJson: text("ai_usage_stats_json"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// 3.14 文件元数据
// ============================================

export const fileAssets = sqliteTable("file_assets", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  originalName: text("original_name").notNull(),
  storagePath: text("storage_path").notNull(),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes", { mode: "number" }).notNull(),
  checksum: text("checksum"),
  sourceType: text("source_type").notNull(), // user_upload / web_collect
  knowledgeItemId: integer("knowledge_item_id", { mode: "number" }).references(() => knowledgeItems.id, { onDelete: "cascade" }),
  uploadedAt: text("uploaded_at").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// 逾期扫描日志（辅助表）
export const overdueScanLogs = sqliteTable("overdue_scan_logs", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  scannedAt: text("scanned_at").notNull(),
  overdueCount: integer("overdue_count", { mode: "number" }).notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
