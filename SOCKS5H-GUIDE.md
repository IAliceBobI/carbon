# SOCKS5 代理使用指南（DNS 污染环境）

## 问题背景

在某些网络环境下（如中国大陆），Discord 域名可能受到 DNS 污染，导致：
1. **本地 DNS 解析返回错误 IP** - WebSocket 连接失败
2. **REST API 调用失败** - `fetch` 请求无法通过代理

## 解决方案

Carbon 0.14.3+ 提供了完整的代理支持，包括：

1. **SOCKS5 代理（WebSocket Gateway）** - 使用 `socks5h://` 进行远程 DNS 解析
2. **HTTP 代理（REST API）** - 自动 fallback 到 HTTP_PROXY
3. **混合代理模式** - 同时使用 SOCKS + HTTP 代理

### 协议对比

| 协议 | DNS 解析方式 | 适用场景 |
|------|-------------|----------|
| `socks5://` | 本地 DNS 解析 | DNS 无污染的网络环境 |
| `socks5h://` | 通过代理远程 DNS 解析 | **DNS 受污染的网络环境（推荐）** |
| `socks4://` | 本地 DNS 解析 | 仅支持 IPv4 |
| `socks4a://` | 通过代理远程 DNS 解析 | SOCKS4 协议的远程 DNS |

## 快速开始（DNS 污染环境）

### 推荐配置

在 DNS 污染环境下，需要**同时配置 SOCKS 和 HTTP 代理**：

```bash
# WebSocket Gateway 连接（使用 socks5h 远程 DNS 解析）
DISCORD_HTTP_PROXY=socks5h://127.0.0.1:7892

# REST API 调用（自动 fallback 到 HTTP 代理）
HTTP_PROXY=http://127.0.0.1:7891
HTTPS_PROXY=http://127.0.0.1:7891

# 可选：如果 fetch 失败，提供 fallback
DISCORD_CLIENT_ID=your_bot_client_id
```

### 工作原理

```
┌─────────────────────────────────────────────────────────────┐
│                     Carbon Bot                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  WebSocket Gateway (wss://)                                │
│  ├─ 使用 DISCORD_HTTP_PROXY (socks5h://...)                │
│  └─ 通过 SOCKS5 代理进行远程 DNS 解析 ✅                    │
│                                                               │
│  REST API (https://)                                         │
│  ├─ 检测到 SOCKS 代理，自动 fallback 到 HTTP_PROXY          │
│  └─ 使用 HTTP 代理 (http://...) ✅                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 环境变量配置

### 2. 代码中使用

Carbon 会自动读取环境变量，无需修改代码：

```typescript
import { Client } from "@buape/carbon"

const client = new Client(
  {
    token: process.env.DISCORD_BOT_TOKEN!,
    clientId: process.env.DISCORD_CLIENT_ID!
  },
  {
    // 可选：也可以直接指定代理
    proxyUrl: "socks5h://127.0.0.1:7892"
  }
)

await client.login()
```

### 3. 完整示例

```typescript
import { Client } from "@buape/carbon"

// .env 文件内容：
// DISCORD_BOT_TOKEN=your_bot_token_here
// DISCORD_SOCKS_PROXY=socks5h://127.0.0.1:7892

const client = new Client(
  {
    token: process.env.DISCORD_BOT_TOKEN!,
    clientId: process.env.DISCORD_CLIENT_ID!,
    publicKey: process.env.DISCORD_PUBLIC_KEY!
  }
)

// Carbon 会自动应用环境变量中的代理配置
await client.login()

console.log("Bot 已通过 SOCKS5 代理连接！")
```

## 代理配置优先级

Carbon 按以下顺序查找代理配置：

### WebSocket Gateway
1. `proxyUrl` 选项（代码中直接指定）
2. `DISCORD_HTTP_PROXY` 环境变量
3. `HTTP_PROXY` / `HTTPS_PROXY` 环境变量
4. `ALL_PROXY` 环境变量

### REST API (fetch)
1. 如果检测到 SOCKS 代理 → **自动 fallback 到 HTTP_PROXY** ✨
2. 否则使用配置的 HTTP 代理
3. 使用 undici 的 ProxyAgent

## 常见代理配置

### 使用 tcplink 隧道

如果你的代理需要通过加密隧道（如 tcplink）：

```bash
# 本地 SOCKS5 端口
DISCORD_SOCKS_PROXY=socks5h://127.0.0.1:7892
```

### 使用 Clash/V2Ray

```bash
# Clash 默认 SOCKS5 端口
DISCORD_SOCKS_PROXY=socks5h://127.0.0.1:7890

# V2Ray 默认 SOCKS5 端口
DISCORD_SOCKS_PROXY=socks5h://127.0.0.1:1080
```

### 带认证的代理

```bash
# 格式：socks5h://username:password@host:port
DISCORD_SOCKS_PROXY=socks5h://user:pass@proxy.example.com:1080
```

## 环境变量文件示例

```bash
# .env

# Discord Bot 配置
DISCORD_BOT_TOKEN=MTQ2NzM2NTkwNTA3NDc1...
DISCORD_CLIENT_ID=123456789012345678
DISCORD_PUBLIC_KEY=abc123...

