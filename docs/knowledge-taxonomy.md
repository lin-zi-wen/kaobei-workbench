# 备考工作台 · 知识库 12 类信息架构（v1.0）

> **适用范围：** PRD v1.0 FR-005 / FR-006 的知识库分类体系。  
> **目标考试：** 系统分析师（软考高级）。  
> **内容来源：** 用户本地上传资料包 + AI 联网搜集初始内容，双来源并存、区分标记。

---

## 一、总体设计原则

1. **分类唯一：** 每一条知识库条目有且仅有一个主分类（12 选 1），允许打多个辅助标签。  
2. **来源可溯源：** 所有条目必须标记 `source_type`（`upload` / `web`），`upload` 保留原始文件名与上传时间，`web` 保留 URL、抓取时间与可信度评分。  
3. **科目与章节挂钩：** 条目必须关联到考试大纲的「科目 → 章节 → 知识点」树，支持跨科目条目（如案例素材涉及多科目时挂到「综合」节点）。  
4. **格式统一：** 纯文本 / Markdown / PDF / 图片（OCR 后文本）统一转为可检索的文本块入库，原文件作为附件保留。  
5. **归档状态驱动生命周期：** `active`（可用）→ `archived`（过期/考后归档）→ `deleted`（逻辑删除，保留 30 天后物理清除）。

---

## 二、12 类定义、字段与联动

### KB-01 考情分析

**定位定义：** 关于系统分析师考试的官方政策、历年考情统计、通过率趋势、报名时间节点、考试形式变化等宏观信息。是备考决策与计划制定的第一层输入。

**条目字段：**

| 字段 | 类型 | 说明 |
|---|---|---|
| title | string | 标题，如「2026 年系统分析师考试安排」 |
| category | enum | 固定值 `考情分析` |
| subject | enum | `综合知识` / `案例分析` / `论文` / `全科` |
| chapter | string | 关联大纲章节，考情类通常挂 `全科` |
| format | enum | `text` / `markdown` / `pdf` / `image` |
| source_type | enum | `upload` / `web` |
| source_detail | string | 上传文件名 或 URL + 访问日期 |
| credibility | int | 可信度 1-5（官方来源 5，培训机构 3，个人博客 2） |
| exam_year | int | 关联考试年份，如 2026 |
| archive_status | enum | `active` / `archived` / `deleted` |
| tags | string[] | 辅助标签，如 `报名` / `批次安排` / `成绩查询` |
| created_at | datetime | 入库时间 |
| updated_at | datetime | 最后更新时间 |

**上传导入流程：**
1. 用户上传官方通知 PDF、报名截图等 → 系统自动 OCR / 解析文本 → AI 提取关键字段（考试日期、科目、批次）→ 预览确认 → 入库标记 `source_type=upload`。
2. 解析失败则保留原文件，用户手动补录字段。

**联网搜集流程：**
1. AI 搜索「系统分析师 2026 考试安排」→ 去重排序 → 候选清单（标题 + URL + 摘要 + 可信度预估）→ 用户勾选确认 → 入库标记 `source_type=web`，`credibility` 按来源域名规则打分。
2. 联网内容标注抓取日期，系统每 90 天提示用户复核时效性。

**联动关系：**
- **学习计划：** 考情分析中的考试日期、报名时间自动写入计划中心的「关键里程碑」节点，驱动倒计时与报名提醒。
- **AI 助手：** 用户问「今年论文有什么变化」时，优先检索 `考情分析` 类条目，答案附来源 URL 与抓取日期。

---

### KB-02 背诵本

**定位定义：** 需要机械记忆的知识点汇总，如法律法规条文、公式、关键概念定义、英文术语等。支持正反面卡片式浏览与自测。

**条目字段：**

