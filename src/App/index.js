const ModerClient = require('../Classes/Client/ModerClient')
const { IntentsBitField } = require('discord.js')
const { TOKEN, MONGO_URI } = require('./config.json')

// Главный файл управления ботом
require('dotenv').config()

const opt = {
	token: TOKEN,
	mongoURI: MONGO_URI,
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
