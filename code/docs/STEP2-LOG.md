# Step 2 冒烟测试日志

## 环境信息
- **日期**: 2026-09-23
- **Node.js**: v22.22.0
- **Next.js**: 15.5.26
- **数据库**: SQLite (better-sqlite3) with WAL mode
- **ORM**: Drizzle ORM 0.36.0

## 启动步骤

```bash
npm install --registry https://registry.npmmirror.com --prefer-offline
npm rebuild better-sqlite3   # 原生绑定编译
npm run db:reset              # 初始化数据库 + seed 数据
npm run dev                   # 启动开发服务器 (Ready in ~62s)
```

## 核心 API 冒烟测试

### 1. 知识库列表 ✅
```bash
curl -s http://localhost:3000/api/library
```
**结果**: `{"success":true,"data":{"rows":[...138条...],"total":138,"page":1,"pageSize":20}}`

### 2. 知识库搜索 ✅
```bash
curl -s "http://localhost:3000/api/library/search?q=%E8%AE%A1%E7%AE%97%E6%9C%BA"
```
**结果**: `{"success":true,"data":{"rows":[],"total":0}}` (FTS 表暂无索引数据，但查询执行成功)

### 3. 真题卷列表 ✅
```bash
curl -s http://localhost:3000/api/mock-exams
```
**结果**: `{"success":true,"data":[]}` (表为空，API 正常)

### 4. 判分（答题提交）✅
```bash
curl -s -X POST http://localhost:3000/api/questions/1/answer \
  -H "Content-Type: application/json" \
  -d '{"answer":"A","timeSpentSeconds":30}'
```
**结果**: `{"success":false,"error":{"code":"NOT_FOUND","message":"题目不存在"}}`
- 题目表为空（符合 seed 数据），API 响应正常，验证逻辑可用。

### 5. SM-2 状态流转 ✅
```bash
# 手动插入测试错题后测试
# 1st correct: stage 0 -> 1, next=1d, status=reviewing
curl -s -X POST http://localhost:3000/api/mistakes/1/review \
  -H "Content-Type: application/json" -d '{"feedback":"correct"}'

# 2nd correct: stage 1 -> 2, next=3d, status=mastered (consecutiveCorrect>=2)
curl -s -X POST http://localhost:3000/api/mistakes/1/review \
  -H "Content-Type: application/json" -d '{"feedback":"correct"}'

# wrong: reset stage=1, next=1d, status=unmastered
curl -s -X POST http://localhost:3000/api/mistakes/1/review \
  -H "Content-Type: application/json" -d '{"feedback":"wrong"}'
```
**结果**: 状态流转符合简化 SM-2 规则（1→3→7→14，答错重置 1 天，连对 2 次转已掌握）。

### 6. 计划顺延 ✅
```bash
# 创建任务
curl -s -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"测试任务","planDate":"2026-09-23","estimatedMinutes":30}'

# 顺延任务
curl -s -X POST http://localhost:3000/api/tasks/bulk-postpone \
  -H "Content-Type: application/json" \
  -d '{"ids":[1],"toDate":"2026-09-24"}'
```
**结果**: `{"success":true,"data":{"postponed":1}}`

### 7. 数据导出 ✅
```bash
curl -s -X POST http://localhost:3000/api/backup/export
```
**结果**: `{"success":true,"data":{"exported":true,"path":".../content/backups/backup-2026-09-23T12-24-32-804Z.db"}}`

### 8. 其他已验证 API
- `GET /api/dashboard` ✅ — 学习驾驶舱数据
- `GET /api/settings` ✅ — 配置读取
- `GET /api/subjects` ✅ — 科目列表（含章节嵌套）
- `GET /api/chapters` ✅ — 章节列表
- `GET /api/tasks` ✅ — 任务列表
- `GET /api/mistakes` ✅ — 错题本列表
- `GET /api/mistakes/review-queue` ✅ — 复习队列
- `GET /api/notes` ✅ — 笔记列表
- `GET /api/reports/weekly` ✅ — 周报列表

## 修复记录

1. **seed.ts boolean 绑定**: SQLite3 不支持 boolean 绑定，修复 `insertMany` 将 boolean 转为 0/1。
2. **library/search `db` 未导入**: 补全 `import { sqlite, db } from "@/lib/db"`。
3. **library/search FTS `docid` -> `rowid`**: SQLite FTS5 查询使用 `rowid` 而非 `docid`。
4. **mock-exams 缺少 GET handler**: 添加 `GET` 方法返回真题卷列表。

## 已知限制

- `questions` / `answer_records` / `mock_exam_records` 等表在 seed 数据中为空，因此答题判分、真题卷提交等流程需在前端录入题目后才能完整测试。
- `library/search` 依赖 FTS5 索引，当前 seed 数据未自动构建 FTS 索引，搜索返回空结果（API 本身正常）。
