const WebSocket = require("ws")
const { HttpsProxyAgent } = require("https-proxy-agent")
require("dotenv").config()

const token = process.env.DISCORD_BOT_TOKEN
const proxy = process.env.DISCORD_HTTP_PROXY

console.log("🔍 测试 WebSocket 代理连接...")
console.log("📡 代理:", proxy)
console.log("🔑 Token:", token?.substring(0, 20) + "...")

const gatewayUrl = "wss://gateway.discord.gg/?v=10&encoding=json"
const options = {}

if (proxy) {
	const agent = new HttpsProxyAgent(proxy)
	options.agent = agent
	console.log("✅ 已配置代理 agent")
}

const ws = new WebSocket(gatewayUrl, options)
let msgCount = 0
const start = Date.now()

ws.on("open", () => {
	const time = Date.now() - start
	console.log("✅ 连接成功！用时:", time + "ms")

	const payload = {
		op: 2,
		d: {
			token: token,
			properties: {
				os: process.platform,
				browser: "carbon-test",
				device: "carbon-test"
			},
			intents: 1
		}
	}

	console.log("📤 发送 Identify...")
	ws.send(JSON.stringify(payload))
})

ws.on("message", (data) => {
	msgCount++
	const payload = JSON.parse(data)
	console.log("📥 消息 #" + msgCount, {
		op: payload.op,
		t: payload.t || "UNKNOWN"
	})

	if (payload.op === 10) {
		console.log("✅ Hello - 心跳:", payload.d.heartbeat_interval + "ms")
		ws.send(JSON.stringify({ op: 1, d: null }))
	}

	if (payload.op === 11) {
		console.log("✅ Heartbeat ACK - 代理工作正常！")
	}

	if (payload.t === "READY") {
		console.log("🎉 READY!")
		console.log(
			"👤 用户:",
			payload.d.user?.username + "#" + payload.d.user?.discriminator
		)
		console.log("🏠 服务器:", payload.d.guilds?.length)
		setTimeout(() => {
			console.log("✅ 测试完成！")
			ws.close()
		}, 1000)
	}
})

ws.on("error", (err) => {
	console.error("❌ 错误:", err.message)
})

ws.on("close", (code, reason) => {
	console.log("🔌 关闭 - 代码:", code, "原因:", reason.toString() || "无")
	process.exit(code === 1000 ? 0 : 1)
})

setTimeout(() => {
	if (ws.readyState !== 1) {
		console.error("❌ 连接超时")
		ws.close()
		process.exit(1)
	}
}, 10000)
