import { SocksProxyAgent } from "socks-proxy-agent"
import WebSocket from "ws"
import "dotenv/config"

const token = process.env.DISCORD_BOT_TOKEN
// 默认使用 socks5h，可以通过环境变量覆盖
const proxy = process.env.DISCORD_SOCKS_PROXY || "socks5h://127.0.0.1:7890"

console.log("=".repeat(60))
console.log("测试 Discord Gateway 通过 SOCKS5H 隧道（远程 DNS 解析）")
console.log("=".repeat(60))
console.log(`📡 SOCKS5H 代理: ${proxy}`)
console.log(`🔑 Token: ${token?.substring(0, 20)}...`)
console.log(`\n📌 SOCKS5H 特点：通过代理服务器进行 DNS 解析`)
console.log(`   可以避免 DNS 污染问题\n`)

// Discord Gateway URL
const gatewayUrl = "wss://gateway.discord.gg/?v=10&encoding=json"

// 连接选项
const options: { agent?: unknown } = {}

// 配置 SOCKS5H 代理 agent
try {
	const agent = new SocksProxyAgent(proxy, {
		timeout: 30000 // 30 秒超时
	})
	options.agent = agent
	console.log("✅ 已配置 SOCKS5H 代理 agent")
} catch (error) {
	console.error("❌ SOCKS5H 代理配置失败:", error)
	process.exit(1)
}

const ws = new WebSocket(gatewayUrl, options)

let messageCount = 0
const startTime = Date.now()

ws.on("open", () => {
	const connectTime = Date.now() - startTime
	console.log(`\n✅ WebSocket 连接成功！用时: ${connectTime}ms`)
	console.log(`📊 状态: ${ws.readyState}`)
	console.log("✅ SOCKS5H 隧道工作正常！")
	console.log("✅ DNS 解析通过代理服务器完成\n")

	// 发送 Identify payload
	const identifyPayload = {
		op: 2, // Identify
		d: {
			token,
			properties: {
				os: process.platform,
				browser: "carbon-socks5h-test",
				device: "carbon-socks5h-test"
			},
			intents: 1 | 512 // GUILDS + GUILD_MESSAGES intent
		}
	}

	console.log("📤 发送 Identify payload...")
	ws.send(JSON.stringify(identifyPayload))
})

ws.on("message", (data: WebSocket.Data) => {
	messageCount++
	const payload = JSON.parse(data.toString())

	console.log(`📥 收到消息 #${messageCount}:`, {
		op: payload.op,
		t: payload.t || "UNKNOWN",
		type: getOpName(payload.op)
	})

	// op: 10 = Hello
	if (payload.op === 10) {
		console.log(`✅ 收到 Hello - 心跳间隔: ${payload.d.heartbeat_interval}ms`)

		// 发送心跳
		const heartbeatPayload = {
			op: 1, // Heartbeat
			d: null
		}
		console.log("💓 发送心跳...")
		ws.send(JSON.stringify(heartbeatPayload))
	}

	// op: 11 = Heartbeat ACK
	if (payload.op === 11) {
		console.log("✅ 收到 Heartbeat ACK")
		console.log("✅ 双向通信正常！")
	}

	// t: READY = 连接成功
	if (payload.t === "READY") {
		console.log("\n🎉 连接就绪！")
		console.log(
			`👤 用户: ${payload.d.user?.username}#${payload.d.user?.discriminator}`
		)
		console.log(`🏠 服务器数量: ${payload.d.guilds?.length}`)
		console.log("\n✅ SOCKS5H 隧道测试成功！")
		console.log("✅ 可以正常接收 Discord Gateway 推送！")
		console.log("✅ 远程 DNS 解析工作正常！")

		// 持续运行一段时间以接收更多消息
		setTimeout(() => {
			console.log(`\n✅ 测试完成！共接收 ${messageCount} 条消息`)
			console.log("✅ SOCKS5H + WebSocket 工作正常！")
			ws.close()
		}, 10000) // 运行 10 秒接收更多事件
	}

	// 显示其他事件类型
	if (payload.t && payload.t !== "READY" && payload.t !== "GUILD_CREATE") {
		console.log(`   📨 事件: ${payload.t}`)
	}
})

ws.on("error", (error: Error) => {
	console.error("\n❌ WebSocket 错误:", error.message)
	process.exit(1)
})

ws.on("close", (code: number, reason: Buffer) => {
	console.log(`\n🔌 连接关闭`)
	console.log(`   代码: ${code}`)
	console.log(`   原因: ${reason?.toString() || "无"}`)

	if (code === 1000 || code === 4000) {
		console.log("\n✅ 测试成功 - SOCKS5H 隧道可以正常工作！")
		process.exit(0)
	} else {
		console.log(`\n⚠️ 关闭代码: ${code}`)
		process.exit(1)
	}
})

// 超时处理
setTimeout(() => {
	if (ws.readyState !== WebSocket.OPEN) {
		console.error("\n❌ 连接超时（30秒）")
		console.error("可能原因：")
		console.error("  1. SOCKS5H 代理服务器未启动")
		console.error("  2. 代理端口不正确（默认: socks5h://127.0.0.1:7890）")
		console.error("  3. 网络连接问题")
		console.error("  4. 代理服务器不支持 SOCKS5H")
		console.error("\n💡 提示：")
		console.error(
			"  - 设置环境变量: DISCORD_SOCKS_PROXY=socks5h://your-proxy:port"
		)
		console.error("  - 或使用默认: socks5h://127.0.0.1:7890")
		ws.close()
		process.exit(1)
	}
}, 30000)

function getOpName(op: number): string {
	const opNames: Record<number, string> = {
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
