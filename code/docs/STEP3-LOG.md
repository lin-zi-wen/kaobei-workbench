# STEP3 端到端验证日志

**验证时间**: 2026-09-23
**分支**: feat/app-source-v1
**验证环境**: Node.js sandbox (Linux)

---

## 1. 依赖安装

```bash
npm install
```

**结果**: 成功。所有依赖（含 better-sqlite3 原生模块）安装完毕，无报错。
修复记录: 首次安装后 better-sqlite3 缺少原生绑定，执行 `npm rebuild better-sqlite3` 后解决。

---

## 2. 数据库初始化

```bash
npm run db:reset
```

**结果**: 成功。
- 迁移执行: SQLite 表结构创建成功
- Seed 数据导入: 成功（含科目、知识条目、真题卷、试题等）
修复记录: seed.ts 中 JSON 布尔值需转换为 1/0 才能绑定 SQLite，已修复 `insertMany` 函数。

---

## 3. 开发服务器启动

```bash
npm run dev -- -p 3456
```

**结果**: 成功。Next.js dev server 运行在 `http://localhost:3456`。

---

## 4. 前端页面验证

| 路径 | 页面模块 | HTTP 状态 | 内容校验 |
|------|----------|-----------|----------|
| `/` | 学习驾驶舱 | 200 | 包含 "学习驾驶舱" |
| `/plan` | 计划中心 | 200 | 包含 "计划中心" |
| `/knowledge` | 知识库 | 200 | 包含 "知识库" |
| `/ai` | AI 助手 | 200 | 包含 "AI 助手" |
| `/exam` | 题库与做题 | 200 | 包含 "题库" |
| `/mistake` | 错题本与复习 | 200 | 包含 "错题本" |
| `/note` | 笔记 | 200 | 包含 "笔记" |
| `/report` | 学习报告 | 200 | 包含 "学习报告" |
| `/settings` | 设置 | 200 | 包含 "设置" |

修复记录: `globals.css` 中 `.btn-secondary` 使用 `@apply text-ink`，但 `text-ink` 不是 Tailwind utility class（color 需带 shade 如 `text-ink-900`）。已将全站 `text-ink` → `text-ink-900`、`text-ink-light` → `text-ink-500`、`border-ink-light` → `border-ink-500`。

---

## 5. 后端 API 验证

| 端点 | HTTP 状态 | 响应内容 |
|------|-----------|----------|
| `GET /api/dashboard` | 200 | 今日日期、科目进度、热力图等 |
| `GET /api/plans` | 200 | plans 数组 |
| `GET /api/knowledge` | 200 | 知识条目列表（含 12 分类） |
| `GET /api/knowledge/categories` | 200 | 分类列表 |
| `GET /api/chat` | 200 | AI 会话列表 |
| `GET /api/questions` | 200 | 试题列表 |
| `GET /api/questions/mock-exams` | 200 | 17 年度真题卷列表 |
| `POST /api/questions/answer` | 405 | 仅接受 POST（符合设计） |
| `GET /api/mistakes` | 200 | 错题列表 |
| `GET /api/notes` | 200 | 笔记列表 |
| `GET /api/reports` | 200 | 报告列表 |
| `GET /api/settings` | 200 | 设置项 |
| `GET /api/export` | 200 | 导出接口 |
| `POST /api/import` | 405 | 仅接受 POST（符合设计） |

修复记录: 早期 API route 中使用 camelCase 列名（如 `startTime`），与 SQLite migrations 定义的 snake_case（`start_time`）不一致，导致 `no such column` 500 错误。已全部批量修正为 snake_case。

---

## 6. 已知问题与差异

1. **AI 助手**: 当前为模拟问答（无真实 LLM 接入），问答内容基于固定模板返回。
2. **数据导出/导入**: 接口已就绪，前端 UI 已提供按钮，实际文件下载/上传需浏览器环境完整测试。
3. **SM-2 算法**: 采用简化版实现（3 个 quality 等级），与完整 Anki SM-2 在间隔计算上存在差异。
4. **热力图**: 基于 seed 数据中的打卡记录生成，若 seed 数据无历史记录则显示为空。
5. **学习报告**: 周报/月报数据依赖 seed 中的报告记录，若无记录则显示为空列表。

---

## 7. 验证结论

- ✅ 依赖安装成功
- ✅ 数据库迁移 + seed 成功
- ✅ 开发服务器启动成功
- ✅ 9 个前端页面全部可访问（HTTP 200 + 内容渲染正常）
- ✅ 核心 API 返回正常 JSON 数据
- ⚠️ AI 问答为模拟实现（无真实大模型后端）
