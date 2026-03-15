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
您和朋友可以通过邀请码体验系统。我们在数据库“播种（Seed）”阶段已经放入了一个初始邀请码。
- **邀请码**: `EARLYBIRD`
- 您可在注册界面（默认带有玻璃态渐变科技背景）使用该代码任意注册一个邮箱。
- **系统激励**: 初次使用邀请码进入系统的新账户，会自动获赠 **100 pts（积点体验金）**。

### 2. 探索 Dashboard
成功注册/登录之后，会跳转由于 JWT 中间件级保护的安全面板（Dashboard）：
- **深色模式切换**: 系统会自动根据系统环境设为暗色模式，体验极佳。
- **专用调用凭证（Platform Key）**: 你可以直接一键“Copy” 专属调用的 `tk_...` 秘钥。
- **Token 上游贡献**: 你可以在表单中上传自己平时闲置的 OpenAI API Key（需以 `sk-` 开头）。添加后会在左侧显示并且记录为你带来的累计收益积点。

### 3. API 代理调用与计费验证 (Core Test)
系统的调用规则已严格遵循流式传输解析协议（兼容 `stream: true` 时使用 `stream_options` 获取 OpenAI 返回的 Token Usage）：

1. **调用方 Endpoint**: 将原生 OpenAI 客户端请求从 `https://api.openai.com/v1/chat/completions` 改为平台转发器 `http://localhost:3000/api/v1/chat/completions`
2. **鉴权 Header**: `Authorization: Bearer tk_xxxxxxxx` (即你在 Dashboard 复制的个人专属 Key)
3. **分发规则**: 当您发出调用时，系统会在后端随机抓出一把**目前活跃状态的别人注入的 Token**，替您垫付去查 OpenAI 官方接口。
4. **扣补逻辑测试**: 如果调用完成了 150 Tokens，你的账户将会**精准扣减 150 pts**；并会自动将这 150 pts 汇款给被抽到提供官方 Token 的池子拥有者（如果是你本人作为管理员提供的廉价公用水库则不增加你的分）。如果 API 上游因为各种原因返回 `401/429` 报错，该官方 Token 会自动冻结在库中触发熔断。

> [!NOTE]
> 关于管理员的廉价 Token 注入：目前逻辑是，使用数据库 `seed.mjs` 中的 `admin@system.local` 账号来管理和追加免费公共 Token，并使其在后台数据库被标定具有公益属性（不会将赚取的积分计入个人名下）。后台的表字段保留了 `isAdminSupply`，能很好区分这种行为。

如果您对 UI 特效、中英切换逻辑有任何优化建议，或需要我在后续追加管理面板，请随时提出。