| 字段 | 类型 | 说明 |
|---|---|---|
| title | string | 卡片正面标题 / 问题 |
| category | enum | 固定值 `背诵本` |
| subject | enum | `综合知识` / `案例分析` / `论文` |
| chapter | string | 关联大纲章节 |
| format | enum | `flashcard`（正反面卡片）/ `list`（条目列表） |
| source_type | enum | `upload` / `web` |
| source_detail | string | 来源文件或 URL |
| front_content | text | 卡片正面（问题/提示） |
| back_content | text | 卡片背面（答案/详解） |
| mastery_level | int | 熟练度 0-5，初始 0 |
| last_reviewed | date | 上次复习日期 |
| review_count | int | 累计复习次数 |
| archive_status | enum | `active` / `archived` / `deleted` |
| tags | string[] | 如 `法律法规` / `公式` / `术语` |
| created_at | datetime | 入库时间 |

**上传导入流程：**
1. 用户上传「法律法规汇总.md」或 Excel 卡片表 → 系统解析 → AI 识别正反面结构（若文件无明确分隔则建议拆分）→ 预览逐条确认 → 入库。
2. 支持批量导入：CSV 格式含 `front_content`、`back_content`、`subject`、`chapter` 四列即可一键入库。

**联网搜集流程：**
1. AI 按大纲知识点搜索「系统分析师 综合知识 背诵要点」→ 候选清单 → 用户确认后，AI 自动整理为卡片格式（正面问题 + 背面答案）→ 入库。

**联动关系：**
- **错题本：** 错题中因「记忆遗漏」答错的题目，可一键生成背诵卡片加入本类。
- **复习队列：** 背诵卡片独立调度（与错题 SM-2 分开），按「艾宾浩斯-like」1→2→4→7→15 天复习；熟练度达 5 后自动归档。
- **AI 助手：** 用户问「帮我生成操作系统信号量的背诵卡片」，AI 生成后一键存入本类。

---

### KB-03 默写本

**定位定义：** 需要动手默写输出的大段内容，如论文框架模板、案例分析答题模板、重要流程步骤等。支持「看题→隐藏答案→手写/打字→对照批改」的默写训练模式。

**条目字段：**

| 字段 | 类型 | 说明 |
|---|---|---|
| title | string | 默写主题，如「论文摘要模板」 |
| category | enum | 固定值 `默写本` |
| subject | enum | `综合知识` / `案例分析` / `论文` |
| chapter | string | 关联大纲章节 |
| format | enum | `template`（模板填空）/ `fulltext`（全文默写） |
| source_type | enum | `upload` / `web` |
| source_detail | string | 来源文件或 URL |
| prompt_text | text | 默写提示（题目/开头） |
| reference_answer | text | 参考答案（可折叠） |
| word_count_target | int | 目标字数，如论文 2500 字 |
| user_attempts | object[] | 历史默写记录 {date, content, self_score} |
| archive_status | enum | `active` / `archived` / `deleted` |
| tags | string[] | 如 `论文模板` / `案例答题框架` |
| created_at | datetime | 入库时间 |

**上传导入流程：**
1. 用户上传「论文范文.docx」或「答题模板.md」→ 系统解析 → AI 识别「提示 vs 答案」结构 → 若无法自动拆分则列为 `fulltext` 类型、整篇作为参考 → 预览确认 → 入库。

**联网搜集流程：**
1. AI 搜索「系统分析师 论文 摘要模板」→ 候选清单 → 用户确认 → AI 整理为默写条目（提示 + 参考答案）→ 入库。

**联动关系：**
- **学习计划：** 默写任务可加入周计划（如「本周三默写一篇完整论文」），完成即打卡。
- **学习报告：** 默写次数与自评分数纳入周报「输出型训练」统计。
- **AI 助手：** 用户上传一篇自己的论文，AI 可对比参考模板给出结构改进建议。

---

### KB-04 考前冲刺

**定位定义：** 考前 2-4 周内高频使用的浓缩资料，如高频考点速查、押题范围（仅记录范围、不做保证）、易错点清单、时间分配策略等。生命周期短、更新频繁。

