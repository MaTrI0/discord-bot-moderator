const Command = require('../../Classes/Others/Commands')
const {
	CommandInteraction,
	ActionRowBuilder,
	SelectMenuBuilder,
	Client,
} = require('discord.js')
const { PermissionFlagsBits } = require('discord.js')
const ModerClient = require('../../Classes/Client/ModerClient')
const ConfigUtil = require('../../Classes/Api/Config')
const Config = new ConfigUtil()

class AdminPanelCommand extends Command {
	constructor() {
		super(
			'admin-panel',
			'панель управления ботом',
			[],
			[PermissionFlagsBits.Administrator],
			['SEND_MESSAGES'],
			[Config.CommandType.SLASH_APPLICATION],
			[Config.CommandCategory.ADMIN],
			[`hanko_sm`, `hanko_sm_slash`, `hanko_sm_admin_roles`]
		)
	}
	/**
	 *
	 * @param {CommandInteraction} interaction
	 * @param {ModerClient} client
	 */
	async execute(interaction, client) {
		if (interaction.inGuild()) {
			const row = new ActionRowBuilder().setComponents(
				new SelectMenuBuilder()
					.setCustomId('hanko_sm') // this is the id i made in ../../events/interactionCreate
					.setPlaceholder('Админ-меню')
					.setMinValues(0)
					.setMaxValues(1)
					.addOptions([
						{
							label: 'Установщик команд',
							description: 'Включение/выключение Slash-команд на сервере',
							value: 'hanko_sm_slash',
						},
						{
							label: 'Админ-роли',
							description: 'Выбор ролей, кому будет доступны админ-команды',
							value: 'hanko_sm_admin_roles',
						},
					])
			)

			interaction.reply({
				content: 'Админ-ПУ',
				components: [row],
				ephemeral: true,
			})
		} else {
			interaction.reply(`Тут будет инфа о боте или сервере?`)
		}
	}

	async componentListener(client, interaction) {
		const guildDB = await client.database.collection('guild')
		if (interaction.isSelectMenu()) {
			if (interaction.customId == 'hanko_sm') {
				if (interaction.values.includes(`hanko_sm_slash`)) {
					interaction.guild.commands.fetch().then(commands => {
						let comps = []
						let options = []
						client.handler.commands.forEach(cmd => {
							if (
								cmd.type.includes(Config.CommandType.SLASH) ||
								cmd.type.includes(Config.CommandType.CTX_USER) ||
								cmd.type.includes(Config.CommandType.CTX_MESSAGE)
							) {
								if (options.length < 25) {
									options.push({
										label: cmd.cmd[0],
										description: cmd.description,
										value: cmd.cmd[0],
										default:
											commands.filter(c => c.name == cmd.cmd[0]).size != 0,
									})
								} else {
									const selectMenu = new SelectMenuBuilder()
										.setCustomId('hanko_sm_slash')
										.setPlaceholder('Ничего не выбрано')
										.setMinValues(0)
										.setMaxValues(options.length)
										.addOptions(options)
									if (comps.length < 5)
										comps.push(new ActionRowBuilder().setComponents(selectMenu))
									options = [
										{
											label: cmd.cmd[0],
											description: cmd.description,
											value: cmd.cmd[0],
											default:
												commands.filter(c => c.name == cmd.cmd[0]).size != 0,
										},
									]
								}
							}
						})
						if (options.length > 0) {
							const selectMenu = new SelectMenuBuilder()
								.setCustomId('hanko_sm_slash')
								.setPlaceholder('Ничего не выбрано')
								.setMinValues(0)
								.setMaxValues(options.length)
								.addOptions(options)
							if (comps.length < 5)
								comps.push(new ActionRowBuilder().setComponents(selectMenu))
						}
						interaction.reply({
							content: `Установщик Slash-команд`,
							components: comps,
							ephemeral: true,
						})
					})
					return true
				} else if (interaction.values.includes(`hanko_sm_admin_roles`)) {
					interaction.guild.roles.fetch().then(async roles => {
						const setted_roles = await guildDB.findOne({
							guild_id: interaction.guild.id,
						})
						roles = roles.sort((b, a) => a.position - b.position || a.id - b.id)
						let options = []
						roles.forEach(r => {
							if (options.length < 25 && r.id != interaction.guild.id) {
								options.push({
									label: r.name,
									value: r.id,
									default: setted_roles.admins.includes(r.id),
								})
							}
						})
						interaction.reply({
							components: [
								new ActionRowBuilder().setComponents([
									new SelectMenuBuilder()
										.setCustomId('hanko_sm_admin_roles')
										.setPlaceholder('Выбери роли для доступа к админ-командам')
										.setMinValues(0)
										.setMaxValues(options.length)
										.addOptions(options),
								]),
							],
							ephemeral: true,
						})
					})
					return true
				}
				return false
			}
			if (interaction.customId == 'hanko_sm_admin_roles') {
				await guildDB.updateOne(
					{ guild_id: interaction.guild.id },
					{ $set: { admins: interaction.values } }
				)
				// guildDB.save()
				interaction.reply({
					content: `Выбранным ролям выдан доступ к админ-командам: ${
						interaction.values.length == 0
							? `Ролей нет`
							: `<@&${interaction.values.join(`> <@&`)}>`
					}`,
					ephemeral: true,
				})
				return true
			}
			if (interaction.customId == 'hanko_sm_slash') {
				interaction.guild.commands.fetch().then(currentCommands => {
					let updatedCommands = []
					let menuOptions = interaction.component.options
					if (currentCommands.size == 0) {
						interaction.values.forEach(option => {
							let ccmd = client.handler.commands.get(option)
							if (ccmd != undefined)
								updatedCommands.push({
									name: ccmd.cmd[0],
									description: ccmd.description,
									options: ccmd.options,
								})
						})
					} else {
						menuOptions.forEach(option => {
							// Если опция была выбрана в селект-менюшке
							if (interaction.values.includes(option.value)) {
								let ccmd = client.handler.commands.get(option.value)
								if (ccmd != undefined)
									updatedCommands.push({
										name: ccmd.cmd[0],
										description: ccmd.description,
										options: ccmd.options,
									})
							} else {
								// do nothing
							}
						})
						currentCommands.forEach(interaction => {
							if (
								menuOptions.filter(c => c.label == interaction.name).size == 0
							) {
								let ccmd = client.handler.commands.get(interaction.name)
								if (ccmd != undefined)
									updatedCommands.push({
										name: ccmd.cmd[0],
										description: ccmd.description,
										options: ccmd.options,
									})
							}
						})
					}
					interaction.guild.commands.set(updatedCommands)
					interaction.reply({
						content: `Команды установлены`,
						ephemeral: true,
					})
				})
				return true
			}
		}
		return false
	}
}

module.exports = AdminPanelCommand