# SOCKS5 代理（Gateway WebSocket 连接）
# 注意：使用 socks5h:// 避免 DNS 污染
DISCORD_SOCKS_PROXY=socks5h://127.0.0.1:7892

# HTTP 代理（REST API 调用，可选）
# DISCORD_HTTP_PROXY=http://127.0.0.1:7891
```

## 故障排查

### 1. "Failed to get gateway information from Discord: fetch failed"

**症状**：REST API 调用失败

**原因**：SOCKS 代理不支持 fetch 的 dispatcher

**解决方法**：
```bash
# 确保 HTTP_PROXY 环境变量已设置
export HTTP_PROXY=http://127.0.0.1:7891
export HTTPS_PROXY=http://127.0.0.1:7891

# 或者设置 DISCORD_CLIENT_ID 作为 fallback
export DISCORD_CLIENT_ID=your_client_id
```

### 2. WebSocket 连接超时/Socket closed

**症状**：连接频繁断开（code 1006）

**检测方法**：
```bash
# 测试 SOCKS5 代理是否工作
curl --socks5 127.0.0.1:7892 https://www.google.com

# 测试远程 DNS 解析（DNS 污染环境必须使用）
curl --socks5-hostname 127.0.0.1:7892 https://gateway.discord.gg
```

**解决方法**：
- 使用 `socks5h://` 而不是 `socks5://`
- 检查代理是否稳定
- 确认代理端口正确

### 3. DNS 污染检测

**症状**：curl 可以访问 Google，但无法访问 Discord

**检测方法**：
```bash
# 本地 DNS 解析（可能被污染）
nslookup gateway.discord.gg

# 通过代理的 DNS 解析（应该返回正确 IP）
curl --socks5-hostname 127.0.0.1:7892 -v https://gateway.discord.gg
```

### 3. Sharding 模式代理配置

如果你使用 ShardingPlugin，也需要配置代理：

```typescript
import { ShardingPlugin } from "@buape/carbon"

const client = new Client(
  {
    token: process.env.DISCORD_BOT_TOKEN!,
    clientId: process.env.DISCORD_CLIENT_ID!
  },
  {
    plugins: [
      new ShardingPlugin({
        totalShards: 4,
        proxyUrl: "socks5h://127.0.0.1:7892"  // 为 REST API 调用配置代理
      })
    ]
  }
)
```

### 4. 验证代理是否生效

启动你的 bot 后，查看控制台输出：

```
[Carbon] Using SOCKS proxy: socks5h://127.0.0.1:7892
```

如果看到这条日志，说明代理配置已生效。

## 性能优化

### 超时设置

代理连接默认超时 30 秒。如果需要调整，可以在代码中：

```typescript
import { createProxyAgent } from "@buape/carbon"

// 自定义超时（不推荐，仅用于特殊情况）
// 注意：这需要在启动时手动配置
```

### 代理选择建议

- **WebSocket 连接（Gateway）**：使用 `socks5h://`
- **REST API 调用**：可以使用 `http://` 或 `socks5://`
- **DNS 受污染环境**：必须使用 `socks5h://`

## 版本要求

- `@buape/carbon` >= 0.14.3
- Node.js >= 20

## 相关链接

- [Carbon 文档](https://carbon.buape.me)
- [SOCKS 协议说明](https://en.wikipedia.org/wiki/SOCKS)
- [DNS 污染问题](https://en.wikipedia.org/wiki/DNS_pollution)

## 技术细节

### socks5h 工作原理

1. **socks5://** 流程：
   ```
   客户端 → 本地 DNS 解析 → 得到 IP → SOCKS5 连接 IP → 目标服务器
             ↓ 可能返回错误 IP（污染）
   ```

2. **socks5h://** 流程：
   ```
   客户端 → SOCKS5 发送域名 → 代理服务器 DNS 解析 → 得到正确 IP → 目标服务器
                                     ↓ 远程 DNS（未被污染）
   ```

### 底层实现

Carbon 使用 [socks-proxy-agent](https://www.npmjs.com/package/socks-proxy-agent) 库实现 SOCKS5 代理支持：

```typescript
// 内部实现（已集成到 Carbon，无需手动编写）
import { SocksProxyAgent } from "socks-proxy-agent"

const agent = new SocksProxyAgent("socks5h://127.0.0.1:7892", {
  timeout: 30000
})
```

## 更新日志

### 0.14.3
- ✨ **新增混合代理模式**：SOCKS 代理 + HTTP 代理自动切换
- ✨ REST API 自动 fallback 到 HTTP_PROXY（解决 SOCKS 不支持 fetch）
- ✨ 支持 DNS 污染环境的远程 DNS 解析
- 📝 完善 DNS 污染环境配置文档
- 🐛 修复 "Failed to get gateway information" 错误

### 0.14.2
- ✨ 新增 REST API 代理支持
- 🐛 修复 SOCKS 代理环境下 fetch 调用失败问题

### 0.14.1
- ✨ 新增基础代理支持
