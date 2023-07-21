const ConfigUtil = require('../Api/Config')

class Command {
	constructor(
		cmd,
		description,
		options,
		user_permissions,
		bot_permissions,
		type,
		category,
		componentsNames
	) {
		this.cmd = [].concat(cmd)
		this.description = description
		this.options = options
		this.user_permissions = user_permissions
		this.bot_permissions = bot_permissions
		this.category = category
		this.componentsNames = componentsNames
		this.type = type
		this.ownerID = '996838902189007009'
		this.Config = new ConfigUtil()
	}
	execute(interaction, client) {}
}

module.exports = Command
