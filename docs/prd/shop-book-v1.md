# shop-book v1 — 宠物洗护门店预约核销系统

## 问题陈述

宠物洗护门店目前通过电话或微信手动记录顾客预约，存在以下痛点：
- 店员难以掌握当天预约全貌，容易漏单或重复安排
- 顾客无法自助查看剩余时段，需反复沟通
- 核销（确认到店服务）全靠口头，无记录可查
- 顾客到店状态不透明，无法主动了解预约是否已完成

## 解决方案

构建一套三端系统：
- **微信小程序**（顾客端）：微信登录 → 选择日期和时段 → 填写宠物信息 → 提交预约 → 查看预约状态
- **Web 管理端**（店员端）：登录 → 查看预约列表（按日期）→ 核销 / 标记失约
- **后端 REST API**：统一处理认证、时段管理、预约创建与状态流转

主路径：顾客预约 → 店员核销 → 小程序状态更新。

## 用户故事

### 微信小程序（顾客端）

US-1：作为顾客，我想要用微信一键登录，以便无需注册即可使用。
US-2：作为顾客，我想要查看未来 7 天每天的可用时段，以便选择合适的时间预约。
US-3：作为顾客，我想要在选中时段后填写宠物名字和品种，以便门店提前了解宠物信息。
US-4：作为顾客，我想要提交预约并看到确认结果，以便知道预约成功。
US-5：作为顾客，我想要在「我的预约」中查看所有预约及其状态（待核销/已完成/已取消/失约），以便随时了解进度。
US-6：作为顾客，我想要在核销前随时取消预约，以便计划有变时释放时段。
US-7：作为顾客，我想要看到已被占用的时段不可选，以便避免选到无效时段。

### Web 管理端（店员端）

US-8：作为店员，我想要用账号密码登录管理端，以便管理预约。
US-9：作为店员，我想要按日期查看当天/指定日期的预约列表，以便了解工作安排。
US-10：作为店员，我想要在预约列表中看到顾客的宠物信息和预约时段，以便到店核对。
US-11：作为店员，我想要点击「核销」按钮完成预约，以便确认顾客已到店服务。
US-12：作为店员，我想要标记顾客「失约」，以便记录未到店情况。
US-13：作为店员，我想要看到不同状态的预约有明显区分，以便快速识别。

## 实现决策

### 技术栈

后端：Node.js + TypeScript + NestJS + Prisma + PostgreSQL（本地 Docker）
Web 管理端：React + TypeScript + Vite + Ant Design
小程序：原生微信小程序 + TypeScript（测试号）
仓库：pnpm Monorepo（`apps/api` / `apps/web` / `apps/mini` / `packages/shared`）

详见 `docs/adr/0001-tech-stack-and-repo-structure.md`。

### 认证模型

详见 `docs/adr/0002-auth-model.md`。

- 顾客：微信 `wx.login` → `code2session` → `openid`，不绑定手机号
- 店员：用户名 + 密码（种子数据预置），单 `staff` 角色
- JWT：顾客/店员不同 secret + 前缀（`cus_` / `stf_`）

### 预约与核销模型

详见 `docs/adr/0003-booking-and-verification-model.md`。

- 单服务（宠物洗护），不涉及价格和支付
- 固定时段：09:00-18:00，每 30 分钟一个时段（18 个/天）
- 单时段 1 单，唯一约束 `date + slot_id`
- 提前 7 天可约（含当天）
- 状态机：`booked` → `done` / `no_show` / `cancelled`
- 顾客可随时取消（核销前），取消释放时段
- 店员手动核销，核销即完成（`done`）
- 店员可标记失约（`no_show`），时段不释放

### 时段懒生成

详见 `docs/adr/0004-time-slot-lazy-generation.md`。

- 顾客打开预约页时，后端懒生成未来 7 天时段
- 时段字符串统一 `HH:mm` 格式

### API 契约

所有接口前缀 `/api`。

#### `POST /api/auth/wechat-login`
- 请求体：`{ code: string }`
- 响应：`{ token: string, customerId: string }`
- 行为：用 `code` 调微信 `code2session` 换 `openid`，查找或创建顾客，签发 `cus_` 前缀 JWT

#### `POST /api/auth/staff-login`
- 请求体：`{ username: string, password: string }`
- 响应：`{ token: string, staffId: string }`
- 行为：校验种子账号密码，签发 `stf_` 前缀 JWT

#### `GET /api/slots?date=YYYY-MM-DD`
- 鉴权：顾客
- 响应：`{ slots: [{ id, startTime: "09:00", endTime: "09:30", booked: boolean }] }`
- 行为：懒生成未来 7 天时段（含当天），返回指定日期的时段列表及占用状态

#### `POST /api/bookings`
- 鉴权：顾客
- 请求体：`{ slotId: string, petName: string, petBreed: string }`
- 响应：`{ id, status: "booked", ... }`
- 行为：校验时段存在且未被占用（并发安全：事务 + 唯一约束），创建预约并标记时段占用

#### `GET /api/bookings/mine`
- 鉴权：顾客
- 响应：`{ bookings: [{ id, date, startTime, petName, petBreed, status, createdAt }] }`
- 行为：返回当前顾客的所有预约，按日期倒序

#### `PATCH /api/bookings/:id/cancel`
- 鉴权：顾客（仅本人预约）
- 响应：`{ id, status: "cancelled" }`
- 行为：仅 `booked` 状态可取消；释放时段（`booked = false`）

#### `GET /api/admin/bookings?date=YYYY-MM-DD`
- 鉴权：店员
- 响应：`{ bookings: [{ id, date, startTime, petName, petBreed, status, customerOpenid }] }`
- 行为：返回指定日期的所有预约，按时段排序

#### `PATCH /api/admin/bookings/:id/verify`
- 鉴权：店员
- 响应：`{ id, status: "done" }`
- 行为：仅 `booked` 状态可核销；置为 `done`

#### `PATCH /api/admin/bookings/:id/no-show`
- 鉴权：店员
- 响应：`{ id, status: "no_show" }`
- 行为：仅 `booked` 状态可标记失约；置为 `no_show`，时段不释放

### 数据模型（Prisma）

```
Customer
  id, openid (unique), createdAt

Staff
  id, username (unique), passwordHash, createdAt

TimeSlot
  id, date, startTime ("HH:mm"), endTime ("HH:mm"), booked (bool)
  @@unique([date, startTime])

Booking
  id, customerId, slotId, petName, petBreed, status, createdAt, verifiedAt
  status enum: BOOKED | DONE | NO_SHOW | CANCELLED
  @@unique([slotId])   // 时段维度唯一
```

## 范围外（v1 不做）

- 多服务目录与价格、在线支付
- 预约统计报表与数据可视化
- 微信订阅消息推送通知
- 店员多角色权限体系（admin / staff）
- 顾客绑定手机号
- 核销码 / 二维码扫码核销
- 生产环境部署规划
- 店员排班与多店员并行服务

## 补充说明

- 小程序暂无 AppID，先用测试号开发；微信 `code2session` 需 AppID + AppSecret，开发阶段可用 mock 或等待 AppID
- 后端本地运行（`pnpm dev`），PostgreSQL 用 Docker Compose
- 并发安全：创建预约时使用事务 + `SELECT ... FOR UPDATE` 锁定时段行，配合唯一索引兜底
