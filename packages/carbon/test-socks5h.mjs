#!/usr/bin/env node

/**
 * 测试 socks5h 协议（远程 DNS 解析）
 */

import { SocksProxyAgent } from "socks-proxy-agent"
import WebSocket from "ws"

const proxy = "socks5h://127.0.0.1:7892" // h = hostname, 通过代理解析 DNS
const gatewayUrl = "wss://gateway.discord.gg/?v=10&encoding=json"

console.log("=".repeat(60))
console.log("测试 socks5h:// 协议（远程 DNS 解析）")
console.log("=".repeat(60))
console.log("代理:", proxy)
console.log("目标:", gatewayUrl)

const agent = new SocksProxyAgent(proxy, { timeout: 30000 })
const ws = new WebSocket(gatewayUrl, { agent })

const startTime = Date.now()

ws.on("open", () => {
	console.log(`\n✅ 连接成功！耗时: ${Date.now() - startTime}ms`)
	console.log("✅ socks5h 远程 DNS 解析工作正常！")
	ws.close()
})

ws.on("error", (err) => {
	console.error("\n❌ 错误:", err.message)
	process.exit(1)
})

ws.on("close", (code, reason) => {
	console.log(`\n关闭 - code: ${code}`)
	if (code === 1000) {
		console.log("\n✅ 测试成功！")
		process.exit(0)
	}
})

setTimeout(() => {
	if (ws.readyState !== WebSocket.OPEN) {
		console.log("\n❌ 连接超时（10秒）")
		ws.close()
		process.exit(1)
	}
}, 10000)
