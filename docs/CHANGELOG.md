# 更新日志 — Token 共享平台

## v5 — 2026-03-15

### 新增功能
- ✅ **Dashboard 语言切换**: 导航栏新增 EN/中 按钮，一键切换中英文界面

### Bug 修复
- ✅ **提供商修正**: Groq → xAI Grok（`api.x.ai/v1`，前缀 `xai-`）

### 改进
- ✅ **使用记录合并**: 移除独立"定向使用记录"区块，合并到主记录中用蓝色 [定向] 标签区分
- ✅ **Token 源改名**: "提供的 Token" → "提供的 Token 源"，"添加 Token" → "添加 Token 源"
- ✅ **定向 Token 标注**: Token 源卡片中定向开放的 Token 显示青色 [定向] 标签

---

## v4 — 2026-03-15

### 新增功能
- ✅ **多平台支持**: OpenAI / DeepSeek / 智谱 GLM / Moonshot / 通义千问 / Claude / Gemini / Grok / Mistral / 自定义
- ✅ **Token 暂停开关**: 用户可暂停/恢复 Token 共享，PAUSED 状态不会被代理选中
- ✅ **Token 用量展示**: 进度条显示已用量 / 上限，无限制时标注"无限制"
- ✅ **公告更新**: 测试阶段提示 + Bug 赏金邮箱 (hhuhzl@outlook.com)

### Bug 修复
- ✅ **登录报错**: Prisma Client 缓存未更新导致服务端异常

### 改进
- ✅ 取消 API Key 的 `sk-` 前缀强制限制，适配不同平台
- ✅ 平台配置独立到 `src/lib/providers.ts`

---

## v3 — 2026-03-15

### 新增功能
- ✅ **平台 Key 重置**: Dashboard 平台 Key 卡片新增"重置"按钮，二次确认后生成新 Key
- ✅ **定向 Token 独立统计**: 定向开放的 Token 使用不计入总额度、不影响信用点数、不算排行榜，使用记录单独展示
- ✅ 数据库 `RequestLog` 新增 `isDirected` 字段

### Bug 修复
- ✅ **弹窗被遮挡**: 使用 React `createPortal` 将弹窗渲染到 `document.body`，解决 nav 的 `backdrop-blur` 创建 stacking context 导致的层叠问题
- ✅ **主题切换无效**: 添加 Tailwind v4 的 `@custom-variant dark` 指令，配合 `next-themes` 的 `.dark` 类策略
- ✅ **ThemeToggle**: 使用 `resolvedTheme` 替代 `theme`，修复 `enableSystem` 下的判断错误

### 改进
- ✅ 平台名称从"抽水蓄能"统一改为"共享"
- ✅ Token 选取规则变更：只使用自己的 Token / 管理员公共 Token / 定向开放的 Token，不使用他人 Token

---

## v2 — 2026-03-15

### 新增功能
- ✅ 平台 API URL 展示与一键复制
- ✅ 用户名注册（替代强制邮箱）
- ✅ 个人信息编辑（昵称、排行榜展示设置）
- ✅ 排行榜（贡献榜 + 消费榜，日/周/月/年/总）
- ✅ OAuth 添加 Token（UI 占位）
- ✅ Token 使用上限与定向开放
- ✅ 信用点数赠送（CONFIRM 二次确认）

### 改进
- ✅ 左侧可折叠菜单栏（控制台 + 工具箱）
- ✅ 亮/暗主题切换
- ✅ 公告栏 + 平台介绍

---

## v1 — 2026-03-15

### 核心功能
- ✅ 邀请制注册 + JWT 认证
- ✅ Token 共享池与仪表台
- ✅ OpenAI 兼容代理转发（流式+非流式）
- ✅ 精准 Token 计费的信用点数系统
- ✅ 自动熔断失效 Token
- ✅ 中英双语 (next-intl)
- ✅ 深色玻璃拟态 UI