**条目字段：**

| 字段 | 类型 | 说明 |
|---|---|---|
| title | string | 标题，如「考前 7 天高频考点速查」 |
| category | enum | 固定值 `考前冲刺` |
| subject | enum | `综合知识` / `案例分析` / `论文` / `全科` |
| chapter | string | 关联大纲章节，冲刺类常挂 `全科` |
| format | enum | `text` / `markdown` / `pdf` / `checklist` |
| source_type | enum | `upload` / `web` |
| source_detail | string | 来源文件或 URL |
| urgency_level | int | 紧急程度 1-3（1=考前一个月可用，3=考前一天必看） |
| validity_date | date | 资料有效期（考试日期后自动归档） |
| archive_status | enum | `active` / `archived` / `deleted` |
| tags | string[] | 如 `高频考点` / `易错点` / `时间分配` |
| created_at | datetime | 入库时间 |

**上传导入流程：**
1. 用户上传冲刺班讲义、考前笔记照片 → 系统 OCR → AI 提取要点 → 预览确认 → 入库，自动设置 `validity_date` 为当前考试日期 + 7 天。

**联网搜集流程：**
1. AI 搜索「系统分析师 考前冲刺 高频考点」→ 候选清单 → 用户确认 → 入库，`urgency_level` 默认 2，用户可调整。

**联动关系：**
- **学习驾驶舱：** 考前 14 天起，驾驶舱顶部增加「冲刺资料」快捷入口，按 `urgency_level` 排序展示。
- **学习计划：** 考前冲刺条目可一键转为「考前任务」插入计划。
- **学习报告：** 考前最后一周周报自动汇总冲刺类资料的阅读进度。

---

### KB-05 思维导图

**定位定义：** 以思维导图形式呈现的知识结构，可来自用户手绘/软件导出（XMind/MindManager 等），也可由 AI 根据大纲或教材自动生成。用于建立章节级全局视野。

**条目字段：**

| 字段 | 类型 | 说明 |
|---|---|---|
| title | string | 导图主题，如「软件工程基础知识思维导图」 |
| category | enum | 固定值 `思维导图` |
| subject | enum | `综合知识` / `案例分析` / `论文` |
| chapter | string | 关联大纲章节 |
| format | enum | `xmind` / `mindmanager` / `markdown_mermaid` / `image` / `json`（通用节点树） |
| source_type | enum | `upload` / `web` / `ai_generated` |
| source_detail | string | 来源文件、URL 或 `AI生成` |
| node_count | int | 节点数量（自动统计） |
| is_ai_generated | bool | 是否由 AI 自动生成 |
| parent_topic | string | 父主题（如「综合知识」下挂「软件工程」） |
| archive_status | enum | `active` / `archived` / `deleted` |
| tags | string[] | 如 `章节总览` / `对比记忆` |
| created_at | datetime | 入库时间 |

**上传导入流程：**
1. 用户上传 `.xmind`、`.mm`、`.png` 等 → 系统提取图片或解析文件 → 若为图片则 OCR 提取节点文本 → 生成可检索的文本块 → 原文件保留为附件 → 预览确认 → 入库。
2. 系统尝试解析为通用节点树 JSON，供后续 AI 问答时引用具体节点。

**联网搜集流程：**
1. AI 搜索「系统分析师 思维导图 软件工程」→ 候选清单 → 用户确认 → 系统尝试下载/解析 → 入库。
2. 支持 AI 自动生成：用户选择大纲节点 → AI 生成 Markdown/Mermaid 格式思维导图 → 预览确认 → 入库标记 `is_ai_generated=true`。

**联动关系：**
- **知识库其他类：** 思维导图的叶子节点可一键链接到「知识点考点」或「历年真题」的对应条目。
- **AI 助手：** 用户问「软件工程有哪些设计模式」，AI 优先展示思维导图结构，再展开具体模式解释。
- **学习报告：** 章节地图进度可视化可直接复用思维导图的节点树结构。

