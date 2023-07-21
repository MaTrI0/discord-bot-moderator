// Данная панелька будет совмещать в себе все основные команды для стаффа сервера. Эта команда позволит упрость работу стафа, упрощая процесс взаимодействия с пользователем.

const Command = require('../../Classes/Others/Commands')
const {
	CommandInteraction,
	ApplicationCommandOptionType,
	StringSelectMenuBuilder,
	ActionRowBuilder,
	EmbedBuilder,
	SelectMenuBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} = require('discord.js')
const { PermissionFlagsBits } = require('discord.js')
const ModerClient = require('../../Classes/Client/ModerClient')
const ConfigUtil = require('../../Classes/Api/Config')
const Config = new ConfigUtil()

let user

class ActionCommand extends Command {
	constructor() {
		super(
			'action',
			'Панель управления пользователем (action)',
			[
				{
					name: 'user',
					description: 'Пользователь для управления',
					type: ApplicationCommandOptionType.User,
					required: true,
				},
			],
			[PermissionFlagsBits.ModerateMembers],
			[PermissionFlagsBits.ModerateMembers],
			[Config.CommandType.SLASH],
			[Config.CommandCategory.ADMIN],
			[
				'comand_menu',
				'ban',
				'kick',
				'mute',
				'warn',
				'info',
				'muteTimeInput',
				'mute - modal',
				'warn-modal',
				'warnTimeInput',
				'warnReasonInput',
			]
		)
		this.user
	}
	/**
	 *user
	 * @param {CommandInteraction} interaction
	 * @param {ModerClient} client
	 */
	async execute(interaction, client) {
		user = await interaction.options.getUser(`user`)

		const MainEmbed = new EmbedBuilder()
			.setTitle(`Панель управления пользователем: ${user.username}`)
			.setDescription(this.description)
			.addFields({
				name: 'Список команд: ',
				value:
					' 1: ban - Забанить пользователя' +
					' \n2: kick - Выгнать пользователя' +
					' \n3: mute - Замутить пользователя' +
					' \n4: warn - Выдать предупреждения пользователю' +
					' \n5: info - Посмотреть предупреждения пользователя',
				inline: true,
			})
			.setTimestamp()
			.setFooter({
				text: `Запрошено ${interaction.member.user.username}`,
				iconURL: interaction.member.user.displayAvatarURL({ dynamic: true }),
			})

		const mainSelectMenu = new ActionRowBuilder().setComponents(
			new SelectMenuBuilder()
				.setCustomId('comand_menu')
				.setPlaceholder('Выберите команду')
				.setMinValues(0)
				.setMaxValues(1)
				.addOptions([
					{
						label: 'ban',
						description: 'Забрать доступ к серверу у пользователя',
						value: 'ban',
					},
					{
						label: 'kick',
						description: 'Выгнать пользователя с сервера',
						value: 'kick',
					},
					{
						label: 'mute',
						description: 'Забрать право голоса у пользователя',
						value: 'mute',
					},
					{
						label: 'warn',
						description: 'Выдать пользователю предупреждение',
						value: 'warn',
					},
					{
						label: 'info',
						description: 'Посмотреть сводку по наказаниям юзера',
						value: 'info',
					},
				])
		)

		interaction.reply({
			embeds: [MainEmbed],
			components: [mainSelectMenu],
		})
	}

