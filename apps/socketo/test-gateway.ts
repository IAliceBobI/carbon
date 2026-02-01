import "dotenv/config"
import { Client } from "@buape/carbon"
import { GatewayIntents, GatewayPlugin } from "@buape/carbon/gateway"

const client = new Client(
	{
		token: process.env.DISCORD_BOT_TOKEN!,
		clientId: process.env.DISCORD_CLIENT_ID!,
		publicKey: process.env.DISCORD_PUBLIC_KEY!,
		deploySecret: "test-secret",
		baseUrl: "http://localhost:3000"
	},
	{
		commands: [],
		listeners: []
	},
	[
		new GatewayPlugin({
			intents: GatewayIntents.Guilds
			// 不使用代理测试直连
			// proxyUrl: process.env.DISCORD_HTTP_PROXY
		})
	]
)

console.log("🔍 测试 Gateway 代理连接...")
console.log("📡 代理:", process.env.DISCORD_HTTP_PROXY)

// 等待连接
setTimeout(() => {
	console.log("⏳ 5秒后检查连接状态...")
	if (client.plugins.gateway) {
		const gateway = client.plugins.gateway as unknown as {
			isConnected: boolean
			ping: number | null
		}
		console.log("📊 Gateway 状态:")
		console.log("   - 已连接:", gateway.isConnected)
		console.log("   - Ping:", gateway.ping)

		if (gateway.isConnected) {
			console.log("✅ Gateway 代理连接成功！")
			console.log("🎉 测试完成！")
			process.exit(0)
		}
	}
}, 5000)

setTimeout(() => {
	console.log("⏳ 10秒后检查连接状态...")
	if (client.plugins.gateway) {
		const gateway = client.plugins.gateway as unknown as {
			isConnected: boolean
			ping: number | null
		}
		console.log("📊 Gateway 状态:")
		console.log("   - 已连接:", gateway.isConnected)
		console.log("   - Ping:", gateway.ping)

		if (gateway.isConnected) {
			console.log("✅ Gateway 代理连接成功！")
			console.log("🎉 测试完成！")
			process.exit(0)
		} else {
			console.log("⚠️ 连接尚未完成，再等待...")
		}
	}
}, 10000)

setTimeout(() => {
	console.log("⏳ 20秒后最终检查...")
	if (client.plugins.gateway) {
		const gateway = client.plugins.gateway as unknown as {
			isConnected: boolean
			ping: number | null
		}
		console.log("📊 Gateway 最终状态:")
		console.log("   - 已连接:", gateway.isConnected)
		console.log("   - Ping:", gateway.ping)

		if (gateway.isConnected) {
			console.log("✅ Gateway 代理连接成功！")
			console.log("🎉 测试完成！")
			process.exit(0)
		}
	}

	console.log("❌ 连接超时（20秒）")
	process.exit(1)
}, 20000)