---

### KB-06 知识点考点

**定位定义：** 系统分析师大纲覆盖的全部知识点，以及历年考试中该知识点的出现频率、考查形式、关联真题索引。是知识库的核心索引层。

**条目字段：**

| 字段 | 类型 | 说明 |
|---|---|---|
| title | string | 知识点名称，如「UML 用例图包含关系」 |
| category | enum | 固定值 `知识点考点` |
| subject | enum | `综合知识` / `案例分析` / `论文` |
| chapter | string | 关联大纲章节 |
| format | enum | `text` / `markdown` / `table`（对比表） |
| source_type | enum | `upload` / `web` / `ai_generated` |
| source_detail | string | 来源文件、URL 或 `AI生成` |
| difficulty | enum | `easy` / `medium` / `hard` |
| exam_frequency | enum | `高频` / `中频` / `低频` / `未考`（基于历年真题统计） |
| related_questions | string[] | 关联真题 ID 列表 |
| related_notes | string[] | 关联笔记 ID 列表 |
| concept_definition | text | 概念定义（一句话） |
| detailed_explanation | text | 详细解释 |
| typical_question_types | string[] | 常见考查形式，如 `单选` / `案例分析建模` / `论文` |
| archive_status | enum | `active` / `archived` / `deleted` |
| tags | string[] | 辅助标签 |
| created_at | datetime | 入库时间 |

**上传导入流程：**
1. 用户上传教材章节、培训讲义 → 系统解析 → AI 按大纲知识点切分 → 每条知识点自动提取 `concept_definition` 与 `detailed_explanation` → 预览确认 → 入库。
2. 支持从 Excel 批量导入：每行一个知识点，含 `title`、`subject`、`chapter`、`concept_definition`。

**联网搜集流程：**
1. AI 按大纲知识点逐条搜索「系统分析师 UML 用例图 考点」→ 去重 → 候选清单 → 用户确认 → AI 整理为标准格式（定义 + 详解 + 典型考法）→ 入库。
2. 联网搜集的知识点自动标记 `exam_frequency=待统计`，待关联真题后更新。

**联动关系：**
- **题库：** 每道题目必须关联至少一个「知识点考点」条目；题目入库时自动更新知识点的 `related_questions` 与 `exam_frequency`。
- **错题本：** 错题自动反向关联到知识点，错题分布驱动知识点的 `difficulty` 动态调整。
- **笔记：** 笔记可双向关联知识点，形成「知识点 → 笔记 → 错题 → 真题」的知识网络。
- **AI 助手：** RAG 检索的核心索引层，问答时优先命中本类条目。

---

### KB-07 历年真题

**定位定义：** 系统分析师历年考试真题及权威解析，包括综合知识真题、案例分析真题与论文真题。支持按年份、科目、章节、知识点多维检索。

**条目字段：**

| 字段 | 类型 | 说明 |
|---|---|---|
| title | string | 标题，如「2025 上半年综合知识第 12 题」 |
| category | enum | 固定值 `历年真题` |
| subject | enum | `综合知识` / `案例分析` / `论文` |
| chapter | string | 关联大纲章节 |
| format | enum | `question`（客观题）/ `case`（案例题）/ `essay`（论文题） |
| source_type | enum | `upload` / `web` |
| source_detail | string | 来源文件或 URL |
| exam_year | int | 考试年份 |
| exam_session | enum | `上半年` / `下半年` |
| question_number | int | 题号（综合知识）或案例序号（案例分析） |
| question_content | text | 题干内容 |
| options | object[] | 选项（客观题）{label, text} |
| correct_answer | string | 正确答案 |
| user_answer | string | 用户作答（做题后记录） |
| explanation | text | 解析 |
| related_knowledge_points | string[] | 关联知识点 ID 列表 |
| difficulty | enum | `easy` / `medium` / `hard` |
| has_entered_wrongbook | bool | 是否已进入错题本 |
| archive_status | enum | `active` / `archived` / `deleted` |
| tags | string[] | 如 `必考` / `易错` |
| created_at | datetime | 入库时间 |

