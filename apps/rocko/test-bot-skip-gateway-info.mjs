import "dotenv/config"
import { Client, MessageCreateListener, ReadyListener } from "carbon-proxy"
import { GatewayPlugin } from "carbon-proxy/gateway"

console.log("=".repeat(60))
console.log("Discord Bot - SOCKS5H 消息监听测试（简化版）")
console.log("=".repeat(60))
console.log(`\n📡 代理配置: ${process.env.DISCORD_SOCKS_PROXY || "未设置"}`)
console.log(`🔑 Bot ID: ${process.env.DISCORD_CLIENT_ID}`)

// 创建消息监听器
class MessageListener extends MessageCreateListener {
	async handle(data, client) {
		const message = data.message
		const author = message.author
		const content = data.content
		const channel = message.channelId

		// 忽略机器人自己的消息
		if (author?.id === client.options.clientId) {
			return
		}

		console.log(`\n${"─".repeat(60)}`)
		console.log("📨 收到新消息！")
		console.log("─".repeat(60))
		console.log(`👤 作者: ${author?.username}#${author?.discriminator}`)
		console.log(`💬 内容: ${content || "[无文本内容]"}`)
		console.log(`📍 频道: ${channel}`)
		console.log(`⏰ 时间: ${new Date().toLocaleString("zh-CN")}`)

		// 回复消息
		try {
			await message.reply(
				`✅ 收到你的消息："${content}"\n📡 通过 SOCKS5H 代理接收\n⏰ ${new Date().toLocaleString("zh-CN")}`
			)
			console.log("✅ 已回复消息")
		} catch (err) {
			console.log("⚠️ 回复失败:", err.message)
		}
		console.log("─".repeat(60))
	}
}

// 创建就绪监听器
class BotReady extends ReadyListener {
	async handle(data, _client) {
		console.log(`\n${"=".repeat(60)}`)
		console.log("✅ Bot 已就绪！")
		console.log("=".repeat(60))
		console.log(`\n🤖 Bot 信息:`)
		console.log(`   用户名: ${data.user?.username}#${data.user?.discriminator}`)
		console.log(`   ID: ${data.user?.id}`)
		console.log(`\n📡 SOCKS5H 代理连接正常！`)
		console.log(`✅ 正在监听消息...`)
		console.log(`\n${"=".repeat(60)}\n`)
	}
}

// 预先提供 Gateway 信息，跳过 HTTP 请求
const gatewayInfo = {
	url: "wss://gateway.discord.gg",
	shards: 1,
	sessionStartLimit: {
		total: 1000,
		remaining: 999,
		resetAfter: 14400000,
		maxConcurrency: 1
	}
}

// 创建 GatewayPlugin
const gateway = new GatewayPlugin(
	{
		proxyUrl: process.env.DISCORD_SOCKS_PROXY,
		intents: 1 | 512 | 4096 // GUILDS + GUILD_MESSAGES + MESSAGE_CONTENT
	},
	gatewayInfo
)

// 创建客户端
const _client = new Client(
	{
		token: process.env.DISCORD_BOT_TOKEN,
		clientId: process.env.DISCORD_CLIENT_ID,
		baseUrl: process.env.BASE_URL || "http://localhost:3000",
		publicKey: process.env.DISCORD_PUBLIC_KEY,
		deploySecret: process.env.DEPLOY_SECRET,
		// 配置 HTTP 代理用于 API 请求
		requestOptions: {
			proxyUrl: process.env.HTTP_PROXY || process.env.DISCORD_HTTP_PROXY
		}
	},
	{
		listeners: [new MessageListener(), new BotReady()]
	},
	[gateway]
)

// 启动 bot
console.log("\n✅ 正在启动 bot...")
gateway.connect().catch((error) => {
	console.error("❌ 启动失败:", error)
	process.exit(1)
})

// 优雅退出
process.on("SIGINT", () => {
	console.log("\n\n👋 正在关闭 bot...")
	gateway.disconnect()
	process.exit(0)
})
