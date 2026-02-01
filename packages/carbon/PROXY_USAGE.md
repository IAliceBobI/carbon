# Carbon Proxy - 完整使用指南

> Carbon 框架的代理增强版，支持 HTTP/SOCKS5 代理访问 Discord API

## 📦 安装

```bash
# npm
npm install carbon-proxy

# pnpm
pnpm add carbon-proxy

# yarn
yarn add carbon-proxy
```

## 🚀 快速开始

### 1. 基础使用（不带代理）

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

### 2. 使用环境变量配置代理（推荐）

```bash
# 设置代理环境变量
export HTTPS_PROXY="http://127.0.0.1:7891"
export HTTP_PROXY="http://127.0.0.1:7891"

# 或使用 Discord 专用代理变量（优先级最高）
export DISCORD_HTTP_PROXY="http://127.0.0.1:7891"

# 运行你的 bot
node dist/index.js
```

### 3. 在代码中配置代理

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

## 🔧 代理配置详解

### 支持的代理格式

| 类型 | 格式 | 示例 |
|------|------|------|
| HTTP 代理 | `http://host:port` | `http://127.0.0.1:7891` |
| HTTPS 代理 | `https://host:port` | `https://proxy.example.com:8443` |
| SOCKS5 代理 | `socks5://host:port` | `socks5://127.0.0.1:7892` |
| 带认证的代理 | `http://user:pass@host:port` | `http://user:pass@127.0.0.1:7891` |

### 环境变量优先级

从高到低：

1. `DISCORD_HTTP_PROXY` - Discord 专用代理
2. `HTTPS_PROXY` - HTTPS 请求代理
3. `HTTP_PROXY` - HTTP 请求代理
4. `ALL_PROXY` - 所有请求代理（支持 SOCKS）

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

**Shadowsocks (需要 SOCKS5)**
```bash
export ALL_PROXY="socks5://127.0.0.1:7891"
```

## 📖 完整示例

### TypeScript 项目

```typescript
import { Client } from "carbon-proxy"
import { Command } from "carbon-proxy"

// 创建命令
class PingCommand extends Command {
  name = "ping"
  type = 1 // ChatInput

  async run() {
    return "Pong! 🏓"
  }
}

// 创建客户端
const client = new Client(
  {
    clientId: process.env.CLIENT_ID!,
    publicKey: process.env.PUBLIC_KEY!,
    token: process.env.TOKEN!,
    baseUrl: "http://localhost:3000",
    // 代理配置（可选）
    requestOptions: {
      proxy: process.env.DISCORD_HTTP_PROXY
    }
  },
  {
    commands: [new PingCommand()]
  }
)

// 启动服务器
client.startServer()
```

### 使用 .env 文件

创建 `.env` 文件：

```env
# Discord 配置
CLIENT_ID=your_client_id
PUBLIC_KEY=your_public_key
TOKEN=your_bot_token
BASE_URL=http://localhost:3000

# 代理配置（可选）
DISCORD_HTTP_PROXY=http://127.0.0.1:7891
```

代码中读取：

```typescript
import dotenv from "dotenv"
dotenv.config()

const client = new Client({
  clientId: process.env.CLIENT_ID!,
  publicKey: process.env.PUBLIC_KEY!,
  token: process.env.TOKEN!,
  baseUrl: process.env.BASE_URL!
})
```

## 🧪 测试代理连接

项目包含测试脚本，可以验证代理配置：

```bash
cd node_modules/carbon-proxy

# 测试 HTTP 代理
DISCORD_BOT_TOKEN="your_token" HTTPS_PROXY="http://127.0.0.1:7891" node test-proxy.mjs

# 测试 SOCKS5 代理
DISCORD_BOT_TOKEN="your_token" ALL_PROXY="socks5://127.0.0.1:7892" node test-proxy.mjs

# 完整验证（包含 WebSocket）
DISCORD_BOT_TOKEN="your_token" HTTPS_PROXY="http://127.0.0.1:7891" node verify-proxy.mjs
```

## 🔍 故障排除

### 代理连接失败

**1. 确认代理服务正在运行**
```bash
# 测试 HTTP 代理
curl -x http://127.0.0.1:7891 https://www.google.com

# 测试 SOCKS5 代理
curl --socks5 127.0.0.1:7892 https://www.google.com
```

**2. 检查代理格式**
- 确保使用正确的协议前缀：`http://`, `socks5://`
- 确保端口号正确
- 检查是否需要认证

**3. 验证代理可用性**
```typescript
import { RequestClient } from "carbon-proxy"

const rest = new RequestClient("Bot test", {
  proxy: "http://127.0.0.1:7891",
  baseUrl: "https://httpbin.org"
})

const result = await rest.get("/ip")
console.log("代理 IP:", result.origin)
```

### 请求超时

- 检查代理服务器的网络连接
- 尝试切换代理协议（HTTP → SOCKS5）
- 检查代理服务器日志

### WebSocket 连接失败

```typescript
// 确保代理也用于 WebSocket
const client = new Client({
  // ...
  requestOptions: {
    proxy: "http://127.0.0.1:7891"
  }
})

// Gateway 会自动使用相同的代理配置
```

## 📊 使用场景

### 1. 企业网络环境

```typescript
// 企业网络通常需要通过代理访问外部 API
const client = new Client({
  clientId: "xxx",
  publicKey: "xxx",
  token: "xxx",
  baseUrl: "http://localhost:3000",
  requestOptions: {
    proxy: process.env.COMPANY_PROXY // 从环境变量读取
  }
})
```

### 2. 开发调试

```typescript
// 使用代理工具（如 Charles, Fiddler）调试请求
const client = new Client({
  // ...
  requestOptions: {
    proxy: "http://localhost:8888" // Charles 默认端口
  }
})
```

### 3. 地域限制

```typescript
// 通过特定地区的代理访问 Discord API
const client = new Client({
  // ...
  requestOptions: {
    proxy: "http://us-proxy.example.com:8080"
  }
})
```

## ⚠️ 注意事项

1. **性能考虑**
   - 代理会增加请求延迟
   - 生产环境建议使用本地或高速代理

2. **安全性**
   - 不要在代码中硬编码代理凭据
   - 使用环境变量管理敏感信息
   - `.env` 文件应该加入 `.gitignore`

3. **错误处理**
   ```typescript
   try {
     await client.rest.get("/users/@me")
   } catch (error) {
     if (error.cause?.code === "UND_ERR_CONNECT_TIMEOUT") {
       console.error("代理连接超时，请检查代理配置")
     } else if (error.cause?.code === "ECONNREFUSED") {
       console.error("代理服务器拒绝连接")
     }
   }
   ```

4. **WebSocket 支持**
   - HTTP 代理自动用于 WebSocket 连接
   - SOCKS5 代理完全支持

## 📚 相关资源

- **npm**: https://www.npmjs.com/package/carbon-proxy
- **GitHub**: https://github.com/stonev5/carbon
- **原版文档**: https://carbon.buape.com/carbon
- **Discord API**: https://discord.com/developers/docs/intro

## 🆘 获取帮助

遇到问题？

1. 查看上面的故障排除部分
2. 运行测试脚本验证配置
3. 提交 Issue: https://github.com/stonev5/carbon/issues

## 📄 许可证

MIT License - 基于 [@buape/carbon](https://github.com/buape/carbon) 修改

---

**注意**: 本版本是 fork 的增强版，主要用于需要代理的场景。如果你不需要代理功能，建议使用[原版](https://www.npmjs.com/package/@buape/carbon)。
