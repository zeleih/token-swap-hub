# 更新日志 — Token 共享平台

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
