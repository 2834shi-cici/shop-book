# 认证模型：微信 openid + 店员种子数据

顾客通过微信 `wx.login` → `code2session` 获取 `openid` 作为唯一标识，不绑定手机号。店员通过用户名 + 密码登录，账号由种子数据预置，v1 仅保留 `staff` 单角色。

顾客与店员使用不同的 JWT secret 和不同的 token 前缀（`cus_` / `stf_`），中间件按前缀路由，避免越权。v1 不做角色分级。

## Status

accepted

## Consequences

- 顾客侧无需注册流程，降低使用门槛
- 店员账号不可自助注册，需通过数据库种子或后续管理功能创建
- 双 secret 设计使得顾客 token 无法访问店员接口，反之亦然
