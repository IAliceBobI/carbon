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
		const guild = message.guildId

		// 忽略机器人自己的消息
		if (author?.id === client.options.clientId) {
			return
		}

		console.log(`\n${"─".repeat(60)}`)
		console.log("📨 收到新消息！")
		console.log("─".repeat(60))
		console.log(
			`👤 作者: ${author?.username}#${author?.discriminator} (${author?.id})`
		)
		console.log(`💬 内容: ${content || "[无文本内容]"}`)
		console.log(`📍 频道: ${channel}`)
		console.log(`🏠 服务器: ${guild}`)
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
class ReadyListenerHandler extends ReadyListener {
	async handle(data: ListenerEventData[this["type"]], _client: Client) {
		console.log("\n✅ Bot 已就绪！")
		console.log("✅ SOCKS5H 代理连接正常！")
		console.log("✅ 正在监听消息...\n")

		const user = data.user
		console.log(`🤖 Bot 信息:`)
		console.log(`   用户名: ${user?.username}#${user?.discriminator}`)
		console.log(`   ID: ${user?.id}`)

		// 显示监听的频道
		if (process.env.DISCORD_CHANNEL_ID) {
			console.log(`\n📝 目标频道: ${process.env.DISCORD_CHANNEL_ID}`)
			console.log(`   请在该频道发送消息进行测试...`)
		} else {
			console.log(`\n⚠️ 未设置 DISCORD_CHANNEL_ID`)
			console.log(`   将监听所有频道的消息...`)
		}
		console.log(`\n${"=".repeat(60)}`)
	}
}

// 创建客户端
const client = new Client(
	{
		token: process.env.DISCORD_BOT_TOKEN!,
		clientId: process.env.DISCORD_CLIENT_ID!,
		baseUrl: process.env.BASE_URL,
		deploySecret: process.env.DEPLOY_SECRET,
		clientSecret: process.env.DISCORD_CLIENT_SECRET!,
		publicKey: process.env.DISCORD_PUBLIC_KEY!
	},
	{
		// 使用 GatewayPlugin 并配置 SOCKS5H 代理
		plugins: [
			new GatewayPlugin({
				proxyUrl: process.env.DISCORD_SOCKS_PROXY, // 自动从环境变量读取
				intents: 1 | 512 | 4096 // GUILDS + GUILD_MESSAGES + MESSAGE_CONTENT
			})
		],
		listeners: [new MessageListener(), new ReadyListenerHandler()]
	}
)

// 启动 bot
client
	.connect()
	.then(() => {
		console.log("✅ 已启动连接流程...")
	})
	.catch((error) => {
		console.error("❌ 启动失败:", error)
		process.exit(1)
	})

// 优雅退出
process.on("SIGINT", () => {
	console.log("\n\n👋 正在关闭 bot...")
	client.disconnect()
	process.exit(0)
})
