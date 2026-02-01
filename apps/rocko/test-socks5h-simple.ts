import { SocksProxyAgent } from "socks-proxy-agent"
import WebSocket from "ws"

// 默认使用 socks5h，可以通过环境变量覆盖
const proxy = process.env.DISCORD_SOCKS_PROXY || "socks5h://127.0.0.1:7890"

console.log("=".repeat(60))
console.log("SOCKS5H 代理连接测试（简化版）")
console.log("=".repeat(60))
console.log(`📡 SOCKS5H 代理: ${proxy}`)
console.log(`\n📌 测试目标：验证 SOCKS5H 隧道能否正常工作`)
console.log(`   测试方法：连接到 Discord Gateway 并接收 Hello 消息`)
console.log(`   （不需要发送 Identify，因此不需要有效的 token）\n`)

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
let helloReceived = false

ws.on("open", () => {
	const connectTime = Date.now() - startTime
	console.log(`\n✅ WebSocket 连接成功！用时: ${connectTime}ms`)
	console.log(`📊 状态: ${ws.readyState}`)
	console.log("✅ SOCKS5H 隧道工作正常！")
	console.log("✅ 远程 DNS 解析成功！")
	console.log("✅ Discord Gateway 已连接")
	console.log("\n⏳ 等待接收 Hello 消息（OP 10）...")
})

ws.on("message", (data: WebSocket.Data) => {
	messageCount++
	const payload = JSON.parse(data.toString())

	console.log(`📥 收到消息 #${messageCount}:`, {
		op: payload.op,
		t: payload.t || "UNKNOWN",
		type: getOpName(payload.op)
	})

	// op: 10 = Hello（这是我们要验证的关键消息）
	if (payload.op === 10) {
		helloReceived = true
		console.log(`\n✅ 收到 Hello 消息！`)
		console.log(`   心跳间隔: ${payload.d.heartbeat_interval}ms`)
		console.log("\n🎉 测试成功！")
		console.log("✅ SOCKS5H 代理隧道完全正常工作！")
		console.log("✅ 可以通过 SOCKS5H 接收 Discord Gateway 数据！")
		console.log("✅ 远程 DNS 解析成功！")

		// 关闭连接
		setTimeout(() => {
			console.log(`\n✅ 测试完成！共接收 ${messageCount} 条消息`)
			console.log("✅ SOCKS5H + WebSocket 连接验证成功！\n")
			ws.close()
		}, 1000)
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

	if (helloReceived) {
		console.log("\n✅ 测试成功 - SOCKS5H 隧道工作正常！")
		process.exit(0)
	} else {
		console.log("\n❌ 测试失败 - 未收到 Hello 消息")
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
		console.error("  - 检查代理服务器是否运行")
		console.error(
			"  - 设置环境变量: DISCORD_SOCKS_PROXY=socks5h://your-proxy:port"
		)
		console.error(
			"  - 测试代理: curl -x socks5h://127.0.0.1:7890 https://discord.com"
		)
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
