# shop-book 执行摘要（Agent 参考）

> 本文档为执行上下文摘要，供后续接手的 Agent 快速了解项目状态、决策与下一步。

## 项目概述

**shop-book** — 宠物洗护门店预约核销系统 v1。

主路径：顾客（微信小程序）预约 → 店员（Web 管理端）核销 → 小程序状态更新。

## 技术栈（已确认，见 `docs/adr/`）

| 层 | 选型 |
|----|------|
| 后端 | Node.js + TypeScript + **NestJS** |
| ORM | **Prisma** |
| 数据库 | **PostgreSQL**（本地 Docker） |
| Web 管理端 | React + TypeScript + Vite + **Ant Design** |
| 小程序 | 原生微信小程序 + TypeScript（测试号，无 AppID） |
| 仓库 | **pnpm Monorepo**：`apps/api` + `apps/web` + `apps/mini` + `packages/shared` |

## 认证模型

- **顾客**：微信 `wx.login` → `code2session` → `openid`，不绑定手机号。JWT 前缀 `cus_`
- **店员**：用户名 + 密码（种子数据预置），单 `staff` 角色。JWT 前缀 `stf_`
- 双 JWT secret + 前缀区分，中间件按前缀路由

## 核心模型

- **TimeSlot**：09:00-18:00，每 30 分钟一个时段（18 个/天）。懒生成未来 7 天。唯一约束 `date + startTime`
- **Booking**：单时段 1 单（`@@unique([slotId])`）。状态机：`booked` → `done` / `no_show` / `cancelled`
  - 取消释放时段（`slot.booked = false`）
  - 核销即 `done`（终态）
  - 失约 `no_show` 不释放时段
- **Customer**：`{ id, openid(unique) }`
- **Staff**：`{ id, username(unique), passwordHash }`

## 并发安全

创建预约时：事务 + `SELECT ... FOR UPDATE` 锁定时段行 + DB 唯一索引兜底。

## 文档结构

```
CONTEXT.md                      领域术语表
docs/
├── adr/                        架构决策（4 份）
│   ├── 0001-tech-stack-and-repo-structure.md
│   ├── 0002-auth-model.md
│   ├── 0003-booking-and-verification-model.md
│   └── 0004-time-slot-lazy-generation.md
├── design/
│   └── DESIGN.md               品牌视觉 Token（spec-driven，暖色系 + AntD 默认蓝）
├── prd/
│   └── shop-book-v1.md         完整 PRD（用户故事、API 契约、UI 页面设计、测试决策）
└── agents/                     Agent skills 配置（issue-tracker, triage-labels, domain, wiki）
```

## GitHub Issues（已拆解，全部 `ready-for-agent`）

| # | 标题 | 依赖 |
|---|------|------|
| #1 | PRD（父） | — |
| #2 | #D-global 验收 DESIGN.md（需补 platforms.md） | 无 |
| #3 | 基础设施：Monorepo + Prisma + 迁移 + 种子 | 无 |
| #4 | [wechat-mini] app-shell | #2 |
| #5 | [web-admin] app-shell | #2 |
| #6 | F1 店员认证：登录 API + Web 登录页 | #3, #5 |
| #7 | F2 顾客认证：微信登录 API + 小程序登录页 | #3, #4 |
| #8 | F3 预约主流程：时段懒生成 + 创建预约 + 小程序预约页 | #7, #4 |
| #9 | F4 我的预约：列表 + 取消 + 小程序页 | #8, #4 |
| #10 | F5 店员管理：列表 + 核销 + 失约 + Web 页 | #6, #5 |

**并行起点：** #2、#3（无依赖）。

## 当前执行进度

- ✅ Git 初始化 + GitHub remote `git@github.com:2834shi-cici/shop-book.git`（main 分支）
- ✅ setup-skills 完成（AGENTS.md + docs/agents/*）
- ✅ grill-me 完成（所有设计决策确认）
- ✅ to-prd 完成（PRD 文档 + Issue #1）
- ✅ to-issues 完成（8 个实现 Issue）
- ⏳ **#2 进行中**：DESIGN.md 已存在，需创建 `docs/design/platforms.md`
- ⏳ **#3 进行中**：Monorepo 脚手架 + Prisma + 迁移 + 种子

## 环境注意事项

- **Node**: v24.19.0
- **Docker**: 29.7.2（可用）
- **pnpm**: ⚠️ 未安装。`corepack enable` 因权限（`C:\Program Files\nodejs` 与 `AppData\Local\node` 受沙箱限制）失败。
  - **解决方案**：需在沙箱外执行 `corepack enable` 或 `npm install -g pnpm`，或用户手动安装 pnpm。
  - 安装完成后才能执行 `pnpm install`、`prisma generate`、`prisma migrate dev` 等。
- **Git**：已配置，提交正常。PowerShell 执行策略禁止运行脚本，但 git 命令正常。
- **`.trae/`** 已加入 `.gitignore`，不上传 GitHub。

## 关键约束（来自失败经验）

1. **不要在未确认 `git remote -v` 输出前断言远程状态**
2. **PowerShell 不支持 `&&`**，用 `;` 或分开执行
3. **创建预约必须并发安全**：事务 + 唯一约束，不能仅依赖前端置灰
4. **取消必须释放时段**，`done`/`no_show` 为终态不可取消
5. **时段字符串统一 `HH:mm`**（如 `09:00`），前端直接比对
6. **Prisma 生成**：用 `pnpm exec prisma generate`，不要硬编码 `node_modules` 路径
7. **微信 code2session**：暂无 AppID，开发阶段 mock 固定 openid

## API 契约速查

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | `/api/auth/wechat-login` | 公开 | 顾客微信登录 |
| POST | `/api/auth/staff-login` | 公开 | 店员登录 |
| GET | `/api/slots?date=` | 顾客 | 时段列表+占用（懒生成） |
| POST | `/api/bookings` | 顾客 | 创建预约 |
| GET | `/api/bookings/mine` | 顾客 | 我的预约 |
| PATCH | `/api/bookings/:id/cancel` | 顾客 | 取消（释放时段） |
| GET | `/api/admin/bookings?date=` | 店员 | 按日期查预约 |
| PATCH | `/api/admin/bookings/:id/verify` | 店员 | 核销→done |
| PATCH | `/api/admin/bookings/:id/no-show` | 店员 | 失约→no_show |

## 下一步行动

1. **用户手动安装 pnpm**（沙箱内无法安装）
2. 完成 **#2**：创建 `docs/design/platforms.md`（wechat-mini + web-admin 两段）
3. 完成 **#3**：
   - 根 `package.json` + `pnpm-workspace.yaml` + `tsconfig.base.json`
   - `apps/api`（NestJS 骨架 + Prisma schema + 迁移 + 种子）
   - `apps/web`（React+Vite 骨架）
   - `apps/mini`（小程序骨架）
   - `packages/shared`（共享类型如 `BookingStatus`）
   - `docker-compose.yml`（PostgreSQL）+ `.env`
4. `pnpm install` → `docker compose up -d` → `pnpm --filter api prisma migrate dev` → `pnpm --filter api prisma db seed`
