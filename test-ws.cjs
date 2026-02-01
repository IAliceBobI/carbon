const WebSocket = require("ws")
const { HttpsProxyAgent } = require("https-proxy-agent")

const token = process.env.DISCORD_BOT_TOKEN
const proxy = process.env.DISCORD_HTTP_PROXY

console.log("🔍 测试 WebSocket 代理连接到 Discord Gateway...")
console.log("📡 代理:", proxy)
console.log("🔑 Token:", token?.substring(0, 20) + "...")

if (!token) {
	console.error("❌ DISCORD_BOT_TOKEN 环境变量未设置")
	process.exit(1)
}

const gatewayUrl = "wss://gateway.discord.gg/?v=10&encoding=json"
const options = {}

if (proxy) {
	const agent = new HttpsProxyAgent(proxy)
	options.agent = agent
	console.log("✅ 已配置 HTTP 代理 agent")
}

const ws = new WebSocket(gatewayUrl, options)
let msgCount = 0
const start = Date.now()

ws.on("open", () => {
	const time = Date.now() - start
	console.log("✅ WebSocket 连接成功！用时:", time, "ms")
	console.log("📊 状态:", ws.readyState)

	const payload = {
		op: 2,
		d: {
			token: token,
			properties: {
				os: process.platform,
				browser: "carbon-proxy-test",
				device: "carbon-proxy-test"
			},
			intents: 1
		}
	}

	console.log("📤 发送 Identify payload...")
	ws.send(JSON.stringify(payload))
})

ws.on("message", (data) => {
	msgCount++
	const payload = JSON.parse(data)
	console.log(
		"📥 消息 #" + msgCount,
		"- op:",
		payload.op,
		"t:",
		payload.t || "UNKNOWN"
	)

	if (payload.op === 10) {
		console.log("✅ 收到 Hello - 心跳间隔:", payload.d.heartbeat_interval, "ms")
		ws.send(JSON.stringify({ op: 1, d: null }))
		console.log("💓 发送心跳...")
	}

	if (payload.op === 11) {
		console.log("✅ 收到 Heartbeat ACK - WebSocket 代理连接工作正常！")
	}

	if (payload.t === "READY") {
		console.log("🎉 连接就绪！")
		console.log(
			"👤 用户:",
			payload.d.user?.username + "#" + payload.d.user?.discriminator
		)
		console.log("🏠 服务器数量:", payload.d.guilds?.length)
		setTimeout(() => {
			console.log("✅ 测试完成！关闭连接...")
			ws.close()
		}, 1000)
	}
})

ws.on("error", (err) => {
	console.error("❌ WebSocket 错误:", err.message)
	process.exit(1)
})

ws.on("close", (code, reason) => {
	console.log("🔌 连接关闭 - 代码:", code, "原因:", reason.toString() || "无")
	if (code === 1000) {
		console.log("✅ 正常关闭 - WebSocket 代理测试成功！")
	}
	process.exit(code === 1000 ? 0 : 1)
})

setTimeout(() => {
	if (ws.readyState !== 1) {
		console.error("❌ 连接超时（10秒）")
		ws.close()
		process.exit(1)
	}
}, 10000)
