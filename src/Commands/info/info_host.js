const Command = require('../../Classes/Others/Commands')
const { CommandInteraction, EmbedBuilder } = require('discord.js')
const ConfigUtil = require('../../Classes/Api/Config')
const Config = new ConfigUtil()

const osu = require('node-os-utils')
const mem = osu.mem
const cpu = osu.cpu

class InfoHostCommand extends Command {
	constructor() {
		super(
			'host-info',
			'информация о хосте бота',
			[],
			[],
			[],
			[Config.CommandType.SLASH],
			[Config.CommandCategory.SERVER],
			[]
		)
	}
	/**
	 *
	 * @param {CommandInteraction} interaction
	 */
	async execute(interaction) {
		await mem.info().then(async info => {
			let cpuUP = await cpu.usage()

			const embed = new EmbedBuilder()
				// .setColor('')
				.setTitle('Статистика')
				.setDescription('Статистика бота')
				.addFields(
					{
						name: 'Память (RAM)',
						value:
							'Общая память: ' +
							info.totalMemMb +
							' MB\nИспользуемая память: ' +
							info.usedMemMb +
							' MB\nСвободная память: ' +
							info.freeMemMb +
							' MB\nПроцент свободной памяти: ' +
							info.freeMemPercentage +
							'%',
						inline: true,
					},
					{
						name: 'CPU',
						value: `Процент использования процессора: ${cpuUP}%`,
						inline: true,
					}
				)
				.setTimestamp()
				.setFooter({
					text: `Запрошено ${interaction.member.user.username}`,
					iconURL: interaction.member.user.displayAvatarURL({ dynamic: true }),
				})

			interaction.reply({
				embeds: [embed],
			})
		})
	}
}

module.exports = InfoHostCommand
