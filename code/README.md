# 备考工作台

系统分析师备考工作台 —— 单用户 AI 增强型个人备考系统。

## 技术栈

- **框架**: Next.js 15 (App Router + API Routes)
- **UI**: React 19 + Tailwind CSS v3
- **数据库**: SQLite (better-sqlite3) + Drizzle ORM (schema/migration)
- **字体**: Noto Serif SC / Noto Sans SC
- **图标**: Lucide React

## 项目结构

```
code/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # 后端 API Routes (19 个)
│   │   ├── page.tsx            # 学习驾驶舱 (首页)
│   │   ├── plan/page.tsx       # 计划中心
│   │   ├── knowledge/page.tsx  # 知识库
│   │   ├── ai/page.tsx         # AI 助手
│   │   ├── exam/page.tsx       # 题库与做题
│   │   ├── mistake/page.tsx    # 错题本与复习
│   │   ├── note/page.tsx       # 笔记
│   │   ├── report/page.tsx     # 学习报告
│   │   └── settings/page.tsx   # 设置
│   ├── components/             # 共享组件 (Sidebar 等)
│   ├── lib/                    # 工具函数、API 封装、常量
│   ├── db/                     # 数据库配置、schema、migrations
│   └── scripts/                # seed 数据脚本
├── data/                       # SQLite 数据库文件
├── docs/                       # 文档与验证日志
├── public/                     # 静态资源
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 环境要求

- Node.js >= 18
- npm >= 9

## 一键启动

```bash
cd code/
npm install
npm run db:reset   # 初始化数据库并导入 seed 数据
npm run dev        # 启动开发服务器 (默认 http://localhost:3000)
```

或指定端口：

```bash
npm run dev -- -p 3456
```

## 主要功能模块

| 模块 | 路径 | 说明 |
|------|------|------|
| 学习驾驶舱 | `/` | 今日任务、连续打卡、学习热力图、科目进度 |
| 计划中心 | `/plan` | 增删改计划、逾期顺延展示 |
| 知识库 | `/knowledge` | 12 分类浏览、搜索、筛选，含 GitHub 仓库链接 |
| AI 助手 | `/ai` | 问答 + 引用标注 |
| 题库与做题 | `/exam` | 17 年度真题卷列表、答题界面、判分 |
| 错题本与复习 | `/mistake` | SM-2 复习队列、答对/答错/不确定操作 |
| 笔记 | `/note` | 增删改查、置顶 |
| 学习报告 | `/report` | 周报/月报统计 |
| 设置 | `/settings` | 主题、数据导出/导入 |

## 数据库操作

```bash
npm run db:migrate    # 执行迁移
npm run db:seed       # 导入 seed 数据
npm run db:reset      # 重置数据库 (删除 + 迁移 + seed)
```

## 构建

```bash
npm run build
npm start
```

## UI 规范

- 暖纸色系: `--paper` / `--pine` / `--seal` / `--ochre`
- 思源宋体标题 + 无衬线正文
- 侧栏宽度: 236px
- 响应式断点: 960px (desktop / mobile)
