# Carbon Proxy

<div align="center">
<a href="https://github.com/stonev5/carbon"><img src="https://cdn.buape.com/carbon/wordmark.png" alt="Carbon Wordmark"></a>

<img alt="Discord" src="https://img.shields.io/discord/1280628625904894072?style=for-the-badge">
<img alt="NPM Version" src="https://img.shields.io/npm/v/carbon-proxy?style=for-the-badge">
<img alt="NPM Downloads" src="https://img.shields.io/npm/dm/carbon-proxy?style=for-the-badge">
</div>

> Carbon 框架的代理增强版 - 支持通过 HTTP/SOCKS5 代理访问 Discord API

这是基于 [@buape/carbon](https://github.com/buape/carbon) 的 fork 版本，增加了对代理的支持，方便在需要代理的环境中使用。

## ✨ 新增特性

本版本在原版基础上新增：

- **🔒 HTTP 代理支持** - 通过 HTTP 代理访问 Discord API
- **🧦 SOCKS5 代理支持** - 支持 SOCKS5 协议的代理
- **⚙️ 灵活配置** - 支持环境变量和代码配置两种方式
- **🌍 国际化友好** - 完美支持中国大陆等需要代理的地区

## 原版特性

Carbon 是一个功能完善的 Discord HTTP 框架，使用 TypeScript 构建，设计简洁易懂。

- 完全兼容 Discord API
- 灵活强大
- 基于类的系统，易于复用
- 支持多平台部署（Node.js、Cloudflare Workers、Bun、Next.js）

## 📦 安装

```bash
npm install carbon-proxy
# 或
pnpm add carbon-proxy
# 或
yarn add carbon-proxy
```

## 🚀 快速开始

### 基础用法（不带代理）

```typescript
import { Client } from "carbon-proxy"

const client = new Client({
  clientId: "your-client-id",
  publicKey: "your-public-key",
  token: "your-bot-token",
  baseUrl: "http://localhost:3000"
})

client.startServer()
```

### 使用 HTTP 代理

**方式一：环境变量（推荐）**

```bash
# 设置代理环境变量
export HTTPS_PROXY="http://127.0.0.1:7891"
export HTTP_PROXY="http://127.0.0.1:7891"

# 或使用 Discord 专用代理变量
export DISCORD_HTTP_PROXY="http://127.0.0.1:7891"

# 运行你的 bot
node dist/index.js
```

**方式二：代码配置**

```typescript
import { Client } from "carbon-proxy"

const client = new Client({
  clientId: "your-client-id",
  publicKey: "your-public-key",
  token: "your-bot-token",
  baseUrl: "http://localhost:3000",
  requestOptions: {
    proxy: "http://127.0.0.1:7891"
  }
})

client.startServer()
```

### 使用 SOCKS5 代理

**环境变量方式：**

```bash
export ALL_PROXY="socks5://127.0.0.1:7892"
node dist/index.js
```

**代码配置方式：**

```typescript
import { Client } from "carbon-proxy"

const client = new Client({
  clientId: "your-client-id",
  publicKey: "your-public-key",
  token: "your-bot-token",
  baseUrl: "http://localhost:3000",
  requestOptions: {
    proxy: "socks5://127.0.0.1:7892"
  }
})

client.startServer()
```

## 🔧 代理配置说明

### 支持的代理格式

- **HTTP 代理**: `http://host:port` 或 `http://user:pass@host:port`
- **HTTPS 代理**: `https://host:port` 或 `https://user:pass@host:port`
- **SOCKS 代理**: `socks://host:port`, `socks4://host:port`, `socks5://host:port`

### 环境变量优先级

按优先级从高到低：

1. `DISCORD_HTTP_PROXY` - Discord 专用代理
2. `HTTPS_PROXY` - HTTPS 请求代理
3. `HTTP_PROXY` - HTTP 请求代理
4. `ALL_PROXY` - 所有请求代理

### 常用代理软件配置

**Clash**
```bash
export HTTP_PROXY="http://127.0.0.1:7890"
export HTTPS_PROXY="http://127.0.0.1:7890"
```

**V2Ray**
```bash
export HTTP_PROXY="http://127.0.0.1:10809"
export HTTPS_PROXY="http://127.0.0.1:10809"
```

**Shadowsocks (需要 SOCKS5 支持)**
```bash
export ALL_PROXY="socks5://127.0.0.1:7891"
```

## 📖 完整示例

```typescript
import { Client, Intents } from "carbon-proxy"
import { MyCommand } from "./commands/MyCommand"

const client = new Client({
  clientId: process.env.CLIENT_ID!,
  publicKey: process.env.PUBLIC_KEY!,
  token: process.env.TOKEN!,
  baseUrl: "http://localhost:3000",
  // 配置代理（可选，也可以用环境变量）
  requestOptions: {
    proxy: process.env.DISCORD_HTTP_PROXY
  }
})

// 注册命令
client.registerCommand(MyCommand)

// 启动服务器
client.startServer()
```

## 🧪 测试代理连接

项目包含代理测试脚本，可以快速验证代理配置：

```bash
cd node_modules/carbon-proxy

# 测试 HTTP 代理
DISCORD_BOT_TOKEN="your_token" HTTPS_PROXY="http://127.0.0.1:7891" node test-proxy.mjs

# 测试 SOCKS5 代理
DISCORD_BOT_TOKEN="your_token" ALL_PROXY="socks5://127.0.0.1:7892" node test-proxy.mjs
```

## 🔍 故障排查

### 代理连接失败

1. **确认代理服务正在运行**
   ```bash
   curl -x http://127.0.0.1:7891 https://www.google.com
   ```

2. **检查代理格式**
   - 确保使用正确的协议前缀：`http://`, `socks5://`
   - 确保端口号正确

3. **检查代理认证**
   - 如果代理需要认证，使用格式：`http://username:password@host:port`

### 请求超时

- 增加请求超时时间（如果支持）
- 检查代理服务器的网络连接
- 尝试切换到不同的代理协议（HTTP → SOCKS5）

## 📚 相关资源

- [原版文档](https://carbon.buape.com/carbon)
- [原版 Discord 社区](https://go.buape.com/carbon)
- [Discord API 文档](https://discord.com/developers/docs/intro)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 基于 [@buape/carbon](https://github.com/buape/carbon) 修改

## 🙏 致谢

感谢 [buape](https://github.com/buape) 开发了这么优秀的 Carbon 框架！

---

**注意**: 本版本是 fork 的增强版，主要用于需要代理的场景。如果你不需要代理功能，建议使用[原版](https://www.npmjs.com/package/@buape/carbon)。
