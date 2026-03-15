# 闲置 Token 抽水蓄能平台验收与使用指南

您好，系统已全部搭建完成！我用现代极简科技风为您构建了这个支持双语切换（中文/English）的 Next.js 前端应用，并且在后端植入了精密防篡改的 JWT 鉴权与 API 路由引擎。

> [!TIP]
> **如何快速在本地启动体验？**
> 
> 1. 打开您的终端（Terminal）。
> 2. 进入项目目录：`cd /Users/hhuhzl/.gemini/antigravity/playground/warped-voyager`
> 3. 运行：`npm run dev`
> 4. 使用浏览器访问：`http://localhost:3000`

## 体验与验证步骤 (Verification Steps)

### 1. 使用邀请码注册体验
您和朋友可以通过邀请码体验系统。我们在数据库"播种（Seed）"阶段已经放入了一个初始邀请码。
- **邀请码**: `EARLYBIRD`
- 您可在注册界面使用该代码注册一个自定义用户名（推荐但不强制使用邮箱）。
- **系统激励**: 初次使用邀请码进入系统的新账户，会自动获赠 **100 pts（积点体验金）**。

### 2. 探索 Dashboard
成功注册/登录之后，会跳转由于 JWT 中间件级保护的安全面板（Dashboard）：
- **亮/暗模式切换**: 顶栏提供 ☀️/🌙 按钮一键切换主题。
- **左侧菜单栏**: 可折叠的导航菜单，方便后续拓展更多功能页面。
- **专用调用凭证（Platform Key + URL）**: 一键复制专属 `tk_...` 密钥和 API 地址。
- **Token 上游贡献**: 支持手动输入 API Key 或 OAuth 授权（占位），可设置使用上限和定向开放。
- **排行榜**: 查看社区贡献和消费排名（日/周/月/年/总）。
- **积分赠送**: 把自己的信用点数送给朋友（需二次确认）。
- **公告栏**: 平台最新公告和使用说明。

### 3. API 代理调用与计费验证 (Core Test)
系统的调用规则已严格遵循流式传输解析协议（兼容 `stream: true` 时使用 `stream_options` 获取 OpenAI 返回的 Token Usage）：

1. **调用方 Endpoint**: 将原生 OpenAI 客户端请求从 `https://api.openai.com/v1/chat/completions` 改为平台转发器 `http://localhost:3000/api/v1/chat/completions`
2. **鉴权 Header**: `Authorization: Bearer tk_xxxxxxxx` (即你在 Dashboard 复制的个人专属 Key)
3. **Token 选取规则**: 系统只会使用以下三类 Token：① 您自己提供的 Token ② 管理员注入的公共 Token ③ 其他用户定向开放给您的 Token。**系统不会使用其他用户的 Token**。如果没有可用 Token，会返回 503 错误提示。
4. **扣补逻辑**: 使用自己的 Token 或管理员公共 Token 时，按精确 token 用量扣减信用点数。定向开放的 Token 双方不计费。如果 API 上游返回 `401/429` 报错，该 Token 会自动冻结触发熔断。

> [!NOTE]
> 关于管理员的廉价 Token 注入：目前逻辑是，使用数据库 `seed.mjs` 中的 `admin` 账号来管理和追加免费公共 Token，并使其在后台数据库被标定具有公益属性（不会将赚取的积分计入个人名下）。后台的表字段保留了 `isAdminSupply`，能很好区分这种行为。

如果您对 UI 特效、中英切换逻辑有任何优化建议，或需要我在后续追加管理面板，请随时提出。