	/**
	 *
	 * @param {CommandInteraction} interaction
	 * @param {ModerClient} client
	 */
	async componentListener(client, interaction) {
		if (interaction.isSelectMenu()) {
			if (interaction.customId == 'comand_menu') {
				switch (interaction.values[0]) {
					case 'ban':
						{
							try {
								const banMember = await interaction.guild.members.fetch(user.id)
								if (
									user.bot ||
									!banMember.bannable ||
									[interaction.user.id, client.user.id].includes(user.id) ||
									banMember.roles.highest.rawPosition >=
										interaction.guild.members.resolve(client.user).roles.highest
											.rawPosition
								)
									return interaction.reply({
										content: `Пользователь <@${user.id}> не доступен для бана.`,
										ephemeral: true,
									})
								await banMember.roles.cache.forEach(async role => {
									try {
										if (role.id != '1046329401408757830')
											await banMember.roles.remove(role)
									} catch (err) {
										console.error(err)
									}
								})
								await banMember.roles.add('1129298443781812337')
								interaction.reply({
									content: `> ${user.tag} (<@${user.id}>) забанен по админ-команде пользователем ${interaction.user.tag} (<@${interaction.user.id}>).`,
									ephemeral: true,
								})
							} catch (err) {
								return interaction.reply({
									content:
										'Данное сообщение устарело, вызовите команду заново.',
									ephemeral: true,
								})
							}
						}
						break
					case 'kick':
						{
							try {
								const kickMember = await interaction.guild.members.fetch(
									user.id
								)
								if (
									user.bot ||
									!kickMember.kickable ||
									[interaction.user.id, client.user.id].includes(user.id) ||
									kickMember.roles.highest.rawPosition >=
										interaction.guild.members.resolve(client.user).roles.highest
											.rawPosition
								)
									return interaction.reply({
										content: `Пользователь <@${user.id}> не доступен для кика.`,
										embeds: [],
										components: [],
										ephemeral: true,
									})
								kickMember.kick(
									`${user.tag} кикнут по админ-команде пользователем ${interaction.user.tag}`
								)
								interaction.reply({
									content: `> ${user.tag} (<@${user.id}>) кикнут по админ-команде пользователем ${interaction.user.tag} (<@${interaction.user.id}>).\n\nДанное сообщение продублировано в **Аудит сервера**`,
									embeds: [],
									components: [],
									ephemeral: true,
								})
							} catch (err) {
								return interaction.reply({
									content:
										'Данное сообщение устарело, вызовите команду заново.',
									ephemeral: true,
								})
							}
						}
						break
					case 'mute':
						{
							const muteModal = new ModalBuilder()
								.setCustomId('mute-modal')
								.setTitle('Время наказания')

							const TextInput = new TextInputBuilder()
								.setCustomId('muteTimeInput')
								.setLabel('для снятия мута - напишите 0')
								.setPlaceholder('Время в минутах...')
								.setRequired(true)
								.setStyle(TextInputStyle.Short)

							muteModal.addComponents(
								new ActionRowBuilder().addComponents(TextInput)
							)
							await interaction.showModal(muteModal)

							const filter = interaction =>
								interaction.customId === 'mute-modal'

							interaction
								.awaitModalSubmit({ filter, time: 300_000 })
								.then(async modalInteraction => {
									const res =
										modalInteraction.fields.getTextInputValue('muteTimeInput')
									const time = 1000 * 60 * res

									try {
										const muteMember = await interaction.guild.members.fetch(
											user.id
										)

										if (
											user.bot ||
											!muteMember.moderatable ||
											[interaction.user.id, client.user.id].includes(user.id) ||
											muteMember.roles.highest.rawPosition >=
												modalInteraction.guild.members.resolve(client.user)
													.roles.highest.rawPosition
										)
											return interaction.followUp({
												content: `Пользователь <@${user.id}> не доступен для таймаута.`,
												ephemeral: true,
											})
										if (time == 0) {
											muteMember.timeout(
												null,
												`${user.tag} размучен (таймаут) по админ-команде пользователем ${modalInteraction.user.tag}`
											)
											interaction.followUp({
												content: `> ${user.tag} (<@${user.id}>) размучен (таймаут) по админ-команде пользователем ${modalInteraction.user.tag} (<@${modalInteraction.user.id}>).\n\nДанное сообщение продублировано в **Аудит сервера**`,
												ephemeral: true,
											})
										} else {
											muteMember.timeout(
												time,
												`${user.tag} замучен (таймаут) на ${res} минут по админ-команде пользователем ${modalInteraction.user.tag}`
											)
											interaction.followUp({
												content: `> ${user.tag} (<@${user.id}>) замучен (таймаут) на ${res} минут по админ-команде пользователем ${modalInteraction.user.tag} (<@${modalInteraction.user.id}>).\n\nДанное сообщение продублировано в **Аудит сервера**`,
												ephemeral: true,
											})
										}
									} catch (err) {
										return interaction.followUp({
											content:
												'Данное сообщение устарело, вызовите команду заново.',
											ephemeral: true,
										})
									}
								})
						}
						break
					case 'warn':
						{
							try {
								const warnModal = new ModalBuilder()
									.setCustomId('warn-modal')
									.setTitle('Время наказания')

								const TextInputShort = new TextInputBuilder()
									.setCustomId('warnTimeInput')
									.setLabel('Для обычного варна - пропустить')
									.setPlaceholder('Время варна...')
									.setRequired(false)
									.setStyle(TextInputStyle.Short)

								const TextInputLong = new TextInputBuilder()
									.setCustomId('warnReasonInput')
									.setLabel('Причина наказания')
									.setPlaceholder('Напишите "снять" и 1 варн снимется')
									.setRequired(true)
									.setStyle(TextInputStyle.Short)

								warnModal.addComponents(
									new ActionRowBuilder().addComponents(TextInputShort),
									new ActionRowBuilder().addComponents(TextInputLong)
								)
								await interaction.showModal(warnModal)

								const filter = interaction =>
									interaction.customId === 'warn-modal'

								interaction
									.awaitModalSubmit({ filter, time: 300_000 })
									.then(async modalInteraction => {
										const res =
											modalInteraction.fields.getTextInputValue('warnTimeInput')
										console.log(res)
										const reason =
											modalInteraction.fields.getTextInputValue(
												'warnReasonInput'
											)

										try {
											const warnMember =
												await modalInteraction.guild.members.fetch(user.id)

											const collection_member =
												await client.database.collection('members')
											const memberDB =
												(await collection_member.findOne({
													memberID: warnMember.id,
													memberGuildID: warnMember.guild.id,
												})) ||
												(await collection_member.insertOne({
													memberID: warnMember.id,
													memberGuildID: warnMember.guild.id,
													warns: [],
												}))

											if (
												user.bot ||
												[interaction.user.id, client.user.id].includes(
													user.id
												) ||
												warnMember.roles.highest.rawPosition >=
													modalInteraction.guild.members.resolve(client.user)
														.roles.highest.rawPosition
											)
												return await modalInteraction.reply({
													content: `Пользователь <@${user.id}> не доступен для варна.`,
													ephemeral: true,
												})

											if (reason.toLowerCase() == 'снять') {
												if (memberDB.warns.length != 0) {
													collection_member.updateOne(
														{
															memberID: warnMember.id,
															memberGuildID: warnMember.guild.id,
														},
														{ $pop: { warns: -1 } }
													)
													await modalInteraction.reply({
														content: `У пользователя <@${user.id}> было снято 1 предупреждение.`,
														ephemeral: true,
													})
												} else {
													await modalInteraction.reply({
														content: `У пользователя <@${user.id}> нет предупреждений.`,
														ephemeral: true,
													})
												}
											} else {
												if (res == '') {
													try {
														if (memberDB.warns.length < 3) {
															await collection_member.updateOne(
																{
																	memberID: warnMember.id,
																	memberGuildID: warnMember.guild.id,
																},
																{
																	$push: {
																		warns: {
																			time: null,
																			reason: reason,
																		},
																	},
																}
															)

															await modalInteraction.reply({
																content: `Варн был выдан успешно. У пользователя ${
																	memberDB.warns.length + 1
																} варна.`,
																ephemeral: true,
															})
														}
													} catch (err) {
														await modalInteraction.reply({
															content: `Произошла ошибка при выдачи варна. Повторите попытку позднее.`,
															ephemeral: true,
														})
														console.error(err)
													}
												} else {
													const time = 1000 * 60 * res

													try {
														if (memberDB.warns.length < 3) {
															collection_member.updateOne(
																{
																	memberID: warnMember.id,
																	memberGuildID: warnMember.guild.id,
																},
																{
																	$push: {
																		warns: {
																			time: time,
																			reason: reason,
																		},
																	},
																}
															)
															await modalInteraction.reply({
																content: `Временный варн был выдан успешно. У пользователя ${
																	memberDB.warns.length + 1
																} варнов.`,
																ephemeral: true,
															})

															setTimeout(() => {
																if (memberDB.warns.length != 0) {
																	collection_member.updateOne(
																		{
																			memberID: warnMember.id,
																			memberGuildID: warnMember.guild.id,
																		},
																		{ $pop: { warns: 1 } }
																	)
																}
															}, time)
														}
													} catch (err) {
														await modalInteraction.reply({
															content: `Произошла ошибка при выдачи временного варна. Повторите попытку позднее.`,
															ephemeral: true,
														})
														console.error(err)
													}
												}
											}

											if (memberDB.warns.length >= 3) {
												await banMember.roles.cache.forEach(async role => {
													try {
														if (role.id != '1046329401408757830')
															await banMember.roles.remove(role)
													} catch (err) {
														console.error(err)
													}
												})
												await banMember.roles.add('1129298443781812337')
												await modalInteraction.reply({
													content: `Пользователь <@${user.id}> забанен за превышение разрешенных предупреждений.\n\n Узнать сводку наказаний можно в предыдущем меню, последний пункт.`,
													ephemeral: true,
												})
											}
										} catch (err) {
											await interaction.followUp({
												content:
													'Данное сообщение устарело, вызовите команду заново.',
												ephemeral: true,
											})
											console.error(err)
										}
									})
									.catch(console.error)
							} catch (err) {
								return console.error(err)
							}
						}
						break
					case 'info':
						{
							const infoEmbed = new EmbedBuilder()
								.setTitle(`Предупреждения пользователя: ${user.username}`)
								.setTimestamp()
								.setFooter({
									text: `Запрошено ${interaction.member.user.username}`,
									iconURL: interaction.member.user.displayAvatarURL({
										dynamic: true,
									}),
								})

							const infoMember = await interaction.guild.members.fetch(user.id)

							const collection_member = await client.database.collection(
								'members'
							)
							const memberDB =
								(await collection_member.findOne({
									memberID: infoMember.id,
									memberGuildID: infoMember.guild.id,
								})) ||
								(await collection_member.insertOne({
									memberID: infoMember.id,
									memberGuildID: infoMember.guild.id,
									warns: [],
								}))

							let arr = []

							if (memberDB.warns.length != 0) {
								console.log('t')
								for (let i = 0; i < memberDB.warns.length; i++) {
									arr.push({
										name: `${i + 1}:`,
										value: `время: ${memberDB.warns[i].time}, причина: ${memberDB.warns[i].reason}`,
										inline: false,
									})
								}
							}

							infoEmbed.addFields(arr)

							interaction.reply({
								embeds: [infoEmbed],
								components: [],
							})
						}
						break
				}
			}
		}
	}
}

module.exports = ActionCommand
