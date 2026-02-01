import { Command, type CommandInteraction } from "@buape/carbon"

const randomMessages = [
	"🎲 随机消息测试！",
	"🚀 Carbon 框架太棒了！",
	"💻 Hello from Carbon!",
	"🌟 今天是个好日子！",
	"🎯 正中红心！",
	"🎮 游戏时间到！",
	"☕ 咖啡时间！",
	"🌈 彩虹出现！",
	"⚡ 快速响应！",
	"🔥 火热上线！",
	"❤️ 用心编码！",
	"🎵 音乐响起！",
	"🌙 晚安世界！",
	"🌅 早晨好！",
	"🎉 庆祝时刻！",
	"💡 创意无限！"
]

export default class RandomCommand extends Command {
	name = "random"
	description = "发送一条随机消息"

	guildIds = ["1041045270659604701"]

	async run(interaction: CommandInteraction) {
		const randomIndex = Math.floor(Math.random() * randomMessages.length)
		const message = randomMessages[randomIndex]

		await interaction.reply({
			content: `${message}\n\n📝 测试消息 #${randomIndex + 1}/${randomMessages.length}`
		})
	}
}
