#!/usr/bin/env node

/**
 * 测试 Discord Gateway 通过 SOCKS5 隧道
 * 隧道: client(scock:7892) ==加密==> agent(7893) -> Discord
 */

import { SocksProxyAgent } from "socks-proxy-agent"
import WebSocket from "ws"

const token = process.env.DISCORD_BOT_TOKEN
// 使用 socks5h 协议（h = hostname，通过代理进行远程 DNS 解析）
// 不使用环境变量，因为可能是旧的 socks5://
const proxy = "socks5h://127.0.0.1:7892"

console.log("=".repeat(60))
console.log("测试 Discord Gateway 通过 SOCKS5 隧道")
console.log("=".repeat(60))
console.log(`📡 SOCKS5 代理: ${proxy}`)
console.log(`🔑 Token: ${token?.substring(0, 20)}...`)

// Discord Gateway URL（通过 socks5h 进行远程 DNS 解析避免 DNS 污染）
const gatewayUrl = "wss://gateway.discord.gg/?v=10&encoding=json"

try {
	// 创建 SOCKS5 代理 agent
	const agent = new SocksProxyAgent(proxy, {
		timeout: 30000
	})
	console.log("✅ 已配置 SOCKS5 代理 agent")

	// 创建 WebSocket 连接
	const ws = new WebSocket(gatewayUrl, { agent })

	let messageCount = 0
	const startTime = Date.now()

	ws.on("open", () => {
		const connectTime = Date.now() - startTime
		console.log(`\n✅ WebSocket 连接成功！用时: ${connectTime}ms`)
		console.log(`📊 状态: ${ws.readyState}`)
		console.log("✅ SOCKS5 隧道工作正常！")

		// 发送 Identify payload
		const identifyPayload = {
			op: 2,
			d: {
				token,
				properties: {
					os: process.platform,
					browser: "carbon-socks5-test",
					device: "carbon-socks5-test"
				},
				intents: 1 // GUILDS intent
			}
		}

		console.log("📤 发送 Identify payload...")
		ws.send(JSON.stringify(identifyPayload))
	})

	ws.on("message", (data) => {
		messageCount++
		const payload = JSON.parse(data.toString())

		const opName = getOpName(payload.op)
		console.log(
			`📥 [#${messageCount}] op:${payload.op} (${opName}) ${payload.t ? `| t:${payload.t}` : ""}`
		)

		// op: 10 = Hello
		if (payload.op === 10) {
			console.log(`✅ 收到 Hello - 心跳间隔: ${payload.d.heartbeat_interval}ms`)

			// 发送心跳
			const heartbeatPayload = { op: 1, d: null }
			console.log("💓 发送心跳...")
			ws.send(JSON.stringify(heartbeatPayload))
		}

		// op: 11 = Heartbeat ACK
		if (payload.op === 11) {
			console.log("✅ 收到 Heartbeat ACK - 双向通信正常！")
		}

		// t: READY = 连接成功
		if (payload.t === "READY") {
			console.log("\n🎉 连接就绪！")
			console.log(
				`👤 用户: ${payload.d.user?.username}#${payload.d.user?.discriminator}`
			)
			console.log(`🏠 服务器数量: ${payload.d.guilds?.length}`)
			console.log(
				"\n✅ SOCKS5 隧道测试成功！可以正常接收 Discord Gateway 推送！"
			)

			// 等待一下然后关闭连接
			setTimeout(() => {
				console.log("\n✅ 测试完成，关闭连接...")
				ws.close()
			}, 2000)
		}
	})

	ws.on("error", (error) => {
		console.error("\n❌ WebSocket 错误:", error.message)
		process.exit(1)
	})

	ws.on("close", (code, reason) => {
		console.log(
			`\n🔌 连接关闭 - 代码: ${code}, 原因: ${reason?.toString() || "无"}`
		)

		if (code === 1000) {
			console.log("\n✅ 测试成功 - SOCKS5 隧道可以正常工作！")
			process.exit(0)
		} else {
			console.log(`\n⚠️ 关闭代码: ${code}`)
			process.exit(1)
		}
	})

	// 超时处理
	setTimeout(() => {
		if (ws.readyState !== WebSocket.OPEN) {
			console.error("\n❌ 连接超时（15秒）")
			console.error("可能原因：")
			console.error("  1. tcplink 隧道未启动")
			console.error("  2. SOCKS5 代理端口不正确")
			console.error("  3. 网络连接问题")
			ws.close()
			process.exit(1)
		}
	}, 15000)
} catch (err) {
	console.error("\n❌ 错误:", err.message)
	process.exit(1)
}

function getOpName(op) {
	const opNames = {
		0: "Dispatch",
		1: "Heartbeat",
		2: "Identify",
		3: "Presence Update",
		4: "Voice State Update",
		6: "Resume",
		7: "Reconnect",
		8: "Request Guild Members",
		9: "Invalid Session",
		10: "Hello",
		11: "Heartbeat ACK"
	}
	return opNames[op] || "Unknown"
}
