# 备考工作台 · 技术架构设计 v1.0

> **设计输入：** PRD v0.3 评审稿（FR-001~FR-014、28 条验收标准）  
> **目标考试：** 软考高项 · 信息系统项目管理师（高级）  
> **部署形态：** 单用户、无登录、可选访问口令、平台托管 fullstack 全栈应用  
> **适用范围：** 研发实现与质检的直接输入  

---

## 目录

1. [设计约束与假设](#1-设计约束与假设)
2. [应用总体架构](#2-应用总体架构)
3. [数据模型](#3-数据模型)
4. [核心机制设计](#4-核心机制设计)
5. [API 端点清单](#5-api-端点清单)
6. [错误与边界处理约定](#6-错误与边界处理约定)
7. [仓库目录结构](#7-仓库目录结构)
8. [核心设计决策清单](#8-核心设计决策清单)

---

## 1. 设计约束与假设

### 1.1 已确认口径（必须覆盖）

| 编号 | 口径 | 设计影响 |
|------|------|----------|
| A-1 | 轻量自托管后端——单容器 + SQLite + 本地文件目录 | 数据库选型、文件存储路径、部署架构 |
| A-2 | 全程仅使用免费档：智谱 GLM-4.7-Flash（文本）、GLM-4.6V-Flash（视觉/OCR）、Tavily（联网搜索） | AI SDK 统一封装、多模型路由、降级路径 |
| A-3 | 目标考试：信息系统项目管理师（软考高级），三科目：综合知识 / 案例分析 / 论文 | 考试配置模型、示例数据、科目字段 |
| A-4 | 资料规模适中，个人备考文档合计 GB 级以内，单文件上限 100MB | SQLite 足够、文件分片阈值 |

### 1.2 知识库 12 类分类体系

考情分析、背诵本、默写本、考前冲刺、思维导图、知识点考点、历年真题、模拟卷、实用技巧、教材解读、学习计划、案例素材。

### 1.3 内容双来源

- `user_upload`：用户上传本地资料包（PDF / Word / Markdown / 纯文本 / 图片）
- `web_collect`：AI 联网搜集初始内容，经候选清单确认后入库

导入流水线必须区分标记两类来源，并在知识库列表中展示来源标识。

---

## 2. 应用总体架构

### 2.1 技术栈选型（默认方案）

| 层级 | 选型 | 理由 |
|------|------|------|
| 全栈框架 | Next.js 15 (App Router) | 一套代码同时承载前端页面与 API Routes，部署为单容器；SSR/CSR 按需；生态成熟 |
| 语言 | TypeScript | 全链路类型安全，减少接口契约错误 |
| 数据库 | SQLite (better-sqlite3) | PRD 确认口径；文件级便携，备份即复制；单用户场景完全够用 |
| ORM | Drizzle ORM | 轻量、TypeScript-first、原生支持 SQLite、迁移文件可版本控制 |
| 文件存储 | 本地文件系统（`./content/` 目录） | PRD 确认口径；与 SQLite 同机，备份时一起打包 |
| 全文检索 | SQLite FTS5 | 原生扩展，无需额外服务；支持中文分词（icu 或自定义 tokenizer） |
| AI 调用 | Vercel AI SDK + 自定义 Provider | 统一流式接口；封装智谱 OpenAI-compatible API + Tavily |
| 定时任务 | node-cron | 逾期扫描、周报生成、自动备份；单进程内运行 |
| 身份验证 | 自建中间件（bcrypt 哈希口令） | 无登录体系，仅可选访问口令 |
| 前端状态 | Zustand + SWR / TanStack Query | 轻量全局状态 + 服务端状态同步 |
| UI 组件 | shadcn/ui + Tailwind CSS | 快速构建响应式界面，无障碍基础保障 |
| Markdown | react-markdown + remark/rehype 插件 | 笔记渲染、AI 回答展示、公式支持（KaTeX） |

### 2.2 架构分层

```
┌─────────────────────────────────────────────────────────────┐
│                    前端层 (Next.js App Router)                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ 驾驶舱   │ │ 计划中心 │ │ 知识库   │ │ AI 助手  │  ...    │
│  │  (RSC)  │ │  (RSC)  │ │ (Client)│ │(Streaming)│         │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│  Zustand (全局)  +  SWR/TanStack Query (服务端状态缓存)       │
├─────────────────────────────────────────────────────────────┤
│                    API 层 (Next.js API Routes)                │
│  RESTful 端点 / AI Streaming 路由 / 文件上传接收               │
│  ├── 身份中间件（访问口令校验）                                │
│  ├── 请求校验（Zod）                                         │
│  └── 错误统一处理                                            │
├─────────────────────────────────────────────────────────────┤
│                    服务层 (Server Actions / Services)         │
│  ├── 计划服务（排期、逾期扫描、顺延）                         │
│  ├── 知识库服务（导入流水线、FTS 索引、归档）                 │
│  ├── AI 服务（RAG 检索、联网搜索、模型调用、引用组装）        │
│  ├── 做题服务（组卷、判分、错题入本）                         │
│  ├── 复习服务（SM-2 调度、队列生成）                          │
│  ├── 报告服务（周报/月报数据聚合、AI 总结）                   │
│  └── 备份服务（导出/导入、冲突处理）                          │
├─────────────────────────────────────────────────────────────┤
│                    数据层                                     │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │   SQLite 数据库  │    │  本地文件目录    │                 │
│  │  (better-sqlite3)│    │  ./content/      │                 │
│  │  · 结构化数据    │    │  · 原始资料文件  │                 │
│  │  · FTS5 索引    │    │  · 备份压缩包    │                 │
│  │  · 迁移文件     │    │  · 日志文件      │                 │
│  └─────────────────┘    └─────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
              ┌──────────┐      ┌──────────────┐
              │ 智谱 API  │      │ Tavily API   │
              │ (GLM-4.7 │      │ (联网搜索)   │
              │ / 4.6V)  │      │              │
              └──────────┘      └──────────────┘
```

### 2.3 9 个一级页面路由组织

| # | 页面 | 路由 | 渲染策略 | 核心数据依赖 |
|---|------|------|----------|-------------|
| 1 | 学习驾驶舱 | `/` | RSC + 客户端轮询 | 今日任务、复习队列、热力图、打卡 |
| 2 | 计划中心 | `/plan` | RSC + 客户端交互 | 大纲树、周排期、科目进度 |
| 3 | 知识库 | `/library` | 客户端（大量交互） | 知识库条目列表、FTS 检索 |
| 4 | AI 助手 | `/ai` | 客户端（Streaming） | 会话历史、知识库片段 |
| 5 | 题库与做题 | `/question` | 客户端 | 题库、组卷配置、做题状态 |
| 6 | 错题本与复习 | `/review` | 客户端 | 错题列表、复习队列、SM-2 状态 |
| 7 | 笔记 | `/note` | 客户端 | 笔记列表、Markdown 内容、关联 |
| 8 | 学习报告 | `/report` | RSC | 周报/月报数据、趋势图 |
| 9 | 设置 | `/settings` | 客户端 | 考试配置、AI 配置、口令、偏好 |

**全局布局：** 底部/侧边导航栏常驻，当前页高亮；设置页含子 Tab（考试目标 / AI 接入 / 访问口令 / 激励偏好 / 备份与清除）。

### 2.4 安全模型：访问口令

- 数据库 `settings` 表存储 `access_password_hash`（bcrypt）和 `access_password_enabled`（boolean）
- 首次部署默认关闭；用户在设置页开启时输入口令，bcrypt 哈希后入库
- 中间件校验逻辑：
  1. `access_password_enabled === false` → 放行
  2. Cookie 中携带有效 `session_token`（JWT，仅含 `authenticated: true`，无用户信息）→ 放行
  3. 请求 `/api/auth/verify` 并输入正确口令 → 下发 JWT Cookie，`maxAge: 7d`
  4. 连续输错 3 次 → 服务端记录 `lock_until` 时间戳，60 秒内拒绝该 IP 的校验请求
- 关闭口令时清除所有已下发的 session_token（服务端记录失效列表，或简化为重启清除）

---

## 3. 数据模型

### 3.1 ER 关系总览

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   exam_config   │────▶│    subjects     │────▶│    chapters     │────▶┌─────────────────┐
│   (1 条记录)     │     │   (3 科目)      │     │                 │     │ knowledge_points│
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       ▲                       ▲                       ▲
         │                       │                       │                       │
         ▼                       │                       │                       │
┌─────────────────┐              │                       │                       │
│    settings     │              │                       │                       │
│  (单用户配置)   │              │                       │                       │
└─────────────────┘              │                       │                       │
                                 │                       │                       │
┌─────────┐  ┌─────────┐  ┌─────┴─────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  tasks  │  │ notes   │  │questions  │  │mistake_  │  │knowledge_│  │answer_   │
│         │  │         │  │           │  │records   │  │items     │  │records   │
└─────────┘  └─────────┘  └───────────┘  └──────────┘  └──────────┘  └──────────┘
     ▲            ▲             ▲              ▲              ▲             ▲
     │            │             │              │              │             │
     └────────────┴─────────────┴──────────────┴──────────────┴─────────────┘
                                    │
                              ┌─────┴─────┐
                              │ study_    │
                              │ records   │
                              │(打卡/专注)│
                              └───────────┘
```

> 注：所有表均含 `created_at`（INTEGER, Unix 秒）和 `updated_at`（INTEGER, Unix 秒），除非特别说明。所有外键均设 `ON DELETE CASCADE` 或 `SET NULL`，按业务语义标注。

### 3.2 考试配置与科目树

#### `exam_config`（考试目标配置，1 条记录）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `exam_name` | TEXT | NOT NULL | 考试全称，如"信息系统项目管理师" |
| `exam_level` | TEXT | NOT NULL | 级别："高级" |
| `exam_date` | TEXT | | 考试日期 ISO 格式，如"2027-05-22"；未定时为空 |
| `subjects_json` | TEXT | NOT NULL | 科目清单 JSON，如 `[{"code":"zk","name":"综合知识"},{"code":"al","name":"案例分析"},{"code":"lw","name":"论文"}]` |
| `weekly_available_days` | INTEGER | NOT NULL, DEFAULT 5 | 每周可用天数 |
| `daily_available_minutes` | INTEGER | NOT NULL, DEFAULT 150 | 每日可用分钟数 |
| `first_run_completed` | BOOLEAN | NOT NULL, DEFAULT false | 首次引导是否完成 |

#### `subjects`（科目）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `code` | TEXT | NOT NULL, UNIQUE | 科目代码：zk / al / lw |
| `name` | TEXT | NOT NULL | 科目名称 |
| `sort_order` | INTEGER | NOT NULL, DEFAULT 0 | 排序 |
| `exam_config_id` | INTEGER | FK → exam_config.id | |

#### `chapters`（章节）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `subject_id` | INTEGER | FK → subjects.id, CASCADE | |
| `parent_id` | INTEGER | FK → chapters.id, CASCADE | 自引用，支持多级；根章节为 NULL |
| `name` | TEXT | NOT NULL | 章节名称 |
| `sort_order` | INTEGER | NOT NULL, DEFAULT 0 | |
| `description` | TEXT | | 章节简介 |

#### `knowledge_points`（知识点）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `chapter_id` | INTEGER | FK → chapters.id, CASCADE | |
| `name` | TEXT | NOT NULL | 知识点名称 |
| `sort_order` | INTEGER | NOT NULL, DEFAULT 0 | |
| `description` | TEXT | | 知识点描述 |
| `difficulty` | INTEGER | DEFAULT 3 | 难度 1~5 |

### 3.3 计划任务

#### `tasks`（计划任务）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `title` | TEXT | NOT NULL | 任务标题 |
| `subject_id` | INTEGER | FK → subjects.id, SET NULL | 关联科目 |
| `knowledge_point_ids` | TEXT | | 关联知识点 ID 数组 JSON，如 `[1,3,5]` |
| `plan_date` | TEXT | NOT NULL | 计划日期 ISO（YYYY-MM-DD） |
| `start_time` | TEXT | | 开始时间 HH:MM |
| `end_time` | TEXT | | 结束时间 HH:MM |
| `estimated_minutes` | INTEGER | | 预计用时（分钟） |
| `status` | TEXT | NOT NULL, DEFAULT 'todo' | 状态：todo / in_progress / done / skipped / overdue |
| `original_date` | TEXT | | 原始计划日期（顺延记录用） |
| `postpone_count` | INTEGER | NOT NULL, DEFAULT 0 | 顺延次数 |
| `focus_sessions_json` | TEXT | | 专注记录数组 JSON：`[{session_id, start_at, end_at, duration_seconds}]` |
| `completed_at` | TEXT | | 完成时间 ISO |
| `note` | TEXT | | 任务备注 |

**状态机：**
```
todo ──(启动专注)──▶ in_progress ──(计时结束/打卡)──▶ done
  │                      │
  │                      └──(退出并确认)──▶ todo (本轮不记录)
  │
  └──(每日 0 点扫描 plan_date < today 且 status=todo)──▶ overdue

overdue ──(默认顺延)──▶ todo (plan_date = today, postpone_count += 1)
overdue ──(用户改跳过)──▶ skipped

done ──(当日可撤销一次)──▶ todo
```

### 3.4 知识库条目（统一模型）

#### `knowledge_items`（知识库统一条目模型）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `title` | TEXT | NOT NULL | 资料标题 |
| `source_type` | TEXT | NOT NULL | 来源：`user_upload` / `web_collect` |
| `category` | TEXT | NOT NULL | 12 类之一（见下方映射） |
| `subject_id` | INTEGER | FK → subjects.id, SET NULL | 归档科目 |
| `chapter_id` | INTEGER | FK → chapters.id, SET NULL | 归档章节 |
| `knowledge_point_ids` | TEXT | | 关联知识点 ID 数组 JSON |
| `content_type` | TEXT | NOT NULL | 内容类型：`pdf` / `word` / `markdown` / `text` / `image` / `webpage` |
| `content_text` | TEXT | | 解析后的纯文本全文（用于 FTS 检索） |
| `content_markdown` | TEXT | | Markdown 版本（若有） |
| `file_path` | TEXT | | 原始文件在 `./content/` 下的相对路径；网页来源存归档 HTML |
| `file_size_bytes` | INTEGER | | 文件大小 |
| `page_count` | INTEGER | | 页数（PDF/Word） |
| `source_url` | TEXT | | 原始 URL（网页来源必填，上传来源可为空） |
| `source_name` | TEXT | | 来源站点/文件名 |
| `ocr_text` | TEXT | | 图片 OCR 结果 |
| `status` | TEXT | NOT NULL, DEFAULT 'pending' | `pending`(待确认) / `parsed`(已解析) / `archived`(已归档) / `failed`(解析失败) |
| `parse_error` | TEXT | | 解析失败原因 |
| `collected_at` | TEXT | | 搜集/上传时间 ISO |
| `confirmed_at` | TEXT | | 用户确认入库时间（web_collect 必填） |
| `is_indexed` | BOOLEAN | NOT NULL, DEFAULT false | 是否已加入 FTS 索引 |

**12 类分类映射（`category` 枚举值）：**

| 枚举值 | 中文名 | 典型内容 |
|--------|--------|----------|
| `exam_analysis` | 考情分析 | 历年考情统计、分值分布 |
| `recitation` | 背诵本 | 需记忆的知识点条文 |
| `dictation` | 默写本 | 默写练习内容与答案 |
| `sprint` | 考前冲刺 | 考前重点速记、押题范围（仅标注，不承诺） |
| `mind_map` | 思维导图 | 结构化知识图谱 |
| `knowledge_point` | 知识点考点 | 单个考点的详解 |
| `past_exam` | 历年真题 | 历年考试真题 |
| `mock_exam` | 模拟卷 | 模拟考试试卷 |
| `tips` | 实用技巧 | 答题技巧、记忆口诀 |
| `textbook` | 教材解读 | 官方教材章节解读 |
| `study_plan` | 学习计划 | 阶段性学习计划模板 |
| `case_material` | 案例素材 | 案例分析素材与范文 |

**FTS5 虚拟表：** `knowledge_items_fts(docid, title, content_text, ocr_text)`，通过 `knowledge_items.id` 关联。

### 3.5 题目与做题记录

#### `questions`（题库题目）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `subject_id` | INTEGER | FK → subjects.id, CASCADE | |
| `knowledge_point_ids` | TEXT | | 关联知识点 ID 数组 JSON |
| `type` | TEXT | NOT NULL | `single_choice` / `multiple_choice` / `true_false` / `fill_blank` / `essay`（简答/论述） |
| `stem` | TEXT | NOT NULL | 题干 |
| `options_json` | TEXT | | 选项 JSON：`[{label:"A",text:"..."},...]`；主观题为空 |
| `answer` | TEXT | NOT NULL | 正确答案（客观题存选项标签，主观题存参考答案） |
| `explanation` | TEXT | | 答案解析 |
| `difficulty` | INTEGER | DEFAULT 3 | 1~5 |
| `source` | TEXT | | 来源：真题年份/模拟卷名/AI生成 |
| `source_type` | TEXT | NOT NULL, DEFAULT 'manual' | `manual` / `import` / `ai_generated` |
| `similar_to_question_id` | INTEGER | FK → questions.id, SET NULL | 相似题关联 |
| `created_from_mistake_id` | INTEGER | FK → mistake_records.id, SET NULL | 是否由错题手动录入转化 |
| `is_deleted` | BOOLEAN | NOT NULL, DEFAULT false | 软删除 |

#### `answer_records`（做题记录）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `question_id` | INTEGER | FK → questions.id, CASCADE | |
| `answer_given` | TEXT | NOT NULL | 用户给出的答案 |
| `is_correct` | BOOLEAN | | 是否正确；主观题为 NULL |
| `time_spent_seconds` | INTEGER | | 用时（秒） |
| `answered_at` | TEXT | NOT NULL | 作答时间 ISO |
| `source` | TEXT | NOT NULL, DEFAULT 'practice' | `practice`(单题练习) / `mock_exam`(模考) / `review`(错题复习) |
| `mock_exam_record_id` | INTEGER | FK → mock_exam_records.id, SET NULL | 模考关联 |
| `is_first_attempt` | BOOLEAN | NOT NULL, DEFAULT true | 是否首次作答 |

### 3.6 错题本与 SM-2 复习状态

#### `mistake_records`（错题本记录）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `question_id` | INTEGER | FK → questions.id, CASCADE | 关联题目 |
| `first_wrong_answer_record_id` | INTEGER | FK → answer_records.id | 首次做错记录 |
| `wrong_count` | INTEGER | NOT NULL, DEFAULT 1 | 累计做错次数 |
| `review_count` | INTEGER | NOT NULL, DEFAULT 0 | 累计复习次数 |
| `consecutive_correct` | INTEGER | NOT NULL, DEFAULT 0 | 连续答对次数 |
| `status` | TEXT | NOT NULL, DEFAULT 'unmastered' | `unmastered`(未掌握) / `reviewing`(复习中) / `mastered`(已掌握) |
| `sm2_stage` | INTEGER | NOT NULL, DEFAULT 0 | SM-2 档位：0(新入本) / 1(1天) / 2(3天) / 3(7天) / 4(14天) |
| `next_review_date` | TEXT | NOT NULL | 下次复习日期 YYYY-MM-DD |
| `last_reviewed_at` | TEXT | | 上次复习时间 ISO |
| `error_tag` | TEXT | DEFAULT 'other' | `concept_confusion`(概念混淆) / `calculation_error`(计算失误) / `misreading`(审题偏差) / `memory_lapse`(记忆遗漏) / `other`(其他) |
| `error_tag_ai_suggested` | TEXT | | AI 归因建议（用户可修改） |
| `is_manually_added` | BOOLEAN | NOT NULL, DEFAULT false | 是否手动录入（非做题自动入本） |
| `removed_at` | TEXT | | 移出错题本时间（回退已掌握时记录） |

**SM-2 状态机：**
```
新入本 ──▶ sm2_stage=0, next_review_date=today+1

复习反馈：
  答对/不确定且感觉会 ──▶ sm2_stage += 1 (max 4), next_review_date = today + [1,3,7,14][sm2_stage]
  答错/不确定且不会 ──▶ sm2_stage = 1, next_review_date = today+1, consecutive_correct = 0

连续 2 次答对 ──▶ status='mastered', removed_at=now
已掌握可手动回退 ──▶ status='reviewing', sm2_stage=2, next_review_date=today+3
```

### 3.7 笔记

#### `notes`（笔记）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `title` | TEXT | NOT NULL | 笔记标题 |
| `content` | TEXT | NOT NULL | Markdown 原文 |
| `subject_id` | INTEGER | FK → subjects.id, SET NULL | 归属科目 |
| `knowledge_point_ids` | TEXT | | 关联知识点 ID 数组 JSON |
| `mistake_record_ids` | TEXT | | 关联错题 ID 数组 JSON |
| `source_ai_message_id` | INTEGER | FK → ai_messages.id, SET NULL | 来源 AI 对话消息 |
| `is_pinned` | BOOLEAN | NOT NULL, DEFAULT false | 置顶 |
| `tag_list` | TEXT | | 标签数组 JSON |

**关联双向可见：** 在 `knowledge_points` 和 `mistake_records` 的详情页，通过反向查询 `notes` 表展示关联笔记。

**取消关联级联选项：**
- 仅取消本条笔记的关联 → 更新 `notes.knowledge_point_ids` 或 `mistake_record_ids`
- 取消并删除笔记 → 删除整篇笔记（二次确认）

### 3.8 学习记录

#### `study_records`（学习记录：打卡 / 专注 / 热力图）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `record_date` | TEXT | NOT NULL | 日期 YYYY-MM-DD |
| `record_type` | TEXT | NOT NULL | `focus`(专注) / `check_in`(打卡) / `question`(做题) / `review`(复习) |
| `subject_id` | INTEGER | FK → subjects.id, SET NULL | 关联科目（可选） |
| `task_id` | INTEGER | FK → tasks.id, SET NULL | 关联任务（专注时） |
| `duration_seconds` | INTEGER | NOT NULL, DEFAULT 0 | 时长（秒） |
| `detail_json` | TEXT | | 扩展信息 JSON：番茄轮数、做题数、复习题数等 |
| `created_at` | TEXT | NOT NULL | 记录时间 ISO |

**打卡规则：** 单日完成至少 1 个专注轮次（`record_type='focus'` 且 `duration_seconds >= 25*60`）即视为打卡成功。连续打卡天数通过扫描历史记录计算。

**热力图数据源：** 按 `record_date` 分组，聚合 `duration_seconds`（专注）或 `SUM(duration_seconds)`，按周排列。

### 3.9 模考记录

#### `mock_exam_records`（模考记录）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `subject_id` | INTEGER | FK → subjects.id, SET NULL | |
| `name` | TEXT | NOT NULL | 模考名称 |
| `exam_date` | TEXT | NOT NULL | 模考日期 |
| `score` | INTEGER | NOT NULL | 得分 |
| `full_score` | INTEGER | NOT NULL | 满分 |
| `time_spent_minutes` | INTEGER | | 用时（分钟） |
| `question_count` | INTEGER | NOT NULL | 题目数量 |
| `correct_count` | INTEGER | | 正确数 |
| `knowledge_point_coverage_json` | TEXT | | 知识点覆盖 JSON：`[{kp_id, count, correct}]` |
| `note` | TEXT | | 备注 |

### 3.10 学习报告

#### `study_reports`（学习报告）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `report_type` | TEXT | NOT NULL | `weekly`(周报) / `monthly`(月报) |
| `period_start` | TEXT | NOT NULL | 周期开始日期 |
| `period_end` | TEXT | NOT NULL | 周期结束日期 |
| `data_json` | TEXT | NOT NULL | 报告数据 JSON（见下方结构） |
| `ai_summary` | TEXT | | AI 生成的总结与建议 |
| `ai_summary_failed` | BOOLEAN | NOT NULL, DEFAULT false | AI 总结是否失败 |
| `generated_at` | TEXT | NOT NULL | 生成时间 ISO |

**`data_json` 结构（周报）：**
```json
{
  "focus_hours": 18.5,
  "focus_hours_change": 2.3,
  "plan_completion_rate": 0.76,
  "plan_completion_change": 0.09,
  "first_attempt_accuracy": 0.68,
  "first_attempt_accuracy_change": -0.02,
  "new_mastered_count": 9,
  "new_mistake_count": 11,
  "weak_knowledge_points": [
    {"kp_id": 12, "name": "挣值分析", "wrong_count": 12}
  ],
  "daily_focus_minutes": [120, 90, 150, ...],
  "task_status_counts": {"done": 12, "skipped": 2, "overdue": 1}
}
```

### 3.11 AI 会话

#### `ai_sessions`（AI 会话）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `title` | TEXT | | 会话标题（首条消息摘要） |
| `mode` | TEXT | NOT NULL, DEFAULT 'local_web' | `local` / `web` / `local_web` |
| `created_at` | TEXT | NOT NULL | |
| `updated_at` | TEXT | NOT NULL | |

#### `ai_messages`（AI 消息）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `session_id` | INTEGER | FK → ai_sessions.id, CASCADE | |
| `role` | TEXT | NOT NULL | `user` / `assistant` / `system` |
| `content` | TEXT | NOT NULL | 消息内容 |
| `content_type` | TEXT | NOT NULL, DEFAULT 'text' | `text` / `markdown` |
| `citations_json` | TEXT | | 引用数组 JSON：`[{source_type, title, location, url}]` |
| `token_count` | INTEGER | | 估算 token 数 |
| `model_used` | TEXT | | 使用的模型名 |
| `created_at` | TEXT | NOT NULL | |

### 3.12 激励与徽章

#### `badges`（徽章定义，初始化数据）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `code` | TEXT | NOT NULL, UNIQUE | 徽章代码 |
| `name` | TEXT | NOT NULL | 徽章名称 |
| `description` | TEXT | NOT NULL | 解锁条件描述 |
| `category` | TEXT | NOT NULL | `streak`(连续打卡) / `milestone`(里程碑) / `progress`(进度) |
| `icon_name` | TEXT | | 图标标识 |

#### `user_badges`（用户已获得徽章）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `badge_id` | INTEGER | FK → badges.id, CASCADE | |
| `unlocked_at` | TEXT | NOT NULL | 解锁时间 |
| `is_new` | BOOLEAN | NOT NULL, DEFAULT true | 是否未读（用于新徽章提示） |

### 3.13 设置与系统

#### `settings`（系统设置，单条记录，id=1）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PK, DEFAULT 1 | 固定为 1 |
| `access_password_hash` | TEXT | | bcrypt 哈希 |
| `access_password_enabled` | BOOLEAN | NOT NULL, DEFAULT false | |
| `theme` | TEXT | NOT NULL, DEFAULT 'system' | `light` / `dark` / `system` |
| `animation_enabled` | BOOLEAN | NOT NULL, DEFAULT true | 激励动效 |
| `sound_enabled` | BOOLEAN | NOT NULL, DEFAULT true | 提示音 |
| `daily_quote_enabled` | BOOLEAN | NOT NULL, DEFAULT true | 每日一句 |
| `focus_default_duration` | INTEGER | NOT NULL, DEFAULT 25 | 默认专注时长（分钟） |
| `focus_max_rounds` | INTEGER | NOT NULL, DEFAULT 8 | 连续轮数上限 |
| `auto_backup_enabled` | BOOLEAN | NOT NULL, DEFAULT false | 自动备份 |
| `last_backup_at` | TEXT | | 上次备份时间 |
| `ai_usage_stats_json` | TEXT | | AI 用量统计 JSON |

### 3.14 文件元数据

#### `file_assets`（上传文件元数据）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `original_name` | TEXT | NOT NULL | 原始文件名 |
| `storage_path` | TEXT | NOT NULL | `./content/` 下的相对路径 |
| `mime_type` | TEXT | | MIME 类型 |
| `size_bytes` | INTEGER | NOT NULL | 大小 |
| `checksum` | TEXT | | SHA-256 校验和 |
| `source_type` | TEXT | NOT NULL | `user_upload` / `web_collect` |
| `knowledge_item_id` | INTEGER | FK → knowledge_items.id, CASCADE | 关联知识库条目 |
| `uploaded_at` | TEXT | NOT NULL | |

---

## 4. 核心机制设计

### 4.1 SM-2 简化调度

**间隔序列：** `[1, 3, 7, 14]` 天，对应 `sm2_stage` 取值 `1~4`。新入本 `sm2_stage=0`，首次复习在 1 天后。

**复习反馈处理：**

```typescript
function processReviewFeedback(mistakeId: number, feedback: 'correct' | 'wrong' | 'unsure') {
  const mr = db.query('SELECT * FROM mistake_records WHERE id = ?', [mistakeId]);
  const today = getTodayISO(); // YYYY-MM-DD

  if (feedback === 'wrong' || feedback === 'unsure') {
    // 重置
    mr.sm2_stage = 1; // 回到 1 天档
    mr.next_review_date = addDays(today, 1);
    mr.consecutive_correct = 0;
    mr.status = 'unmastered';
  } else {
    // 答对
    mr.consecutive_correct += 1;
    if (mr.consecutive_correct >= 2) {
      mr.status = 'mastered';
      mr.removed_at = nowISO();
    } else {
      const intervals = [1, 1, 3, 7, 14];
      mr.sm2_stage = Math.min(mr.sm2_stage + 1, 4);
      mr.next_review_date = addDays(today, intervals[mr.sm2_stage]);
      mr.status = 'reviewing';
    }
  }
  mr.review_count += 1;
  mr.last_reviewed_at = nowISO();
  db.update(mr);
}
```

**每日复习队列生成：**
```sql
SELECT * FROM mistake_records
WHERE status IN ('unmastered', 'reviewing')
  AND next_review_date <= ?
ORDER BY sm2_stage ASC, next_review_date ASC
```
参数为今日日期。

**手动回退已掌握：** 用户可将 `status='mastered'` 的错题回退到 `reviewing`，`sm2_stage=2`（3 天后），`next_review_date=today+3`，`consecutive_correct=0`。

### 4.2 逾期顺延扫描

**触发：** 每日 0 点（用户时区）由 node-cron 执行，或用户首次访问驾驶舱时懒检查。

**扫描规则：**
```typescript
function scanOverdueTasks() {
  const today = getTodayISO();
  const overdueTasks = db.query(
    `SELECT * FROM tasks WHERE status = 'todo' AND plan_date < ?`,
    [today]
  );

  for (const task of overdueTasks) {
    // 默认顺延到今日
    task.original_date = task.original_date || task.plan_date;
    task.plan_date = today;
    task.postpone_count += 1;
    task.status = 'todo'; // 保持 todo
    db.update(task);
  }

  // 记录扫描日志
  db.insert('overdue_scan_logs', { scanned_at: nowISO(), overdue_count: overdueTasks.length });
}
```

**周日晚调整建议：** 每周日 23:00 自动生成，基于本周数据：
- 计划完成率 < 50% → 建议减少下周任务量或调整科目配比
- 某科目错题连续两周 Top 1 → 建议增加该科目专项练习
- 论文科目完成率最低 → 建议增加论文频次

建议以 AI 生成（若可用）或模板规则生成，展示在计划中心顶部，需用户确认后生效。

### 4.3 番茄钟计时与暂停超时

**专注会话模型：**

```typescript
interface FocusSession {
  id: string;           // UUID
  task_id: number;      // 关联任务
  duration_minutes: number; // 设定时长：15 / 25 / 45
  started_at: string;   // ISO
  paused_at: string | null;
  resumed_at: string | null;
  total_paused_seconds: number;
  ended_at: string | null;
  status: 'running' | 'paused' | 'completed' | 'abandoned';
}
```

**规则：**
1. 启动专注 → 创建 session，`status='running'`
2. 暂停 → `paused_at = now`，`status='paused'`
3. 恢复 → `resumed_at = now`，`total_paused_seconds += (resumed - paused)`，`status='running'`
4. 暂停超 30 分钟（无恢复）→ 视为放弃，`status='abandoned'`，不累计时长
5. 倒计时结束 → `status='completed'`，实际时长 = `duration_minutes * 60` 秒
6. 用户主动退出并确认 → `status='abandoned'`，不累计时长
7. 页面关闭/刷新检测：使用 `beforeunload` 弹窗提示「正在专注中，关闭将丢失本轮记录」

**有效时长计算：**
```typescript
const effectiveDuration =
  status === 'completed' ? duration_minutes * 60 :
  status === 'abandoned' ? 0 :
  Math.max(0, Math.floor((now - started_at) / 1000) - total_paused_seconds);
```

### 4.4 周报自动生成口径

**生成时机：** 每周日 23:00（用户时区）。

**数据口径：**

| 指标 | 计算方式 | 来源表 |
|------|----------|--------|
| 本周专注时长 | `SUM(duration_seconds)` WHERE `record_type='focus'` AND `record_date` 在本周 | `study_records` |
| 计划完成率 | `COUNT(status='done') / COUNT(*)` WHERE `plan_date` 在本周 | `tasks` |
| 首次作答正确率 | `COUNT(is_correct=true AND is_first_attempt=true) / COUNT(is_first_attempt=true)` | `answer_records` |
| 错题转已掌握 | `COUNT(status 从非 mastered 变为 mastered)` 本周 | `mistake_records` |
| 薄弱知识点 Top 5 | 近 30 天 `answer_records` JOIN `questions` GROUP BY `knowledge_point_id` ORDER BY 错误次数 DESC LIMIT 5 | `answer_records` + `questions` |

**AI 总结生成：** 将上述数据 JSON 发给 AI，Prompt 模板：
```
基于以下本周学习数据，生成一段 200~300 字的总结与下周建议：
- 专注时长、计划完成率、正确率及环比变化
- 薄弱知识点 Top 5
- 错题掌握变化
要求：① 语气鼓励但客观；② 具体建议而非泛泛；③ 不制造焦虑。
```

**降级：** AI 不可用时，`ai_summary` 为空，`ai_summary_failed=true`，前端展示「AI 总结暂不可用」。

### 4.5 知识库导入流水线

**流程：**

```
上传/搜集 ──▶ 接收文件 ──▶ 格式校验 ──▶ 存入 ./content/ ──▶ 解析队列
                                                         │
                              ┌──────────────────────────┘
                              ▼
                    ┌─────────────────┐
                    │   解析阶段        │
                    │  · PDF → 文本    │
                    │  · Word → 文本   │
                    │  · 图片 → OCR    │
                    │  · 网页 → 正文   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
           解析成功        解析失败        需要确认
              │              │              │
              ▼              ▼              ▼
         AI 自动归档    status='failed'   status='pending'
         (科目/章节)    parse_error=原因   (web_collect)
              │              │              │
              ▼              ▼              ▼
         生成 FTS 索引   保留原文件       用户确认后归档
         is_indexed=true                status='archived'
```

**关键实现点：**
- 文件接收：API Route 接收 multipart/form-data，校验 MIME 类型和大小（≤100MB），存 `./content/uploads/{uuid}/{original_name}`
- PDF 解析：`pdf-parse` 提取文本，记录页码映射
- Word 解析：`mammoth` 提取为 HTML 再转纯文本
- 图片 OCR：调用智谱 GLM-4.6V-Flash，返回结构化文本
- 网页抓取：服务端通过 `fetch` 获取正文，使用 `readability` 类库提取主要内容
- AI 归档：将解析后的文本前 2000 字 + 文件名发给 AI，返回建议的 `subject_id`、`chapter_id`、`category`
- FTS 索引：解析完成后，插入/更新 `knowledge_items_fts` 虚拟表

**双来源标记：** `source_type` 字段在文件接收时即确定，不可修改。`web_collect` 来源的条目初始 `status='pending'`，必须经用户确认后才变为 `archived`。

### 4.6 AI 助手

#### 4.6.1 RAG 引用机制

**检索流程：**
1. 用户提问 → 对问题做向量化（可选：使用智谱 Embedding API 或基于关键词的 FTS）
2. 查询 SQLite FTS5：`SELECT docid, rank FROM knowledge_items_fts WHERE knowledge_items_fts MATCH ? ORDER BY rank LIMIT 5`
3. 取回对应 `knowledge_items` 的 `content_text` 片段
4. 组装 Prompt：
```
基于以下资料回答问题。若资料不足以回答，请明确声明。

[资料 1] {title}（{source_type}，{location}）
{content_snippet}

[资料 2] ...

用户问题：{question}
```

**引用组装：** AI 回答返回后，前端解析特殊标记（如 `[^1^]`），映射到 `citations_json`：
```json
[
  {
    "source_type": "user_upload",
    "title": "信息系统项目管理师教程（第4版）",
    "location": "P348 · 第7.4节",
    "url": null,
    "knowledge_item_id": 12
  },
  {
    "source_type": "web_collect",
    "title": "挣值分析三分钟搞懂",
    "location": "段落3",
    "url": "https://...",
    "knowledge_item_id": 23
  }
]
```

点击引用跳转：本地来源 → 知识库详情页并定位到片段；联网来源 → 新标签页打开 URL。

#### 4.6.2 联网模式

- `mode='web'`：禁用本地 RAG，仅使用 Tavily 搜索，组装方式同 RAG
- `mode='local_web'`：先 RAG 检索，再 Tavily 补充，合并去重后组装
- Tavily 结果需经可信度过滤（域名白名单/黑名单），只取前 3 条

#### 4.6.3 安全边界（三条红线）

**Prompt 层硬编码：**
```
你必须遵守以下规则：
1. 若用户问题涉及资料未覆盖的内容，必须回答「资料未覆盖，以下仅为模型生成内容，不构成权威依据」。
2. 禁止出现「押题」「保过」「必过」等确定性预测话术；涉及预测必须说明不确定性。
3. 所有生成内容必须标注「AI生成」；联网资料仅自用，不得作为对外权威引用。
```

**前端标识：** AI 回答顶部固定显示「AI生成 · 基于知识库/联网」；无可追溯来源时显示「无来源依据，仅为模型生成」。

**反馈入口：** 每条 AI 回答底部提供「来源不符？」按钮，点击记录到 `ai_feedback` 表（待实现，P0 预留表结构）。

#### 4.6.4 AI 不可用降级路径

| 场景 | 降级行为 | 前端表现 |
|------|----------|----------|
| AI API 返回 5xx/超时 | 提示用户重试或切换模式 | 输入框上方显示黄色提示条「AI 服务暂不可用，可稍后重试」 |
| Tavily 不可用（本地模式仍可用） | 自动切换为仅本地模式 | 模式选择器禁用「联网」，提示「联网搜索暂不可用」 |
| 智谱 API 不可用 | AI 助手页面所有功能禁用 | 显示「AI 助手暂不可用」，保留历史会话只读浏览 |
| 知识库为空时提问 | 直接走联网模式；联网也不可用时按规则 1 声明 | 正常对话，回答附「资料未覆盖」声明 |

**核心学习功能离线可用清单：**
- 计划中心（所有功能）
- 专注模式（纯本地计时）
- 题库与做题（本地判分）
- 错题本与复习（SM-2 调度纯本地计算）
- 笔记（纯本地编辑）
- 学习报告（数据部分纯本地聚合，AI 总结缺失）

---

## 5. API 端点清单

### 5.1 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/verify` | 校验访问口令，成功下发 JWT Cookie |
| POST | `/api/auth/logout` | 清除 Cookie |
| GET | `/api/auth/status` | 查询当前认证状态 |

### 5.2 考试配置与科目树

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/exam-config` | 获取考试配置 |
| PUT | `/api/exam-config` | 更新考试配置 |
| GET | `/api/subjects` | 获取科目列表（含章节树） |
| POST | `/api/subjects` | 创建科目（引导流程） |
| GET | `/api/chapters` | 获取章节列表 |
| POST | `/api/chapters` | 创建章节 |
| GET | `/api/knowledge-points` | 获取知识点列表 |
| POST | `/api/knowledge-points` | 创建知识点 |

### 5.3 计划中心

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tasks` | 查询任务（支持按日期范围、科目、状态筛选） |
| POST | `/api/tasks` | 创建任务 |
| PUT | `/api/tasks/:id` | 更新任务（改期、改状态） |
| DELETE | `/api/tasks/:id` | 删除任务 |
| POST | `/api/tasks/bulk-postpone` | 批量顺延 |
| POST | `/api/tasks/undo-complete/:id` | 撤销完成（当日限一次） |
| POST | `/api/outline/parse` | AI 解析大纲文本/文件为科目-章节-知识点树 |
| POST | `/api/outline/confirm` | 确认解析结果入库并生成排期 |
| GET | `/api/plan/weekly` | 获取本周排期 |
| GET | `/api/plan/adjust-suggestion` | 获取 AI 调整建议 |

### 5.4 知识库

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/library` | 查询知识库条目（支持分页、科目筛选、分类筛选、关键词搜索） |
| POST | `/api/library/upload` | 上传文件（multipart/form-data） |
| POST | `/api/library/web-collect` | 触发联网搜集 |
| POST | `/api/library/confirm` | 确认候选清单入库 |
| GET | `/api/library/:id` | 获取条目详情 |
| PUT | `/api/library/:id` | 更新条目（归档调整） |
| DELETE | `/api/library/:id` | 删除条目（连带删除文件） |
| GET | `/api/library/search` | 全文检索（FTS） |
| POST | `/api/library/:id/retry-parse` | 重新解析失败文件 |

### 5.5 AI 助手

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/ai/sessions` | 获取会话列表 |
| POST | `/api/ai/sessions` | 创建新会话 |
| GET | `/api/ai/sessions/:id/messages` | 获取会话消息 |
| POST | `/api/ai/chat` | 发送消息（SSE 流式返回） |
| POST | `/api/ai/quick-action` | 快捷指令（生成口诀/类比/费曼反问） |
| POST | `/api/ai/save-to-note` | 将 AI 消息保存为笔记 |
| POST | `/api/ai/collect` | 联网搜集（知识库复用） |

### 5.6 题库与做题

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/questions` | 查询题目（支持科目、知识点、难度、类型筛选） |
| POST | `/api/questions` | 创建题目 |
| POST | `/api/questions/bulk-import` | 批量导入（Excel/CSV/JSON） |
| POST | `/api/questions/ai-generate` | AI 按知识点生成题目 |
| GET | `/api/questions/:id` | 获取题目详情 |
| PUT | `/api/questions/:id` | 更新题目 |
| DELETE | `/api/questions/:id` | 删除题目（询问是否连带删错题） |
| POST | `/api/questions/:id/answer` | 提交答案（返回判分结果，错题自动入本） |
| POST | `/api/mock-exams` | 创建组卷模考 |
| GET | `/api/mock-exams/:id` | 获取模考详情与题目 |
| POST | `/api/mock-exams/:id/submit` | 交卷（自动判分客观题，生成模考记录） |

### 5.7 错题本与复习

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/mistakes` | 查询错题（支持状态、错因、科目筛选） |
| POST | `/api/mistakes/manual` | 手动录入错题 |
| GET | `/api/mistakes/review-queue` | 获取今日复习队列 |
| POST | `/api/mistakes/:id/review` | 提交复习反馈（答对/答错/不确定） |
| POST | `/api/mistakes/:id/rollback` | 已掌握回退到复习中 |
| PUT | `/api/mistakes/:id/error-tag` | 修改错因标签 |

### 5.8 笔记

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/notes` | 查询笔记（支持科目、标签筛选） |
| POST | `/api/notes` | 创建笔记 |
| GET | `/api/notes/:id` | 获取笔记详情 |
| PUT | `/api/notes/:id` | 更新笔记 |
| DELETE | `/api/notes/:id` | 删除笔记 |
| PUT | `/api/notes/:id/link` | 关联知识点/错题 |
| DELETE | `/api/notes/:id/link` | 取消关联（支持级联删除选项） |

### 5.9 学习报告

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/reports/weekly` | 获取周报列表 |
| GET | `/api/reports/weekly/:period` | 获取指定周报 |
| GET | `/api/reports/monthly` | 获取月报列表 |
| GET | `/api/dashboard` | 驾驶舱数据聚合（今日任务、复习队列、打卡、热力图） |
| GET | `/api/stats/focus-trend` | 专注时长趋势 |
| GET | `/api/stats/accuracy-trend` | 正确率趋势 |
| GET | `/api/stats/weak-points` | 薄弱知识点 |

### 5.10 设置与备份

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/settings` | 获取设置 |
| PUT | `/api/settings` | 更新设置 |
| POST | `/api/settings/password` | 设置/修改/关闭访问口令 |
| POST | `/api/backup/export` | 全量导出（生成压缩包） |
| POST | `/api/backup/import` | 全量导入（处理冲突：合并/覆盖） |
| POST | `/api/backup/clear-all` | 清除全部数据（二次确认+5秒等待由前端处理，后端执行 DELETE） |
| POST | `/api/backup/clear-ai` | 清除 AI 缓存与会话 |

---

## 6. 错误与边界处理约定

### 6.1 HTTP 状态码约定

| 场景 | 状态码 | 响应体结构 |
|------|--------|-----------|
| 成功 | 200 / 201 | `{ success: true, data: ... }` |
| 参数校验失败 | 400 | `{ success: false, error: { code: 'VALIDATION_ERROR', message: '...', field?: '...' } }` |
| 访问口令未通过 | 401 | `{ success: false, error: { code: 'AUTH_REQUIRED' / 'INVALID_PASSWORD' / 'LOCKED', lockUntil?: '...' } }` |
| 无权限（单用户无此场景，预留） | 403 | `{ success: false, error: { code: 'FORBIDDEN' } }` |
| 资源不存在 | 404 | `{ success: false, error: { code: 'NOT_FOUND', resource: '...' } }` |
| 业务规则冲突 | 409 | `{ success: false, error: { code: 'CONFLICT', message: '...' } }` |
| AI 服务不可用 | 503 | `{ success: false, error: { code: 'AI_UNAVAILABLE', message: 'AI 服务暂不可用' } }` |
| 服务端错误 | 500 | `{ success: false, error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } }` |

### 6.2 关键边界处理

| 场景 | 处理方式 |
|------|----------|
| 大纲解析失败 | 返回具体原因（`UNSUPPORTED_FORMAT` / `CONTENT_TOO_SHORT` / `PARSE_ERROR`），原文保留在临时表或返回给前端 |
| 文件上传损坏/加密 PDF | `status='failed'`，`parse_error` 记录原因，原文件保留，用户可重新上传 |
| 题干相似度超阈值 | 创建题目时返回 `SIMILAR_QUESTION_FOUND`，展示相似题，需用户确认后才创建 |
| 删除题目连带错题 | 返回 `HAS_MISTAKE_RECORDS`，询问是否一并删除；确认后级联删除 |
| 计划日期超出考试日期 | 返回 `EXCEEDS_EXAM_DATE`，拦截保存 |
| 模考得分超满分 | 返回 `SCORE_EXCEEDS_FULL`，拦截保存 |
| 导入结构不兼容 | 备份导入时检测 schema 版本，不兼容时返回 `INCOMPATIBLE_SCHEMA`，保留原数据不覆盖 |
| AI 回答生成超时 | SSE 连接断开，前端显示「生成中断，可重试」；已生成部分保留 |
| 图片 OCR 失败 | 记录失败原因，保留原图，允许重试或手动输入 |
| 每日撤销完成限一次 | 当日已撤销过返回 `UNDO_LIMIT_REACHED`，提示明日再试 |

### 6.3 数据校验规则

- `exam_date`：必须为未来日期，格式 `YYYY-MM-DD`
- `plan_date`：不得晚于 `exam_config.exam_date`
- `score` / `full_score`：`0 <= score <= full_score`
- `file_size_bytes`：`<= 100 * 1024 * 1024`（100MB）
- `estimated_minutes`、`duration_minutes`：`> 0`
- `weekly_available_days`：`1~7`；`daily_available_minutes`：`1~1440`

---

## 7. 仓库目录结构

```
kaobei-workbench/
├── .github/
│   └── workflows/
│       └── ci.yml              # CI：类型检查、构建、测试
├── docs/
│   ├── input/
│   │   └── PRD-v0.3.md         # 需求输入（只读，不修改）
│   ├── ARCHITECTURE.md         # 本文件
│   └── decisions/              # ADR 目录
│       └── ADR-001-sqlite.md
├── prisma/
│   └── schema.prisma           # 数据库 schema（如用 Prisma）
│   # 或 drizzle/
│   #   └── schema.ts           # Drizzle schema
│   #   └── migrations/         # 迁移文件
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # 根布局（主题、全局样式）
│   │   ├── page.tsx            # 学习驾驶舱（/）
│   │   ├── plan/
│   │   │   └── page.tsx        # 计划中心
│   │   ├── library/
│   │   │   └── page.tsx        # 知识库
│   │   ├── ai/
│   │   │   └── page.tsx        # AI 助手
│   │   ├── question/
│   │   │   └── page.tsx        # 题库与做题
│   │   ├── review/
│   │   │   └── page.tsx        # 错题本与复习
│   │   ├── note/
│   │   │   └── page.tsx        # 笔记
│   │   ├── report/
│   │   │   └── page.tsx        # 学习报告
│   │   ├── settings/
│   │   │   └── page.tsx        # 设置
│   │   └── api/                # API Routes
│   │       ├── auth/
│   │       ├── exam-config/
│   │       ├── tasks/
│   │       ├── outline/
│   │       ├── library/
│   │       ├── ai/
│   │       ├── questions/
│   │       ├── mock-exams/
│   │       ├── mistakes/
│   │       ├── notes/
│   │       ├── reports/
│   │       ├── dashboard/
│   │       ├── settings/
│   │       └── backup/
│   ├── components/             # 共享组件
│   │   ├── ui/                 # shadcn/ui 基础组件
│   │   ├── layout/             # 导航栏、页面骨架
│   │   ├── focus/              # 专注模式相关
│   │   ├── question/           # 做题组件
│   │   └── charts/             # 图表组件
│   ├── lib/
│   │   ├── db.ts               # 数据库连接（better-sqlite3）
│   │   ├── ai/                 # AI SDK 封装
│   │   │   ├── client.ts       # 智谱 API 客户端
│   │   │   ├── rag.ts          # RAG 检索
│   │   │   ├── search.ts       # Tavily 联网搜索
│   │   │   └── prompts.ts      # Prompt 模板
│   │   ├── parsers/            # 文件解析
│   │   │   ├── pdf.ts
│   │   │   ├── word.ts
│   │   │   ├── image-ocr.ts
│   │   │   └── webpage.ts
│   │   ├── sm2.ts              # SM-2 调度算法
│   │   ├── scheduler.ts        # 定时任务（逾期扫描、周报）
│   │   └── backup.ts           # 备份导出导入
│   ├── hooks/                  # React Hooks
│   ├── stores/                 # Zustand 状态
│   └── types/                  # TypeScript 类型定义
├── content/                    # 本地文件存储（运行时生成，gitignore）
│   ├── uploads/                # 用户上传文件
│   └── backups/                # 自动备份压缩包
├── public/                     # 静态资源
├── scripts/
│   └── seed.ts                 # 初始化数据（软考大纲示例）
├── tests/
│   ├── unit/
│   └── integration/
├── docker-compose.yml          # 本地开发
├── Dockerfile                  # 生产构建
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 7.1 目录约定说明

| 目录 | 用途 | 备注 |
|------|------|------|
| `docs/input/` | 需求输入 | 只读，架构设计不修改其中的 PRD |
| `docs/decisions/` | ADR | 重要技术决策按 ADR-NNN 编号 |
| `src/app/api/` | API Routes | 与页面路由对齐的目录结构 |
| `src/lib/ai/` | AI 相关 | 模型调用、RAG、联网搜索集中封装，便于切换 Provider |
| `src/lib/parsers/` | 文件解析 | 每种格式独立模块，统一输入输出接口 |
| `content/` | 运行时文件 | `.gitignore`，部署时挂载卷或持久化目录 |

---

## 8. 核心设计决策清单

| 编号 | 决策 | 方案 | 理由 | 风险 |
|------|------|------|------|------|
| D-1 | 全栈框架 | Next.js 15 App Router | 单容器部署、前端后端一套代码、SSR 首屏快 | 学习曲线（协作者） |
| D-2 | 数据库 | SQLite (better-sqlite3) | PRD 确认口径；文件级便携；备份即复制 | 并发写性能上限（单用户场景无影响） |
| D-3 | ORM | Drizzle ORM | 轻量、TypeScript 类型安全、迁移文件可版本控制 | 生态较 Prisma 小 |
| D-4 | 全文检索 | SQLite FTS5 | 无需额外服务；与数据同库 | 中文分词需配置（icu 或自定义 tokenizer） |
| D-5 | AI 接口 | Vercel AI SDK + 自定义 Provider | 统一流式接口；模型切换只需改 Provider | 免费档速率限制需客户端限流 |
| D-6 | 文件存储 | 本地文件系统 | PRD 确认口径；与 SQLite 同机备份 | 容器部署时需挂载持久化卷 |
| D-7 | 定时任务 | node-cron 单进程内 | 逾期扫描、周报生成、自动备份；轻量无需额外服务 | 多实例部署时会重复执行（单用户单实例无影响） |
| D-8 | 身份验证 | 自建 JWT + bcrypt | 无登录体系，仅访问口令；足够轻量 | 不如 OAuth 成熟（单用户场景无需 OAuth） |
| D-9 | 知识库统一模型 | 单表 `knowledge_items` + `category` 枚举 | 12 类共享同一套字段，减少表数量；通过 `category` 区分 | 不同类别可能有专属字段需求（P0 用通用字段覆盖） |
| D-10 | SM-2 实现 | 简化版：固定序列 1→3→7→14 | 满足复习需求，实现极简；用户可手动回退 | 非标准 SM-2，参数不可调（P1 可扩展） |
| D-11 | 番茄钟状态 | 服务端 Session + 客户端心跳 | 刷新/重开页面可恢复；暂停超时服务端判定 | 需处理浏览器切标签/休眠导致的计时偏差 |
| D-12 | 导出格式 | JSON（结构化）+ Markdown（笔记）+ 原件压缩 | PRD 确认；跨设备迁移；人可读 | 大资料包时压缩耗时（后台异步生成） |

---

## 附录 A：数据库 Schema 速查（Drizzle 风格）

> 以下为简化示意，实际实现以 `src/lib/db/schema.ts` 为准。

```typescript
// 考试配置
export const examConfig = sqliteTable('exam_config', {
  id: integer('id').primaryKey(),
  examName: text('exam_name').notNull(),
  examLevel: text('exam_level').notNull(),
  examDate: text('exam_date'),
  subjectsJson: text('subjects_json').notNull(),
  weeklyAvailableDays: integer('weekly_available_days').notNull().default(5),
  dailyAvailableMinutes: integer('daily_available_minutes').notNull().default(150),
  firstRunCompleted: integer('first_run_completed', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// 知识库条目（统一模型）
export const knowledgeItems = sqliteTable('knowledge_items', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  sourceType: text('source_type', { enum: ['user_upload', 'web_collect'] }).notNull(),
  category: text('category', {
    enum: ['exam_analysis','recitation','dictation','sprint','mind_map',
           'knowledge_point','past_exam','mock_exam','tips','textbook',
           'study_plan','case_material']
  }).notNull(),
  subjectId: integer('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  chapterId: integer('chapter_id').references(() => chapters.id, { onDelete: 'set null' }),
  knowledgePointIds: text('knowledge_point_ids'), // JSON array
  contentType: text('content_type', { enum: ['pdf','word','markdown','text','image','webpage'] }).notNull(),
  contentText: text('content_text'),
  contentMarkdown: text('content_markdown'),
  filePath: text('file_path'),
  fileSizeBytes: integer('file_size_bytes'),
  pageCount: integer('page_count'),
  sourceUrl: text('source_url'),
  sourceName: text('source_name'),
  ocrText: text('ocr_text'),
  status: text('status', { enum: ['pending','parsed','archived','failed'] }).notNull().default('pending'),
  parseError: text('parse_error'),
  collectedAt: text('collected_at'),
  confirmedAt: text('confirmed_at'),
  isIndexed: integer('is_indexed', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// FTS5 虚拟表
export const knowledgeItemsFts = sqliteTable('knowledge_items_fts', {
  docid: integer('docid').notNull(),
  title: text('title'),
  contentText: text('content_text'),
  ocrText: text('ocr_text'),
});
```

---

*文档版本：v1.0*  
*基于 PRD v0.3 评审稿设计*  
*分支：feat/architecture-v1*
