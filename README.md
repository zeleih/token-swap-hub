# Token 共享平台 | Token Swap Hub

<p align="center">
  <strong>共享闲置 Token，赚取信用点数，消耗点数使用 AI 能力</strong>
</p>

---

## ✨ 功能特性

- 🔑 **邀请制注册** — 通过邀请码加入平台，保证小圈子安全与信任
- 💎 **信用点数系统** — 分享 Token 赚点数 (蓄水)，消耗点数调用 AI (放水)
- 🔄 **智能代理转发** — 兼容 OpenAI `/v1` API 格式，支持流式 (SSE) 和非流式
- 📊 **精准 Token 计费** — 按实际消耗的 Tokens 精确计量增减积分
- 🛡️ **自动熔断机制** — 遇到 `401/429` 错误自动冻结失效 Token
- 🌐 **中英双语切换** — 界面支持一键切换中文/English
- 🌑 **深色科技 UI** — 采用 Glassmorphism 玻璃拟态 + 深色模式设计

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm

### 安装与运行

```bash
# 1. 克隆仓库
git clone https://github.com/hhuhzl1128/token-swap-hub.git
cd token-swap-hub

# 2. 安装依赖
npm install

# 3. 初始化数据库
npx prisma db push

# 4. 生成 Prisma Client
npx prisma generate

# 5. 生成初始邀请码
node seed.mjs

# 6. 启动开发服务器
npm run dev
```

启动后访问 [http://localhost:3000](http://localhost:3000)

### 初始邀请码

系统已预置邀请码：**`EARLYBIRD`**（最多可注册 100 位用户）

注册成功后将自动获得 **100 信用点数** 作为体验金。

## 🏗️ 技术架构

| 模块 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 数据库 | Prisma ORM + SQLite |
| 认证 | JWT (jose) + bcryptjs |
| 国际化 | next-intl |
| 主题 | next-themes (暗色模式) |

## 📁 项目结构

```
src/
├── actions/          # Server Actions (登录/注册/Token管理)
├── app/
│   ├── [locale]/     # 国际化动态路由
│   │   ├── dashboard/  # 控制台 (含组件)
│   │   ├── login/      # 登录页
│   │   └── register/   # 注册页
│   └── api/v1/       # API 代理转发路由
├── components/       # 全局组件
├── i18n/             # 国际化配置
└── lib/              # Prisma 客户端 & Session 管理
messages/             # 中英文翻译字典
prisma/               # 数据库 Schema
```

## 🔌 API 使用方式

注册登录后，在控制台复制您的 **Platform Key**，然后在任何兼容 OpenAI 的客户端中设置：

- **Base URL**: `http://your-domain/api/v1`
- **API Key**: `tk_xxxxxxxx` (您的平台专属 Key)

```bash
# 示例：curl 调用
curl http://localhost:3000/api/v1/chat/completions \
  -H "Authorization: Bearer tk_your_platform_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## 📜 License

MIT
