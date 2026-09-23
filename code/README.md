# 系统分析师备考工作台

> 单用户 AI 增强型个人备考系统，目标考试：系统分析师（软考高级）。

## 技术栈

- **框架**：Next.js 15 (App Router)
- **语言**：TypeScript
- **数据库**：SQLite (better-sqlite3) + Drizzle ORM
- **全文检索**：SQLite FTS5
- **定时任务**：node-cron

## 项目结构

```
code/
├── src/
│   ├── db/              # 数据库 schema、连接、迁移
│   │   ├── schema.ts    # Drizzle 表定义
│   │   ├── index.ts     # 数据库连接
│   │   └── migrations/  # 迁移文件
│   ├── scripts/         # 种子数据与工具脚本
│   │   └── seed.ts      # 初始化数据脚本
│   └── ...              # (后续步骤补充 API、页面、组件)
├── content/             # 本地文件存储（运行时生成，gitignore）
├── docs/                # 项目文档
│   └── STEP1-LOG.md     # 第 1 步验证日志
├── package.json
└── README.md
```

## 快速开始

```bash
cd code/
npm install
npm run db:reset    # 建表 + 种子数据
npm run dev         # 开发服务器
```

## 数据层（本步完成）

- 考试配置、科目-章节-知识点树
- 计划任务（逾期顺延）
- 知识库条目（12 类分类 + 来源标记）
- 题目与做题记录
- 错题本 + 简化 SM-2 状态机
- 笔记
- 学习记录（打卡/专注/热力图）
- 模考记录
- 学习报告
- AI 会话与消息
- 设置与系统

## 种子数据

- **知识库**：138 条真实条目（137 正常 + 1 个损坏占位）
- **真题卷**：17 个年度（2009–2025）卷级条目
- 零演示题目、零伪造数据

## 许可证

自用项目，无外部分发许可。
