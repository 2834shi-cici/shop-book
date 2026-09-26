# 技术栈与仓库结构选型

后端采用 Node.js + TypeScript + NestJS，ORM 用 Prisma，数据库用 PostgreSQL（本地 Docker）。Web 管理端用 React + TypeScript + Vite + Ant Design。小程序用原生微信小程序 + TypeScript。仓库采用 pnpm Monorepo（`apps/api` + `apps/web` + `apps/mini` + `packages/shared`）。

选择 TypeScript 全栈是为了前后端共享类型定义，减少联调错误。NestJS 结构清晰适合中大型后端；Prisma 类型安全、迁移管理清晰；PostgreSQL 支持事务和行级锁，适合时段抢占场景。Monorepo 让 `packages/shared` 可跨端共享 `BookingStatus` 等类型。

## Status

accepted

## Considered Options

- Java + Spring Boot + MySQL：团队不熟悉，TypeScript 全栈共享类型优势更大
- Fastify 而非 NestJS：更轻量但缺少 NestJS 的模块化结构
- 单仓库多目录而非 Monorepo：无法共享类型
