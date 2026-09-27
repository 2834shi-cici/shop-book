# 设计系统 Design

> UI 模式：spec-driven。本文件定义品牌视觉 Token（色板、字体、间距、组件原语），PRD 中的 UI 设计描述引用此处 Token，不重复定义。

## 色板

### 微信小程序（顾客端）— 温馨暖色系

| Token | HEX | 用途 |
|-------|-----|------|
| `primary-500` | `#FF8A3D` | 主色：按钮、选中态、Tab 激活 |
| `primary-100` | `#FFF1E6` | 主色浅底：选中卡片背景 |
| `neutral-900` | `#1A1A1A` | 主标题、正文 |
| `neutral-600` | `#666666` | 次要文字 |
| `neutral-400` | `#999999` | 占位符、禁用文字 |
| `neutral-200` | `#E5E5E5` | 分割线 |
| `neutral-100` | `#F5F5F5` | 页面背景 |
| `surface-base` | `#FFFFFF` | 卡片背景 |
| `success-500` | `#52C41A` | 已完成状态 |
| `warning-500` | `#FAAD14` | 待核销状态 |
| `danger-500` | `#FF4D4F` | 失约/取消状态 |

### Web 管理端（店员端）— Ant Design 默认

沿用 Ant Design 5 默认主题，主色 `#1677ff`。状态色同小程序（success / warning / danger）。

## 字体

| Token | 字号 | 字重 | 用途 |
|-------|------|------|------|
| `text-headline-lg` | 20px | 600 | 页面主标题 |
| `text-title-md` | 16px | 500 | 区块标题 |
| `text-body` | 14px | 400 | 正文 |
| `text-caption` | 12px | 400 | 辅助说明 |

小程序默认字体：系统字体（苹方 / 思源黑体）。

## 间距

| Token | 值 |
|-------|-----|
| `spacing-xs` | 4px |
| `spacing-sm` | 8px |
| `spacing-md` | 16px |
| `spacing-lg` | 24px |
| `spacing-xl` | 32px |

## 圆角

| Token | 值 | 用途 |
|-------|-----|------|
| `radius-sm` | 4px | 按钮、输入框 |
| `radius-md` | 8px | 卡片 |
| `radius-lg` | 16px | 大卡片、时段格 |

## 通用组件原语

### 卡片 `card-default`
- 背景 `surface-base`，圆角 `radius-md`，内边距 `spacing-md`
- 阴影：`0 1px 2px rgba(0,0,0,0.06)`

### 时段格 `slot-cell`
- 固定宽高，圆角 `radius-lg`
- 可选态：白底 + `neutral-200` 边框
- 选中态：`primary-100` 背景 + `primary-500` 边框 + `primary-500` 文字
- 已占态：`neutral-100` 背景 + `neutral-400` 文字，不可点击

### 状态徽章 `status-badge`
- 圆角 `radius-sm`，内边距 `spacing-xs` `spacing-sm`，字号 `text-caption`
- `booked`：`warning-500` 文字 + `#FFF7E6` 背景
- `done`：`success-500` 文字 + `#F6FFED` 背景
- `cancelled`：`neutral-400` 文字 + `neutral-100` 背景
- `no_show`：`danger-500` 文字 + `#FFF1F0` 背景

### 按钮 `button`
- 主按钮：`primary-500` 实心背景 + 白色文字，圆角 `radius-sm`，内边距 `spacing-sm` `spacing-lg`
- 次按钮：白底 + `neutral-200` 描边 + `neutral-900` 文字，圆角 `radius-sm`
- 全宽按钮：`width: 100%`
- 禁用态：`neutral-400` 文字 + `neutral-100` 背景，不可点击
- loading 态：显示加载指示器，禁用点击

### 小程序底栏 Tab
- 高度 50px + 安全区，背景 `surface-base`
- 上方 `neutral-200` 分割线
- 图标 24px，标签 10px
- 未选中：`neutral-400`；选中：`primary-500`

## 宜忌

- 页面统一 `neutral-100` 背景，卡片用 `surface-base` 浮起
- 主操作按钮用 `primary-500` 实心，次要操作用描边按钮
- 禁用态用 `neutral-400` 文字 + `neutral-100` 背景
- 不使用实线分割线分隔区块，用间距和卡片区分
