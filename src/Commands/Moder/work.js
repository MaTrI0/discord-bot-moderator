const Command = require('../../Classes/Others/Commands')
const {
	CommandInteraction,
	ApplicationCommandOptionType,
	EmbedBuilder,
	ActionRowBuilder,
	SelectMenuBuilder,
} = require('discord.js')
const { PermissionFlagsBits } = require('discord.js')
const ModerClient = require('../../Classes/Client/ModerClient')
const ConfigUtil = require('../../Classes/Api/Config')
const Config = new ConfigUtil()
let i

class WorkCommand extends Command {
	constructor() {
		super(
			'work-panel',
			'Вызвать панель модераторов',
			[],
			[PermissionFlagsBits.ModerateMembers],
			['MANAGE_CHANNELS', 'MANAGE_MESSAGES', 'READ_MESSAGE_HISTORY'],
			[Config.CommandType.SLASH],
			[Config.CommandCategory.ADMIN],
			['moder_menu', 'start', 'stop', 'online', 'top']
		)
	}
	/**
	 *
	 * @param {CommandInteraction} interaction
	 * @param {ModerClient} client
	 */
	async execute(interaction, client) {
		i = interaction
		const MainEmbed = new EmbedBuilder()
			.setTitle(`Панель работы модераторов`)
			.setDescription(this.description)
			.addFields({
				name: 'Список команд: ',
				value:
					' 1: start - Время выхода на смену (Начать модерировать чат).' +
					' \n2: stop - Окончание смены (Закончить модерировать чат).' +
					' \n3: online - Кто сейчас вышел модерировать.' +
					' \n4: top - Топ по времени работы.',
				inline: true,
			})
			.setTimestamp()
			.setFooter({
				text: `Запрошено ${interaction.member.user.username}`,
				iconURL: interaction.member.user.displayAvatarURL({ dynamic: true }),
			})

		const collection_moder_member = await client.database.collection(
			'moder_members'
		)
		const memberDB =
			(await collection_moder_member.findOne({
				memberID: interaction.member.id,
				memberGuildID: interaction.member.guild.id,
			})) ||
			(await collection_moder_member.insertOne({
				memberID: interaction.member.id,
				memberGuildID: interaction.member.guild.id,
				workTime: 0,
				online: false,
			}))

		const mainSelectMenu = new ActionRowBuilder().setComponents(
			new SelectMenuBuilder()
				.setCustomId('moder_menu')
				.setPlaceholder('Выберите команду')
				.setMinValues(0)
				.setMaxValues(1)
				.addOptions([
					{
						label: 'start',
						value: 'start',
					},
					{
						label: 'stop',
						value: 'stop',
					},
					{
						label: 'online',
						value: 'online',
					},
					{
						label: 'top',
						value: 'top',
					},
				])
		)

		interaction.reply({
			embeds: [MainEmbed],
			components: [mainSelectMenu],
			ephemeral: true,
		})
	}
	/**
	 *
	 * @param {CommandInteraction} interaction
	 * @param {ModerClient} client
	 */
	async componentListener(client, interaction) {
		if (interaction.isSelectMenu()) {
			if (interaction.customId == 'moder_menu') {
				switch (interaction.values[0]) {
					case 'start':
						{
							try {
								const collection_moder_member =
									await client.database.collection('moder_members')
								const memberDB =
									(await collection_moder_member.findOne({
										memberID: interaction.member.id,
										memberGuildID: interaction.member.guild.id,
									})) ||
									(await collection_moder_member.insertOne({
										memberID: interaction.member.id,
										memberGuildID: interaction.member.guild.id,
										workTime: 0,
										online: false,
									}))

								if (memberDB.online == false) {
									collection_moder_member.updateOne(
										{
											memberID: interaction.member.id,
											memberGuildID: interaction.member.guild.id,
										},
										{
											$set: {
												online: true,
											},
										}
									)

									client.intervals[interaction.member.id] = setInterval(
										async () => {
											console.log('gg')

											const memberD = await collection_moder_member.findOne({
												memberID: interaction.member.id,
												memberGuildID: interaction.member.guild.id,
											})

											collection_moder_member.updateOne(
												{
													memberID: interaction.member.id,
													memberGuildID: interaction.member.guild.id,
												},
												{
													$set: {
														workTime: memberD.workTime + 1,
													},
												}
											)
										},
										60000
									)

									return i.editReply({
										content: '✅ Ваша рабочая смена начата.',
										embeds: [],
										components: [],
									})
								} else {
									return i.editReply({
										content: '❌ Вы уже работаете.',
										embeds: [],
										components: [],
									})
								}
							} catch (err) {
								console.error(err)
							}
						}
						break
					case 'stop':
						{
							try {
								const collection_moder_member =
									await client.database.collection('moder_members')
								const memberDB =
									(await collection_moder_member.findOne({
										memberID: interaction.member.id,
										memberGuildID: interaction.member.guild.id,
									})) ||
									(await collection_moder_member.insertOne({
										memberID: interaction.member.id,
										memberGuildID: interaction.member.guild.id,
										workTime: 0,
										online: false,
									}))

								if (memberDB.online == true) {
									collection_moder_member.updateOne(
										{
											memberID: interaction.member.id,
											memberGuildID: interaction.member.guild.id,
										},
										{
											$set: {
												online: false,
											},
										}
									)

									clearInterval(client.intervals[interaction.member.id])

									return i.editReply({
										content: `✅ Ваша рабочая смена закончена.\n\n> Отработано за все время: ${memberDB.workTime} минут`,
										embeds: [],
										components: [],
									})
								} else {
									return i.editReply({
										content: '❌ Вы еще не работаете.',
										embeds: [],
										components: [],
									})
								}
							} catch (err) {
								console.error(err)
							}
						}
						break
					case 'online':
						{
							try {
								const onlineEmbed = new EmbedBuilder()
									.setTitle(`Модераторы онлайн`)
									.setTimestamp()
									.setFooter({
										text: `Запрошено ${interaction.member.user.username}`,
										iconURL: interaction.member.user.displayAvatarURL({
											dynamic: true,
										}),
									})

								const collection_moder_member =
									await client.database.collection('moder_members')
								const memberDB = await collection_moder_member
									.find({ memberGuildID: interaction.guild.id })
									.toArray()

								let arr = []

								for (let i = 0; i < memberDB.length; i++) {
									if (memberDB[i].online == true) {
										const mem = await interaction.guild.members.fetch(
											memberDB[i].memberID
										)
										arr.push({
											name: `${i + 1}:`,
											value: `${mem.user.username}: онлайн`,
											inline: false,
										})
									}
								}

								onlineEmbed.addFields(arr)

								return i.editReply({
									embeds: [onlineEmbed],
									components: [],
								})
							} catch (err) {
								console.error(err)
							}
						}
						break
					case 'top':
						{
							try {
								const collection_moder_member =
									await client.database.collection('moder_members')
								const memberDB = await collection_moder_member
									.find({ memberGuildID: interaction.guild.id })
									.toArray()

								const onlineEmbed = new EmbedBuilder()
									.setTitle(`Топ модераторов по времени работы`)
									.setDescription(
										memberDB
											.splice(0, 10)
											.filter(a => a.workTime > 0)
											.map(
												(b, i) =>
													`\`${i++}:\` ${
														client.users.cache.get(b.memberID)?.tag || 'Unknown'
													} - **${b.workTime} минут**`
											)
											.join('\n')
									)
									.setTimestamp()
									.setFooter({
										text: `Запрошено ${interaction.member.user.username}`,
										iconURL: interaction.member.user.displayAvatarURL({
											dynamic: true,
										}),
									})

								return i.editReply({
									embeds: [onlineEmbed],
									components: [],
								})
							} catch (err) {
								console.error(err)
							}
						}
						break
				}
			}
		}
	}
}

module.exports = WorkCommand
