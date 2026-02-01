# SOCKS5H WebSocket 测试指南

本文档说明如何测试 Discord Gateway WebSocket 连接通过 SOCKS5H 代理。

## 前置要求

1. **SOCKS5H 代理服务器**
   - 确保你的 SOCKS5H 代理服务器正在运行
   - 默认地址：`socks5h://127.0.0.1:7890`
   - 可以通过环境变量 `DISCORD_SOCKS_PROXY` 自定义

2. **Discord Bot Token**
   - 从 [Discord Developer Portal](https://discord.com/developers/applications) 获取
   - 需要设置到 `.env` 文件中

## 配置说明

编辑 `/opt/projects/carbon/apps/rocko/.env` 文件：

```bash
# Discord Bot Token（必需）
DISCORD_BOT_TOKEN=your_bot_token_here

# SOCKS5H 代理（可选，默认使用 socks5h://127.0.0.1:7890）
DISCORD_SOCKS_PROXY=socks5h://127.0.0.1:7890
```

## SOCKS5H vs SOCKS5

- **SOCKS5 (`socks5://`)**: 本地 DNS 解析
  - 客户端本地解析域名后通过代理连接
  - 可能受到 DNS 污染影响

- **SOCKS5H (`socks5h://`)**: 远程 DNS 解析（推荐）
  - 通过代理服务器进行 DNS 解析
  - 避免 DNS 污染问题
  - 适合网络受限环境

## 运行测试

### 方法 1：直接运行 TypeScript 文件（推荐）

```bash
cd /opt/projects/carbon/apps/rocko
npx tsx test-gateway-socks5h.ts
```

### 方法 2：编译后运行

```bash
cd /opt/projects/carbon/apps/rocko
pnpm build
node dist/test-gateway-socks5h.js
```

## 预期输出

测试成功时，你应该看到类似以下输出：

```
============================================================
测试 Discord Gateway 通过 SOCKS5H 隧道（远程 DNS 解析）
============================================================
📡 SOCKS5H 代理: socks5h://127.0.0.1:7890
🔑 Token: MTIzNDU2Nzg5MDEyMzQ1Njc4O...

📌 SOCKS5H 特点：通过代理服务器进行 DNS 解析
   可以避免 DNS 污染问题

✅ 已配置 SOCKS5H 代理 agent

✅ WebSocket 连接成功！用时: 1234ms
📊 状态: 1
✅ SOCKS5H 隧道工作正常！
✅ DNS 解析通过代理服务器完成

📤 发送 Identify payload...
📥 收到消息 #1: { op: 10, t: 'UNKNOWN', type: 'Hello' }
✅ 收到 Hello - 心跳间隔: 41250ms
💓 发送心跳...
📥 收到消息 #2: { op: 11, t: 'UNKNOWN', type: 'Heartbeat ACK' }
✅ 收到 Heartbeat ACK
✅ 双向通信正常！
📥 收到消息 #3: { op: 0, t: 'READY', type: 'Dispatch' }

🎉 连接就绪！
👤 用户: YourBot#1234
🏠 服务器数量: 5

✅ SOCKS5H 隧道测试成功！
✅ 可以正常接收 Discord Gateway 推送！
✅ 远程 DNS 解析工作正常！

✅ 测试完成！共接收 25 条消息
✅ SOCKS5H + WebSocket 工作正常！
```

## 故障排除

### 连接超时（30秒）

```
❌ 连接超时（30秒）
可能原因：
  1. SOCKS5H 代理服务器未启动
  2. 代理端口不正确（默认: socks5h://127.0.0.1:7890）
  3. 网络连接问题
  4. 代理服务器不支持 SOCKS5H
```

**解决方案：**
1. 确认代理服务器正在运行
2. 检查代理端口是否正确
3. 测试代理连接：`curl -x socks5h://127.0.0.1:7890 https://discord.com`

### Token 无效

```
❌ WebSocket 错误: Invalid token
```

**解决方案：**
1. 确认 `.env` 文件中的 `DISCORD_BOT_TOKEN` 正确
2. 从 Discord Developer Portal 重新生成 token

### 代理认证失败

```
❌ SOCKS5H 代理配置失败: SOCKS authentication failed
```

**解决方案：**
1. 确认代理服务器允许无认证连接
2. 如果需要认证，使用格式：`socks5h://username:password@host:port`

## 测试文件说明

- `test-gateway-socks5.ts` - SOCKS5 代理测试（本地 DNS）
- `test-gateway-socks5h.ts` - SOCKS5H 代理测试（远程 DNS，推荐）

## 技术细节

### WebSocket 连接流程

1. **创建代理 Agent**
   ```typescript
   const agent = new SocksProxyAgent('socks5h://127.0.0.1:7890', {
     timeout: 30000
   })
   ```

2. **建立 WebSocket 连接**
   ```typescript
   const ws = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json', {
     agent: agent
   })
   ```

3. **发送 Identify**
   ```typescript
   ws.send(JSON.stringify({
     op: 2, // Identify
     d: {
       token: process.env.DISCORD_BOT_TOKEN,
       properties: { ... },
       intents: 1 | 512 // GUILDS + GUILD_MESSAGES
     }
   }))
   ```

4. **接收消息**
   - OP 10: Hello（心跳间隔）
   - OP 11: Heartbeat ACK
   - OP 0: Dispatch（事件）

### 支持的事件

- READY（连接成功）
- GUILD_CREATE（服务器信息）
- MESSAGE_CREATE（消息，需要 intent）
- 其他 Gateway 事件

## 相关文档

- [Carbon SOCKS5H 使用指南](/opt/projects/carbon/SOCKS5H-GUIDE.md)
- [Discord Gateway 文档](https://discord.com/developers/docs/topics/gateway)
- [SOCKS Proxy Agent](https://github.com/TooTallNate/proxy-agents#socks-proxy-agent)
