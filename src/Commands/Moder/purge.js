const Command = require('../../Classes/Others/Commands')
const {
	CommandInteraction,
	ApplicationCommandOptionType,
} = require('discord.js')
const { PermissionFlagsBits } = require('discord.js')
const ModerClient = require('../../Classes/Client/ModerClient')
const ConfigUtil = require('../../Classes/Api/Config')
const Config = new ConfigUtil()

class KickCommand extends Command {
	constructor() {
		super(
			'purge',
			'Очистить канал от N последних сообщений',
			[
				{
					name: 'count',
					description: 'Кол-во сообщений к удалению',
					type: ApplicationCommandOptionType.Integer,
					required: true,
				},
				{
					name: 'user',
					description: 'Почистить сообщения конкретного пользователя',
					type: ApplicationCommandOptionType.User,
				},
			],
			[PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages],
			['MANAGE_CHANNELS', 'MANAGE_MESSAGES', 'READ_MESSAGE_HISTORY'],
			[Config.CommandType.SLASH],
			[Config.CommandCategory.ADMIN],
			[]
		)
	}
	/**
	 *
	 * @param {CommandInteraction} interaction
	 * @param {ModerClient} client
	 */
	async execute(interaction, client) {
		let count = 0
		let res = interaction.options.getInteger(`count`)
		if (res != null) count = res
		let user = interaction.options.getUser(`user`)

		if (user == null) {
			user = client.user
		}
		if (count < 1) count = 1
		console.log(user)

		// Получение базис сообщения
		let message = await interaction.channel.messages
			.fetch({ limit: 1 })
			.then(messagePage => (messagePage.size === 1 ? messagePage.at(0) : null))
		let c = 0
		let messages = []
		await interaction.deferReply()

		while (message || c < count) {
			let messagePage = await interaction.channel.messages.fetch({
				limit: 100,
				before: message.id,
			})
			for (let i = 0; i < messagePage.size; i++) {
				let msg = messagePage.at(i)
				// Если пользователь не указан
				if (user.id == client.user.id) {
					if (c < count) {
						messages.push(msg)
						c++
					}
				} else {
					if (c < count && msg.author.id == user.id) {
						messages.push(msg)
						c++
					}
				}
			}
			message =
				0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null
		}
		for (let i = 0; i < messages.length; i++) {
			let m = messages[i]
			if (m.deletable) await m.delete()
		}

		interaction.followUp({
			content: `> ${interaction.user.tag} (<@${
				interaction.user.id
			}>) удалил ${c} сообщений ${
				user.id == client.user.id ? `` : `пользователя <@${user.id}> `
			}в канале <#${interaction.channel.id}> по админ-команде.`,
			ephemeral: true,
		})
	}

	async componentListener(client, interaction) {}
}

module.exports = KickCommand
