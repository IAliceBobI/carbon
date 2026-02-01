import "dotenv/config"
import {
	Client,
	type ListenerEventData,
	MessageCreateListener,
	ReadyListener
} from "carbon-proxy"
import { GatewayPlugin } from "carbon-proxy/gateway"

console.log("=".repeat(60))
console.log("Discord Bot - SOCKS5H 消息监听测试")
console.log("=".repeat(60))
console.log(`\n📡 代理配置: ${process.env.DISCORD_SOCKS_PROXY || "未设置"}`)
console.log(`🔑 Bot ID: ${process.env.DISCORD_CLIENT_ID}`)
console.log(`📝 目标频道: ${process.env.DISCORD_CHANNEL_ID || "未设置"}`)
console.log(`\n⏳ 正在连接到 Discord Gateway...\n`)

// 创建消息监听器
class MessageListener extends MessageCreateListener {
	async handle(data: ListenerEventData[this["type"]], client: Client) {
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

		// 如果是指定频道，显示提示并回复
		if (channel === process.env.DISCORD_CHANNEL_ID) {
			console.log(`\n✅ 这是目标频道！消息已收到！`)

			// 回复消息确认
			await message.reply(
				`✅ 收到你的消息："${content}"\n📡 通过 SOCKS5H 代理接收\n⏰ ${new Date().toLocaleString("zh-CN")}`
			)
		}
		console.log("─".repeat(60))
	}
}

// 创建就绪监听器
class BotReady extends ReadyListener {
	async handle(data: ListenerEventData[this["type"]], _client: Client) {
		console.log(`\n${"=".repeat(60)}`)
		console.log("✅ Bot 已就绪！")
		console.log("=".repeat(60))
		console.log(`\n🤖 Bot 信息:`)
		console.log(`   用户名: ${data.user?.username}#${data.user?.discriminator}`)
		console.log(`   ID: ${data.user?.id}`)
		console.log(`\n📡 代理: ${process.env.DISCORD_SOCKS_PROXY}`)
		console.log(`✅ SOCKS5H 代理连接正常！`)
		console.log(`✅ 正在监听消息...`)

		if (process.env.DISCORD_CHANNEL_ID) {
			console.log(`\n📝 目标频道: <#${process.env.DISCORD_CHANNEL_ID}>`)
			console.log(`   请在该频道发送消息进行测试...`)
		} else {
			console.log(`\n⚠️ 未设置 DISCORD_CHANNEL_ID`)
			console.log(`   将监听所有频道的消息...`)
		}
		console.log(`\n${"=".repeat(60)}\n`)
	}
}

// 创建 GatewayPlugin
const gateway = new GatewayPlugin({
	proxyUrl: process.env.DISCORD_SOCKS_PROXY, // 自动从环境变量读取
	intents: 1 | 512 | 4096 // GUILDS + GUILD_MESSAGES + MESSAGE_CONTENT
})

// 创建客户端
const _client = new Client(
	{
		token: process.env.DISCORD_BOT_TOKEN!,
		clientId: process.env.DISCORD_CLIENT_ID!,
		baseUrl: process.env.BASE_URL || "http://localhost:3000",
		publicKey: process.env.DISCORD_PUBLIC_KEY!,
		deploySecret: process.env.DEPLOY_SECRET
	},
	{
		listeners: [new MessageListener(), new BotReady()]
	},
	[gateway]
)

// 启动 bot
console.log("✅ 正在启动 bot...")
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
