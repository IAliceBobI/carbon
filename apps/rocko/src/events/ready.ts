import {
	type Client,
	type ListenerEventData,
	ReadyListener
} from "carbon-proxy"

export class Ready extends ReadyListener {
	async handle(data: ListenerEventData[this["type"]], _client: Client) {
		console.log(`\n${"=".repeat(60)}`)
		console.log("✅ Bot 已就绪！")
		console.log("=".repeat(60))
		console.log(`📡 代理配置: ${process.env.DISCORD_SOCKS_PROXY || "未设置"}`)
		console.log(`\n🤖 Bot 信息:`)
		console.log(`   用户名: ${data.user?.username}#${data.user?.discriminator}`)
		console.log(`   ID: ${data.user?.id}`)
		console.log(`\n✅ SOCKS5H 代理连接正常！`)
		console.log(`✅ 正在监听消息...`)

		if (process.env.DISCORD_CHANNEL_ID) {
			console.log(`\n📝 目标频道: ${process.env.DISCORD_CHANNEL_ID}`)
			console.log(`   请在该频道发送消息进行测试...`)
		} else {
			console.log(`\n⚠️ 未设置 DISCORD_CHANNEL_ID`)
			console.log(`   将监听所有频道的消息...`)
		}
		console.log(`${"=".repeat(60)}\n`)
	}
}
