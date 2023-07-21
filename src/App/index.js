const ModerClient = require('../Classes/Client/ModerClient')
const { IntentsBitField } = require('discord.js')

// Главный файл управления ботом
require('dotenv').config()

const opt = {
	token: '',
	mongoURI: '',
	intents: [
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.MessageContent,
	],
}

const client = new ModerClient(opt)

client
	.init()
	.then(() => console.log('\x1b[32m%s\x1b[0m', `[INIT] All systems initiated`))
	.catch(error => console.log('\x1b[31m%s\x1b[0m', `[INIT]`, error))