**上传导入流程：**
1. 用户上传真题 PDF/Word/Excel → 系统解析 → AI 识别题目结构（题干、选项、答案、解析）→ 自动关联大纲章节与知识点 → 预览逐题确认 → 入库。
2. 支持标准 JSON/Excel 模板批量导入，字段与上方一致。

**联网搜集流程：**
1. AI 搜索「系统分析师 2025 真题 综合知识」→ 候选清单（按年份与科目分组）→ 用户勾选 → AI 提取题目结构 → 预览确认 → 入库。
2. 联网真题需标注来源可信度，培训机构回忆版标 `credibility=3`，官方发布标 `credibility=5`。

**联动关系：**
- **题库：** 历年真题是题库的子集，用户做题时可选「仅练真题」模式。
- **错题本：** 真题做错自动入错题本，错题记录反向关联真题条目。
- **知识点考点：** 真题入库时自动更新关联知识点的 `exam_frequency` 与 `related_questions`。
- **学习报告：** 周报统计「本周真题完成量」与「真题首次正确率」。

---

### KB-08 模拟卷

**定位定义：** 用户自行组卷或 AI 生成的模拟试题，用于阶段性自测与考前模考。与历年真题的区别在于：模拟卷是「生成/组装」的，真题是「历史归档」的。

**条目字段：**

| 字段 | 类型 | 说明 |
|---|---|---|
| title | string | 模拟卷名称，如「软件工程专项模拟卷 A」 |
| category | enum | 固定值 `模拟卷` |
| subject | enum | `综合知识` / `案例分析` / `论文` / `全科` |
| chapter | string | 关联大纲章节，`全科` 表示跨章节综合 |
| format | enum | `auto_generated`（AI 生成）/ `manual_assembled`（手动组卷）/ `uploaded`（上传第三方试卷） |
| source_type | enum | `upload` / `web` / `ai_generated` |
| source_detail | string | 来源说明 |
| question_ids | string[] | 包含的题目 ID 列表 |
| total_score | int | 总分 |
| time_limit | int | 限时（分钟） |
| target_difficulty | enum | `easy` / `medium` / `hard` |
| is_completed | bool | 是否已完成 |
| user_score | int | 用户得分（完成后记录） |
| completion_date | date | 完成日期 |
| archive_status | enum | `active` / `archived` / `deleted` |
| tags | string[] | 如 `考前模考` / `专项突破` |
| created_at | datetime | 入库时间 |

**上传导入流程：**
1. 用户上传第三方模拟卷（PDF/Word/Excel）→ 解析 → AI 识别题目 → 预览确认 → 入库标记 `format=uploaded`。
2. 手动组卷：用户在题库中勾选题目 → 一键生成模拟卷 → 设置时间与总分 → 入库标记 `format=manual_assembled`。

**联网搜集流程：**
1. AI 搜索「系统分析师 模拟题 软件工程」→ 候选清单 → 用户确认 → AI 整理为模拟卷格式 → 入库。

**联动关系：**
- **题库：** 模拟卷的题目来自题库，删除题库中的题目时提示是否影响已创建的模拟卷。
- **模考记录（FR-011）：** 完成模拟卷后成绩自动落入模考记录，生成趋势数据。
- **错题本：** 模拟卷中做错的题目同样进入错题本，与真题错题统一调度。
- **学习报告：** 模考成绩纳入周报与阶段报告的「模考趋势」统计。

---

### KB-09 实用技巧

**定位定义：** 应试技巧、答题策略、时间分配方法、审题技巧、计算器使用技巧、论文排版技巧等「元能力」内容。不直接教知识，教怎么考。

**条目字段：**

