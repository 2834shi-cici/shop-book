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

## UI 与设计要求

**UI 模式**：spec-driven。UI 设计描述（本节文字）为编码唯一权威来源。品牌视觉 Token 见 `docs/design/DESIGN.md`。

### 用户故事 ↔ 页面映射

| 用户故事编号 | 端 | page-id | 该页承担的故事范围 |
|------|------|---------|-------------|
| — | 微信小程序 | app-shell | —（壳层） |
| US-1 | 微信小程序 | login | US-1 微信登录 |
| US-2, US-3, US-4, US-7 | 微信小程序 | booking | US-2 查时段、US-3 填宠物、US-4 提交、US-7 占用置灰 |
| US-5, US-6 | 微信小程序 | my-bookings | US-5 列表状态、US-6 取消 |
| — | Web 管理端 | app-shell | —（壳层） |
| US-8 | Web 管理端 | login | US-8 账号登录 |
| US-9, US-10, US-11, US-12, US-13 | Web 管理端 | booking-list | US-9~US-13 列表/核销/失约/状态区分 |

### 状态策略

| 状态 | 处理方式 |
|------|----------|
| 加载中 | 骨架屏 / Spin（复用 DESIGN 组件原语） |
| 空状态 | 列表为空时居中展示空状态插画 + 文案 |
| 错误 / 禁用 | 网络错误用 Toast 提示；按钮禁用态用 `neutral-400` |
| 表单校验 | 字段下方红字提示 |

### 页面清单

---

#### 微信小程序 `wechat-mini`

##### `app-shell`（小程序框架壳）

- **主任务**：定义全局导航壳层
- **覆盖的用户故事**：—（壳层）
- **DESIGN 复用**：底栏 Tab §5
- **UI 设计描述**：
  - viewport 分三区：顶栏（44px + 状态栏）、内容区（flex 填充）、底栏 Tab（50px + 安全区）
  - 底栏 Tab 两项：「预约」「我的预约」，图标 24px，标签 10px；未选中 `neutral-400`，选中 `primary-500`
  - 内容区背景 `neutral-100`，默认左右边距 16px
  - 壳层变体：`login` 脱离壳层（无顶栏无底栏）；`booking` 预约流程隐藏底栏 Tab

##### `login`（登录）

- **主任务**：微信一键登录
- **覆盖的用户故事**：US-1
- **DESIGN 复用**：按钮
- **UI 设计描述**：
  - 脱离 app-shell，全屏独立页，背景 `neutral-100`
  - 居中展示品牌 logo（宠物图标占位）+ 文案「宠物洗护预约」
  - 底部固定主操作按钮：「微信一键登录」，`primary-500` 实心，全宽，圆角 `radius-sm`
  - 点击后调用 `wx.login` 获取 code，调用后端登录接口
  - 登录成功后 `switchTab` 到预约页
  - 加载变体：按钮显示 loading，禁用点击

##### `booking`（预约）

- **主任务**：选日期 + 时段 + 填宠物信息 → 提交
- **覆盖的用户故事**：US-2, US-3, US-4, US-7
- **DESIGN 复用**：时段格 `slot-cell`、卡片 `card-default`、状态徽章
- **UI 设计描述**：
  - 继承 app-shell，底栏 Tab 选中「预约」
  - 顶栏标题「预约」
  - 内容区自上而下：
    1. **日期选择区**：横向滚动日期条，展示未来 7 天；每列显示「MM/DD」+「周X」+「今天」标签；选中态 `primary-500` 文字 + 下划线；默认选中今天
    2. **时段网格区**：标题「选择时段」；3 列网格布局，每个时段格为 `slot-cell`；可选态白底，选中态 `primary-100` 底+`primary-500` 边框，已占态 `neutral-100` 底+`neutral-400` 文字且不可点击
    3. **宠物信息区**（选中时段后出现）：卡片 `card-default`，含输入框「宠物名字」（必填）、「宠物品种」（必填）
    4. **提交按钮**：固定底部，`primary-500` 实心全宽，文案「确认预约」；未选时段或未填宠物信息时禁用
  - 时段数据来自 `GET /api/slots?date=`
  - 提交调用 `POST /api/bookings`，成功后 Toast 提示并跳转到「我的预约」
  - 冲突变体：提交时若时段被他人抢占，返回 409，Toast「该时段已被预约，请重新选择」并刷新时段

