const { CommandInteraction, EmbedBuilder } = require('discord.js')
const Event = require('../Classes/Others/Events')
const ModerClient = require('../Classes/Client/ModerClient')
const ConfigUtil = require('../Classes/Api/Config')
const handler = new (require('../Classes/Api/Handler').Handler)()
const Config = new ConfigUtil()

class InteractionCreateEvent extends Event {
	constructor() {
		super('interactionCreate', false)
		this.commands = handler.commands
	}
	/**
	 *
	 * @param {CommandInteraction} interaction
	 * @param {ModerClient} client
	 */
	async execute(interaction, client) {
		const { commandName, customId } = interaction
		const guildDB = await client.database.collection('guild')
		if (interaction.isCommand() || interaction.isContextMenu) {
			const cmd = this.commands.get(commandName || customId)
			if (
				cmd &&
				(((cmd.type.includes(Config.CommandType.SLASH) ||
					cmd.type.includes(Config.CommandType.SLASH_APPLICATION)) &&
					interaction.isCommand()) ||
					(cmd.type.includes(Config.CommandType.CTX_USER) &&
						interaction.isContextMenu()) ||
					(cmd.type.includes(Config.CommandType.CTX_MESSAGE) &&
						interaction.isContextMenu()))
			) {
				let perms_error = []
				if (interaction.inGuild()) {
					// user_permissions
					let perms_error_author = []

					const setted_roles = await guildDB.findOne({
						guild_id: interaction.guild.id,
					})

					if (
						cmd.category.includes(Config.CommandCategory.ADMIN) &&
						interaction.member.roles.cache.some(role =>
							setted_roles.admins.includes(role.id)
						)
					) {
						perms_error_author = []
					} else {
						cmd.user_permissions.forEach(perm => {
							console.log(perm)
							if (!interaction.member.permissions.has(perm)) {
								perms_error_author.push(perm)
							}
						})
					}

					if (perms_error_author.length != 0)
						perms_error.push(
							`У тебя нет доступа к использованию команды \`${
								cmd.cmd
							}\`.\n||Требуемые права: ${perms_error_author.join(',')}||`
						)

					// bot_permissions
					let perms_error_bot = []
					cmd.bot_permissions.forEach(perm => {
						if (
							!interaction.guild.members.cache
								.get(client.user.id)
								.permissions.has(perm)
						) {
							perms_error_bot.push(perm)
						}
					})
					if (perms_error_bot.length != 0)
						perms_error.push(
							`У меня (${client.user}) нет возможности выполнить команду \`${
								cmd.cmd
							}\`.\n||Требуемые права: ${perms_error_bot.join(',')}||`
						)

					// summary
					if (perms_error.length != 0)
						return interaction.reply({
							embeds: [
								new EmbedBuilder()
									.setTitle(`Ошибка выполнения команды ${cmd.cmd}`)
									.setDescription(`${perms_error.join('\n')}`)
									.setColor(Config.embed_color),
							],
							ephemeral: true,
						})
				}
				try {
					return cmd.execute(interaction, client)
				} catch (err) {
					interaction.reply({
						embeds: [
							new EmbedBuilder()
								.setDescription(`Ошибка выполнения команды ${cmd.cmd}`)
								.setColor(Config.embed_color),
						],
						ephemeral: true,
					})
					console.log(
						`[EVENT/INTERACTIONCREATE] Ошибка выполнения команды ${cmd.cmd}: ${err}`
					)
				}
			}
		} else {
			let found = false
			client.handler.commands.forEach(cmd => {
				let regexName = false
				console.log(cmd.componentsNames)
				cmd.componentsNames.forEach(name => {
					if (
						name.includes('...') &&
						interaction.customId.includes(name.replace('...', ''))
					)
						regexName = true
				})
				if (
					(cmd.componentsNames.includes(interaction.customId) || regexName) &&
					cmd.componentListener(client, interaction)
				)
					found = true
			})

			if (!found) defer(interaction)
		}
	}
}

async function defer(interaction) {
	if (!interaction.replied) interaction.deferUpdate()
}

module.exports = InteractionCreateEvent