| 字段 | 类型 | 说明 |
|---|---|---|
| title | string | 标题，如「案例分析 90 分钟时间分配策略」 |
| category | enum | 固定值 `实用技巧` |
| subject | enum | `综合知识` / `案例分析` / `论文` / `全科` |
| chapter | string | 关联大纲章节，技巧类常挂 `全科` |
| format | enum | `text` / `markdown` / `video`（链接） |
| source_type | enum | `upload` / `web` |
| source_detail | string | 来源文件或 URL |
| applicability | enum | `通用` / `特定题型` / `特定年份` |
| effectiveness_rating | int | 用户自评有效性 1-5，初始为空 |
| archive_status | enum | `active` / `archived` / `deleted` |
| tags | string[] | 如 `时间分配` / `审题` / `论文排版` / `记忆法` |
| created_at | datetime | 入库时间 |

**上传导入流程：**
1. 用户上传备考经验贴、技巧笔记 → 解析 → AI 提取核心技巧点 → 预览确认 → 入库。

**联网搜集流程：**
1. AI 搜索「系统分析师 案例分析 答题技巧」→ 候选清单 → 用户确认 → 入库。

**联动关系：**
- **学习驾驶舱：** 每日随机展示一条技巧卡片（可关闭）。
- **AI 助手：** 用户问「论文怎么分配时间」，优先检索本类条目。
- **学习报告：** 用户可对技巧标记「已试用/有效/无效」，数据用于优化推荐。

---

### KB-10 教材解读

**定位定义：** 对官方教材《系统分析师教程》（清华大学出版社）或其他参考书的章节解读、重点标注、难点注释、个人批注等。支持按教材页码定位。

**条目字段：**

| 字段 | 类型 | 说明 |
|---|---|---|
| title | string | 标题，如「第 3 章 软件工程 · 重点批注」 |
| category | enum | 固定值 `教材解读` |
| subject | enum | `综合知识` / `案例分析` / `论文` |
| chapter | string | 关联大纲章节 |
| format | enum | `text` / `markdown` / `pdf_annotation`（PDF 批注层） |
| source_type | enum | `upload` / `web` |
| source_detail | string | 教材名称 + 页码范围 或 URL |
| book_name | string | 教材名称，如「系统分析师教程（第 2 版）」 |
| page_range | string | 页码范围，如「p45-p67」 |
| key_points | text[] | 重点摘要列表 |
| difficult_points | text[] | 难点注释列表 |
| personal_notes | text | 个人批注 |
| archive_status | enum | `active` / `archived` / `deleted` |
| tags | string[] | 如 `官方教材` / `重点` / `难点` |
| created_at | datetime | 入库时间 |

**上传导入流程：**
1. 用户上传教材 PDF → 系统保留原文件 → 用户可在阅读器中划线批注 → 批注内容自动提取为条目 → 入库。
2. 用户上传「教材重点笔记.md」→ AI 识别章节结构 → 自动匹配大纲 → 预览确认 → 入库。

**联网搜集流程：**
1. AI 搜索「系统分析师教程 第 3 章 解读」→ 候选清单 → 用户确认 → 入库，自动提取 `book_name` 与 `page_range`（若原文有）。

**联动关系：**
- **知识点考点：** 教材解读的 `key_points` 可一键升级为「知识点考点」条目。
- **笔记：** 阅读教材时的个人批注可同步到笔记系统，双向关联。
- **AI 助手：** 用户问「教材第 5 章讲了什么」，AI 检索本类条目并给出页码定位。

---

### KB-11 学习计划

**定位定义：** 由系统生成或用户自定义的学习计划文档，包括阶段规划、周计划、日计划、专项突破计划等。与计划中心（FR-003）的区别：计划中心是结构化任务调度系统，本类是计划文档的归档库。

**条目字段：**

