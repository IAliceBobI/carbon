import {
	type Client,
	type ListenerEventData,
	MessageCreateListener
} from "carbon-proxy"

const TARGET_CHANNEL = process.env.DISCORD_CHANNEL_ID

export class MessageCreate extends MessageCreateListener {
	async handle(data: ListenerEventData[this["type"]], client: Client) {
		const message = data.message
		const author = message.author
		const content = data.content
		const channelId = message.channelId

		// 忽略机器人自己的消息
		if (author?.id === client.options.clientId) {
			return
		}

		console.log(`\n${"─".repeat(60)}`)
		console.log("📨 收到新消息！")
		console.log("─".repeat(60))
		console.log(`👤 作者: ${author?.username}#${author?.discriminator}`)
		console.log(`💬 内容: ${content || "[无文本内容]"}`)
		console.log(`📍 频道: ${channelId}`)
		console.log(`⏰ 时间: ${new Date().toLocaleString("zh-CN")}`)

		// 如果是指定频道
		if (TARGET_CHANNEL && channelId === TARGET_CHANNEL) {
			console.log(`\n✅ 这是目标频道！消息已收到！`)

			// 回复消息确认
			await message.reply(
				`✅ 收到你的消息："${content}"\n📡 通过 SOCKS5H 代理接收\n⏰ ${new Date().toLocaleString("zh-CN")}`
			)
		}
		console.log("─".repeat(60))
	}
}
