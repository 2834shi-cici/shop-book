# 平台清单 Platforms

> 多端平台标识与组件库映射。各端 UI issue 的 `platform-id` 须在本清单中注册。

## 平台列表

| platform-id | 端 | 技术栈 | 组件库 | 目录 |
|-------------|-----|--------|--------|------|
| `wechat-mini` | 顾客端（微信小程序） | 原生微信小程序 + TypeScript | 无（原生组件 + 自定义组件） | `apps/mini` |
| `web-admin` | 店员端（Web 管理端） | React + TypeScript + Vite | Ant Design 5 | `apps/web` |

## wechat-mini

- **运行时**：微信小程序基础库
- **语言**：TypeScript（编译为 JS）
- **样式**：WXSS，Token 从 `DESIGN.md` 映射为 CSS 变量 / WXSS 类
- **组件库映射**：

  | DESIGN 原语 | 实现方式 |
  |-------------|---------|
  | `card-default` | 自定义组件 `<card-default>` / WXSS 类 |
  | `slot-cell` | 自定义组件 `<slot-cell>` |
  | `status-badge` | 自定义组件 `<status-badge>` |
  | `button` | 原生 `<button>` + WXSS 样式类 |
  | 底栏 Tab | 原生 `tabBar` 配置（app.json） |

- **DESIGN Token 映射**：`DESIGN.md` 色板 / 字体 / 间距 / 圆角 Token 转为 WXSS 变量或工具类。

## web-admin

- **运行时**：浏览器（React 18 + Vite）
- **语言**：TypeScript
- **样式**：Ant Design 5 CSS-in-JS + 主题配置
- **组件库映射**：

  | DESIGN 原语 / 需求 | Ant Design 组件 |
  |-------------------|----------------|
  | 页面布局壳层 | `Layout`（Header + Content） |
  | 表单 / 输入框 | `Form` / `Input` |
  | 按钮 | `Button` |
  | 日期选择 | `DatePicker` |
  | 数据表格 | `Table` |
  | 状态标签 | `Tag`（颜色对应 `status-badge`） |
  | 操作确认 | `Popconfirm` |
  | 加载状态 | `Spin` / `Skeleton` |

- **DESIGN Token 映射**：主色沿用 Ant Design 默认 `#1677ff`；状态色（success / warning / danger）与小程序一致，通过 Ant Design 主题 `token` 配置。