| 字段 | 类型 | 说明 |
|---|---|---|
| title | string | 计划名称，如「第一阶段：通读教材（12 周）」 |
| category | enum | 固定值 `学习计划` |
| subject | enum | `综合知识` / `案例分析` / `论文` / `全科` |
| chapter | string | 关联大纲章节 |
| format | enum | `text` / `markdown` / `checklist` / `gantt`（简易甘特） |
| source_type | enum | `upload` / `web` / `system_generated` |
| source_detail | string | 来源文件、URL 或 `系统生成` |
| plan_type | enum | `stage`（阶段计划）/ `weekly`（周计划）/ `daily`（日计划）/ `sprint`（专项突破） |
| start_date | date | 计划开始日期 |
| end_date | date | 计划结束日期 |
| estimated_hours | int | 预估总学时 |
| actual_hours | int | 实际已投入学时（自动累计） |
| completion_rate | float | 完成百分比（自动计算） |
| related_tasks | string[] | 关联计划中心任务 ID 列表 |
| archive_status | enum | `active` / `archived` / `deleted` |
| tags | string[] | 如 `系统生成` / `手动调整` / `考前冲刺` |
| created_at | datetime | 入库时间 |

**上传导入流程：**
1. 用户上传他人分享的学习计划 Excel/Word → 解析 → AI 识别计划结构 → 预览确认 → 入库。用户可选择「仅存档」或「同步到计划中心生成任务」。

**联网搜集流程：**
1. AI 搜索「系统分析师 6 个月备考计划」→ 候选清单 → 用户确认 → 入库。用户同样可选择是否同步到计划中心。

**联动关系：**
- **计划中心（FR-003）：** 本类计划文档可一键「激活」为计划中心的结构化任务；计划中心的任务完成情况自动回写 `actual_hours` 与 `completion_rate`。
- **学习报告：** 周报展示本周计划完成率时，可下钻到本类查看原始计划文档。
- **学习驾驶舱：** 当前激活的计划文档标题显示在驾驶舱「本周目标」区域。

---

### KB-12 案例素材

**定位定义：** 用于案例分析科目与论文写作的素材库，包括真实项目案例、行业场景、技术方案、数据图表等。案例分析需要「场景 + 问题 + 方案」三段式素材，论文需要「项目背景 + 技术方案 + 成效」素材。

**条目字段：**

| 字段 | 类型 | 说明 |
|---|---|---|
| title | string | 素材标题，如「某电商平台微服务改造案例」 |
| category | enum | 固定值 `案例素材` |
| subject | enum | `案例分析` / `论文` / `综合知识` |
| chapter | string | 关联大纲章节 |
| format | enum | `text` / `markdown` / `image` / `diagram` |
| source_type | enum | `upload` / `web` |
| source_detail | string | 来源文件或 URL |
| scenario | text | 场景描述（背景、业务痛点） |
| problem | text | 面临的问题 / 需求 |
| solution | text | 解决方案 / 技术选型 |
| outcome | text | 实施效果 / 量化成果 |
| applicable_question_types | string[] | 适用题型，如 `案例分析-架构设计` / `论文-微服务` |
| is_personal_project | bool | 是否来自用户本人的真实项目 |
| archive_status | enum | `active` / `archived` / `deleted` |
| tags | string[] | 如 `微服务` / `大数据` / `金融` / `政务` |
| created_at | datetime | 入库时间 |

**上传导入流程：**
1. 用户上传项目文档、技术方案 PPT、案例文章 → 解析 → AI 提取「场景-问题-方案-成效」四段结构 → 预览确认 → 入库。若无法自动拆分则列为 `raw` 子类型，保留全文。
2. 用户可直接在本类新建条目，按四段式模板手写素材。

**联网搜集流程：**
1. AI 搜索「系统分析师 论文 案例素材 微服务」→ 候选清单 → 用户确认 → AI 整理为四段式 → 入库。
2. 联网素材需用户二次确认「是否可改编为本人项目」，避免论文查重风险。

