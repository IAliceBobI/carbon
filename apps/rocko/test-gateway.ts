import { HttpsProxyAgent } from "https-proxy-agent"
import WebSocket from "ws"
import "dotenv/config"

const token = process.env.DISCORD_BOT_TOKEN
const proxy = process.env.DISCORD_HTTP_PROXY

console.log("🔍 测试 WebSocket 代理连接到 Discord Gateway...")
console.log(`📡 代理地址: ${proxy}`)
console.log(`🔑 Token: ${token?.substring(0, 20)}...`)

// Discord Gateway URL
const gatewayUrl = "wss://gateway.discord.gg/?v=10&encoding=json"

// 连接选项
const options: { agent?: unknown } = {}

// 如果有代理，添加代理 agent
if (proxy) {
	try {
		const agent = new HttpsProxyAgent(proxy)
		options.agent = agent
		console.log("✅ 已配置 HTTP 代理 agent")
	} catch (error) {
		console.error("❌ 代理配置失败:", error)
		process.exit(1)
	}
}

const ws = new WebSocket(gatewayUrl, options)

let messageCount = 0
const startTime = Date.now()

ws.on("open", () => {
	const connectTime = Date.now() - startTime
	console.log(`✅ WebSocket 连接成功！用时: ${connectTime}ms`)
	console.log(`📊 状态: ${ws.readyState}`)

	// 发送 Identify payload
	const identifyPayload = {
		op: 2, // Identify
		d: {
			token,
			properties: {
				os: process.platform,
				browser: "carbon-proxy-test",
				device: "carbon-proxy-test"
			},
			intents: 1 // GUILDS intent
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
		d: payload.d ? typeof payload.d : "no data"
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
		console.log("✅ 收到 Heartbeat ACK - 代理连接工作正常！")
	}

	// t: READY = 连接成功
	if (payload.t === "READY") {
		console.log("🎉 连接就绪！")
		console.log(
			`👤 用户: ${payload.d.user?.username}#${payload.d.user?.discriminator}`
		)
		console.log(`🏠 服务器数量: ${payload.d.guilds?.length}`)

		// 等待一下然后关闭连接
		setTimeout(() => {
			console.log("✅ 测试完成，关闭连接...")
			ws.close()
		}, 2000)
	}
})

ws.on("error", (error: Error) => {
	console.error("❌ WebSocket 错误:", error.message)
})

ws.on("close", (code: number, reason: Buffer) => {
	console.log(`🔌 连接关闭`)
	console.log(`   代码: ${code}`)
	console.log(`   原因: ${reason?.toString() || "无"}`)

	if (code === 1000) {
		console.log("✅ 正常关闭")
	} else if (code === 4000) {
		console.log("✅ 代理测试成功！")
	} else {
		console.log(`⚠️ 关闭代码: ${code}`)
	}

	process.exit(code === 1000 || code === 4000 ? 0 : 1)
})

// 超时处理
setTimeout(() => {
	if (ws.readyState !== WebSocket.OPEN) {
		console.error("❌ 连接超时（10秒）")
		ws.close()
		process.exit(1)
	}
}, 10000)