##### `my-bookings`（我的预约）

- **主任务**：查看预约列表 + 状态 + 取消
- **覆盖的用户故事**：US-5, US-6
- **DESIGN 复用**：卡片 `card-default`、状态徽章 `status-badge`
- **UI 设计描述**：
  - 继承 app-shell，底栏 Tab 选中「我的预约」
  - 顶栏标题「我的预约」
  - 内容区为预约卡片列表，按日期倒序排列
  - 每张卡片 `card-default` 含：
    - 顶部：日期「MM月DD日」+ 时段「HH:mm-HH:mm」+ 右侧状态徽章
    - 中部：宠物名、品种
    - 底部（仅 `booked` 状态）：「取消预约」按钮（描边 `danger-500`），点击弹确认框
  - 状态徽章颜色按 DESIGN `status-badge` 原语
  - 空状态变体：居中「暂无预约」+ 引导去预约按钮
  - 页面 `onShow` 时调用 `GET /api/bookings/mine` 刷新列表

---

#### Web 管理端 `web-admin`

##### `app-shell`（管理端框架壳）

- **主任务**：定义管理端布局壳层
- **覆盖的用户故事**：—（壳层）
- **DESIGN 复用**：Ant Design Layout
- **UI 设计描述**：
  - 使用 Ant Design Layout：顶部 Header（64px）+ 内容区 Content
  - Header：左侧品牌名「shop-book 管理端」，右侧店员用户名 + 退出登录
  - 内容区背景 `neutral-100`，内边距 24px
  - 壳层变体：`login` 脱离壳层（全屏居中卡片）

##### `login`（登录）

- **主任务**：账号密码登录
- **覆盖的用户故事**：US-8
- **DESIGN 复用**：Ant Design Form / Input / Button
- **UI 设计描述**：
  - 脱离 app-shell，全屏背景 `neutral-100`，居中登录卡片
  - 卡片标题「店员登录」
  - 表单字段：用户名（Input）、密码（Input.Password）
  - 底部主操作：「登录」按钮（AntD primary），全宽
  - 调用 `POST /api/auth/staff-login`，成功后跳转预约管理页
  - 错误变体：账号密码错误时表单顶部红字提示

##### `booking-list`（预约管理）

- **主任务**：按日期查预约 + 核销 + 失约
- **覆盖的用户故事**：US-9, US-10, US-11, US-12, US-13
- **DESIGN 复用**：Ant Design DatePicker / Table / Tag / Button / Popconfirm
- **UI 设计描述**：
  - 继承 app-shell
  - 内容区顶部：日期选择器（DatePicker，默认今天）+「查询」按钮
  - 下方为 Table，列：
    - 时段（startTime）
    - 宠物名
    - 品种
    - 状态（Tag，颜色对应 DESIGN `status-badge`）
    - 创建时间
    - 操作：`booked` 状态显示「核销」（primary 按钮）+「失约」（danger 按钮，Popconfirm 确认）；其他状态无操作
  - 数据来自 `GET /api/admin/bookings?date=`
  - 核销调用 `PATCH /api/admin/bookings/:id/verify`，成功后刷新列表
  - 失约调用 `PATCH /api/admin/bookings/:id/no-show`，成功后刷新列表
  - 空状态变体：Table 空数据展示「当日暂无预约」

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

## 测试决策

测试只测外部行为，不测实现细节。优先使用最高层级接缝。

### HTTP 集成接缝

- 用 `supertest` 直接打 REST API，验证响应状态码、响应体、数据库副作用
- 覆盖核心流程：预约创建（201）、时段冲突（409）、取消（释放时段）、核销、失约、鉴权失败（401）、越权（403）
- 使用独立测试数据库，每个用例前清空数据

### Prisma 集成接缝

- 用测试数据库验证 Prisma schema、迁移、唯一约束
- 重点验证并发抢占：两个请求同时约同一时段，仅一个成功（唯一索引兜底）

### Service 单元接缝

- 对 BookingService / SlotService 的纯业务逻辑做单元测试
- 覆盖：状态机合法性校验（如 `done` 不可取消）、时段占用判定

### 前端 API 契约接缝

- 用 MSW 或 mock 拦截 HTTP，验证前后端数据契约
- 覆盖：预约列表渲染、状态徽章颜色、核销/失约操作调用正确接口

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