**联动关系：**
- **论文（FR-007 / 默写本）：** 用户写论文时可从本类拖拽素材插入，系统自动适配论文格式。
- **案例分析（FR-008）：** 案例题练习时，AI 可从本类抽取相似场景生成变体题目。
- **AI 助手：** 用户问「给我找一个适合写论文的云计算案例」，AI 检索本类并按 `is_personal_project` 优先排序。
- **笔记：** 素材可一键转为笔记，补充个人理解后形成「个人案例库」。

---

## 三、双来源标记规范

所有知识库条目必须携带来源标记，界面与检索均支持按来源筛选。

| 属性 | 用户上传 (`upload`) | 联网搜集 (`web`) |
|---|---|---|
| **图标** | 📁 本地 | 🌐 网络 |
| **source_detail** | 原始文件名 + 上传时间 | URL + 抓取时间 |
| **可信度初始值** | 用户自评（默认 4） | AI 按域名规则打分（1-5） |
| **可编辑性** | 全文可编辑 | 正文只读，可增批注；可重新抓取更新 |
| **导出行为** | 原文件 + 元数据 | 保留 URL 与抓取日期，正文导出 |
| **失效检测** | 无 | 系统每 90 天检测 URL 可访问性，失效标红提示 |
| **重复处理** | MD5 去重 | URL 去重 + 标题相似度去重 |

**界面展示：** 知识库列表默认混合展示，支持快捷筛选「仅本地 / 仅网络 / 全部」；联网条目在卡片右下角显示 🌐 图标与抓取日期。

---

## 四、与 FR 的映射关系

| 知识库分类 | 主要支撑 FR | 次要联动 FR |
|---|---|---|
| 考情分析 | FR-003 计划中心 | FR-002 驾驶舱、FR-007 AI 助手 |
| 背诵本 | FR-009 错题本 | FR-002 驾驶舱、FR-007 AI 助手 |
| 默写本 | FR-003 计划中心 | FR-012 学习报告、FR-007 AI 助手 |
| 考前冲刺 | FR-002 驾驶舱 | FR-003 计划中心、FR-012 学习报告 |
| 思维导图 | FR-005 知识库 | FR-007 AI 助手、FR-012 学习报告 |
| 知识点考点 | FR-005 知识库、FR-008 题库 | FR-009 错题本、FR-010 笔记、FR-007 AI 助手 |
| 历年真题 | FR-008 题库 | FR-009 错题本、FR-011 模考记录、FR-012 学习报告 |
| 模拟卷 | FR-008 题库、FR-011 模考记录 | FR-009 错题本、FR-012 学习报告 |
| 实用技巧 | FR-007 AI 助手 | FR-002 驾驶舱、FR-012 学习报告 |
| 教材解读 | FR-005 知识库 | FR-010 笔记、FR-007 AI 助手 |
| 学习计划 | FR-003 计划中心 | FR-012 学习报告、FR-002 驾驶舱 |
| 案例素材 | FR-007 AI 助手、FR-008 题库 | FR-010 笔记、FR-011 模考记录 |

---

## 五、存量数据迁移说明（相对 v0.3）

v0.3 的知识库为无分类的「资料堆」，v1.0 启用 12 类分类体系后：

1. **已有条目：** 首次升级时由 AI 批量识别内容类型并建议分类 → 用户批量确认/调整 → 完成迁移。
2. **字段补全：** 旧条目缺少 `source_type`、`chapter`、`archive_status` 等字段，迁移时 `source_type` 统一填 `upload`，`chapter` 按内容 AI 匹配（不匹配则挂 `待分类`），`archive_status` 填 `active`。
3. **URL 条目：** 旧知识库中用户手动粘贴的 URL，迁移时标记 `source_type=web`，补录抓取日期（首次访问时间）。

---

*文档版本：v1.0  
对应 PRD：docs/PRD-v1.md  
最后更新：2026-09-22*
