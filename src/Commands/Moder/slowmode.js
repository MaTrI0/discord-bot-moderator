const Command = require('../../Classes/Others/Commands')
const {
	CommandInteraction,
	ApplicationCommandOptionType,
} = require('discord.js')
const { PermissionFlagsBits } = require('discord.js')
const ModerClient = require('../../Classes/Client/ModerClient')
const ConfigUtil = require('../../Classes/Api/Config')
const Config = new ConfigUtil()

class SlowmodeCommand extends Command {
	constructor() {
		super(
			'slowmode',
			'Установить ограничение на отправку сообщений в канале',
			[
				{
					name: 'time',
					description: 'Время в секундах',
					type: ApplicationCommandOptionType.Integer,
				},
			],
			[PermissionFlagsBits.ManageChannels],
			['MANAGE_CHANNELS'],
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
		let time = 0
		if (interaction.content != undefined) {
			let res = interaction.content.match(/( )([0-9].*)( )/gm)
			if (res?.length >= 1) time = parseInt(res[0].trim())
		} else {
			let res = interaction.options.getInteger(`time`)
			if (res != null) time = res
		}
		if (time < 0) time = 0
		if (time > 60 * 60 * 6) time = 60 * 60 * 6

		const channelLastDelay = interaction.channel.rateLimitPerUser
		interaction.channel.setRateLimitPerUser(
			time,
			`${interaction.user.tag} установил слоумод в канале #${interaction.channel.name} c ${channelLastDelay} на ${time} секунд по админ-команде`
		)

		interaction.reply(
			`> ${interaction.user.tag} (<@${interaction.user.id}>) установил слоумод в канале <#${interaction.channel.id}> c ${channelLastDelay} на ${time} секунд по админ-команде.\n\nДанное сообщение продублировано в **Аудит сервера**`
		)
	}

	async componentListener(client, interaction) {}
}

module.exports = SlowmodeCommand
