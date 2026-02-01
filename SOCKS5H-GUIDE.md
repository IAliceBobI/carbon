# SOCKS5 代理使用指南（支持远程 DNS 解析）

## 问题背景

在某些网络环境下，Discord 域名可能受到 DNS 污染，导致本地 DNS 解析返回错误的 IP 地址。这种情况下，即使配置了 SOCKS5 代理，WebSocket 连接仍然会失败。

## 解决方案：socks5h 协议

Carbon 框架现在支持 `socks5h://` 协议（`h` = hostname），通过 SOCKS5 代理进行**远程 DNS 解析**，避免本地 DNS 污染。

### 协议对比

| 协议 | DNS 解析方式 | 适用场景 |
|------|-------------|----------|
| `socks5://` | 本地 DNS 解析 | DNS 无污染的网络环境 |
| `socks5h://` | 通过代理远程 DNS 解析 | **DNS 受污染的网络环境（推荐）** |
| `socks4://` | 本地 DNS 解析 | 仅支持 IPv4 |
| `socks4a://` | 通过代理远程 DNS 解析 | SOCKS4 协议的远程 DNS |

## 快速开始

### 1. 环境变量配置

在你的 `.env` 文件中添加：

```bash
# 使用 socks5h（推荐，避免 DNS 污染）
DISCORD_SOCKS_PROXY=socks5h://127.0.0.1:7892
```

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

1. `proxyUrl` 选项（代码中直接指定）
2. `DISCORD_SOCKS_PROXY` 环境变量（SOCKS 代理）
3. `DISCORD_HTTP_PROXY` 环境变量（HTTP 代理）
4. `HTTP_PROXY` / `HTTPS_PROXY` 环境变量
5. `ALL_PROXY` 环境变量

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

### 1. 连接超时

**症状**：WebSocket 连接超时

**可能原因**：
- SOCKS5 代理未启动
- 端口配置错误
- 防火墙阻止连接

**解决方法**：
```bash
# 测试 SOCKS5 代理是否工作
curl --socks5 127.0.0.1:7892 https://www.google.com

# 测试远程 DNS 解析
curl --socks5-hostname 127.0.0.1:7892 https://gateway.discord.gg
```

### 2. DNS 污染检测

**症状**：curl 可以访问 Google，但无法访问 Discord

**检测方法**：
```bash
# 本地 DNS 解析（可能被污染）
nslookup gateway.discord.gg

# 通过代理的 DNS 解析（应该返回正确 IP）
curl --socks5-hostname 127.0.0.1:7892 -v https://gateway.discord.gg
```

**解决方法**：使用 `socks5h://` 而不是 `socks5://`

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
- ✨ 新增 socks5h/socks4a 协议支持
- ✨ 新增 ShardingPlugin 代理支持
- ✨ 新增 30 秒代理超时配置
- 📝 完善代理配置文档
