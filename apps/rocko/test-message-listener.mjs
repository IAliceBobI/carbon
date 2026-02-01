import "dotenv/config"
import { Client } from "carbon-proxy"
import { createServer } from "carbon-proxy/adapters/node"
import { GatewayPlugin } from "carbon-proxy/gateway"

console.log("=".repeat(60))
console.log("📡 简单消息监听测试")
console.log("=".repeat(60))
console.log(`\n🔑 Bot ID: ${process.env.DISCORD_CLIENT_ID}`)

// 创建客户端
const client = new Client(
	{
		token: process.env.DISCORD_BOT_TOKEN,
		clientId: process.env.DISCORD_CLIENT_ID,
		publicKey: process.env.DISCORD_PUBLIC_KEY,
		deploySecret: process.env.DEPLOY_SECRET,
		baseUrl: process.env.BASE_URL
	},
	{
		plugins: [
			new GatewayPlugin({
				proxyUrl: process.env.DISCORD_SOCKS_PROXY,
				intents: 1 | 512 | 4096 // GUILDS + GUILD_MESSAGES + MESSAGE_CONTENT
			})
		],
		listeners: [
			{
				type: "MESSAGE_CREATE",
				async handle(data, _client) {
					const message = data.message
					const author = message.author
					const content = data.content

					// 忽略机器人自己的消息
					if (author?.id === _client.options.clientId) {
						return
					}

					console.log(`\n${"─".repeat(60)}`)
					console.log("📨 收到新消息！")
					console.log("─".repeat(60))
					console.log(`👤 作者: ${author?.username}#${author?.discriminator}`)
					console.log(`💬 内容: ${content || "[无文本内容]"}`)
					console.log(`📍 频道: ${message.channelId}`)
					console.log(`⏰ 时间: ${new Date().toLocaleString("zh-CN")}`)

					// 回复消息
					await message.reply(
						`✅ 收到你的消息："${content}"\n⏰ ${new Date().toLocaleString("zh-CN")}`
					)
					console.log("✅ 已回复消息")
					console.log("─".repeat(60))
				}
			},
			{
				type: "READY",
				async handle(data, _client) {
					console.log("\n✅ Bot 已就绪！")
					console.log("✅ 正在监听所有频道消息...")
					const user = data.user
					console.log(`🤖 Bot: ${user?.username}#${user?.discriminator}`)
					console.log(`\n${"=".repeat(60)}`)
					console.log("💡 现在可以在任意频道发送消息测试（不需要@bot）")
					console.log("=".repeat(60))
				}
			}
		]
	}
)

// 启动服务器
createServer(client, { port: 3000 })

console.log("\n✅ 服务器已启动在端口 3000")
console.log("🔄 Gateway 正在连接...")
console.log(`\n${"=".repeat(60)}`)
console.log("💡 现在可以在任意频道发送消息测试（不需要@bot）")
console.log("=".repeat(60))

// 优雅退出
process.on("SIGINT", () => {
	console.log("\n\n👋 正在关闭 bot...")
	process.exit(0)
})
