-- 考试配置
CREATE TABLE IF NOT EXISTS exam_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_name TEXT NOT NULL,
  exam_level TEXT NOT NULL,
  exam_date TEXT,
  subjects_json TEXT NOT NULL,
  weekly_available_days INTEGER NOT NULL DEFAULT 5,
  daily_available_minutes INTEGER NOT NULL DEFAULT 150,
  first_run_completed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER
);

-- 科目
CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  exam_config_id INTEGER REFERENCES exam_config(id) ON DELETE CASCADE,
  created_at INTEGER,
  updated_at INTEGER
);

-- 章节
CREATE TABLE IF NOT EXISTS chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

-- 知识点
CREATE TABLE IF NOT EXISTS knowledge_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  difficulty INTEGER DEFAULT 3,
  created_at INTEGER,
  updated_at INTEGER
);

-- 计划任务
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  knowledge_point_ids TEXT,
  plan_date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  estimated_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'todo',
  original_date TEXT,
  postpone_count INTEGER NOT NULL DEFAULT 0,
  focus_sessions_json TEXT,
  completed_at TEXT,
  note TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

-- 知识库条目
CREATE TABLE IF NOT EXISTS knowledge_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL,
  category TEXT NOT NULL,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE SET NULL,
  knowledge_point_ids TEXT,
  content_type TEXT NOT NULL,
  content_text TEXT,
  content_markdown TEXT,
  file_path TEXT,
  file_size_bytes INTEGER,
  page_count INTEGER,
  source_url TEXT,
  source_name TEXT,
  ocr_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  parse_error TEXT,
  collected_at TEXT,
  confirmed_at TEXT,
  is_indexed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER
);

-- FTS5 虚拟表
CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_items_fts USING fts5(
  title, content_text, ocr_text,
  content='', content_rowid='docid'
);

-- 题目
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  knowledge_point_ids TEXT,
  type TEXT NOT NULL,
  stem TEXT NOT NULL,
  options_json TEXT,
  answer TEXT NOT NULL,
  explanation TEXT,
  difficulty INTEGER DEFAULT 3,
  source TEXT,
  source_type TEXT NOT NULL DEFAULT 'manual',
  similar_to_question_id INTEGER,
  created_from_mistake_id INTEGER,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER
);

-- 做题记录
CREATE TABLE IF NOT EXISTS answer_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  answer_given TEXT NOT NULL,
  is_correct INTEGER,
  time_spent_seconds INTEGER,
  answered_at TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'practice',
  mock_exam_record_id INTEGER,
  is_first_attempt INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER
);

-- 错题本
CREATE TABLE IF NOT EXISTS mistake_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  first_wrong_answer_record_id INTEGER,
  wrong_count INTEGER NOT NULL DEFAULT 1,
  review_count INTEGER NOT NULL DEFAULT 0,
  consecutive_correct INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unmastered',
  sm2_stage INTEGER NOT NULL DEFAULT 0,
  next_review_date TEXT NOT NULL,
  last_reviewed_at TEXT,
  error_tag TEXT DEFAULT 'other',
  error_tag_ai_suggested TEXT,
  is_manually_added INTEGER NOT NULL DEFAULT 0,
  removed_at TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

-- 笔记
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  knowledge_point_ids TEXT,
  mistake_record_ids TEXT,
  source_ai_message_id INTEGER,
  is_pinned INTEGER NOT NULL DEFAULT 0,
  tag_list TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

-- 学习记录
CREATE TABLE IF NOT EXISTS study_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_date TEXT NOT NULL,
  record_type TEXT NOT NULL,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  detail_json TEXT,
  created_at INTEGER
);

-- 模考记录
CREATE TABLE IF NOT EXISTS mock_exam_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  exam_date TEXT NOT NULL,
  score INTEGER NOT NULL,
  full_score INTEGER NOT NULL,
  time_spent_minutes INTEGER,
  question_count INTEGER NOT NULL,
  correct_count INTEGER,
  knowledge_point_coverage_json TEXT,
  note TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

-- 学习报告
CREATE TABLE IF NOT EXISTS study_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_type TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  data_json TEXT NOT NULL,
  ai_summary TEXT,
  ai_summary_failed INTEGER NOT NULL DEFAULT 0,
  generated_at TEXT NOT NULL,
  created_at INTEGER
);

-- AI 会话
CREATE TABLE IF NOT EXISTS ai_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  mode TEXT NOT NULL DEFAULT 'local_web',
  created_at INTEGER,
  updated_at INTEGER
);

-- AI 消息
CREATE TABLE IF NOT EXISTS ai_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER REFERENCES ai_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',
  citations_json TEXT,
  token_count INTEGER,
  model_used TEXT,
  created_at INTEGER
);

-- 徽章定义
CREATE TABLE IF NOT EXISTS badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  icon_name TEXT,
  created_at INTEGER
);

-- 用户徽章
CREATE TABLE IF NOT EXISTS user_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
  unlocked_at TEXT NOT NULL,
  is_new INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER
);

-- 设置
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  access_password_hash TEXT,
  access_password_enabled INTEGER NOT NULL DEFAULT 0,
  theme TEXT NOT NULL DEFAULT 'system',
  animation_enabled INTEGER NOT NULL DEFAULT 1,
  sound_enabled INTEGER NOT NULL DEFAULT 1,
  daily_quote_enabled INTEGER NOT NULL DEFAULT 1,
  focus_default_duration INTEGER NOT NULL DEFAULT 25,
  focus_max_rounds INTEGER NOT NULL DEFAULT 8,
  auto_backup_enabled INTEGER NOT NULL DEFAULT 0,
  last_backup_at TEXT,
  ai_usage_stats_json TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

-- 文件元数据
CREATE TABLE IF NOT EXISTS file_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  original_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER NOT NULL,
  checksum TEXT,
  source_type TEXT NOT NULL,
  knowledge_item_id INTEGER REFERENCES knowledge_items(id) ON DELETE CASCADE,
  uploaded_at TEXT NOT NULL,
  created_at INTEGER
);

-- 逾期扫描日志
CREATE TABLE IF NOT EXISTS overdue_scan_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scanned_at TEXT NOT NULL,
  overdue_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER
);
