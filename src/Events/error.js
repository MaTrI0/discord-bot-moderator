const Event = require('../Classes/Others/Events')
class ErrorEvent extends Event {
	constructor() {
		super('error', false)
	}
	async execute({ stack }) {
		console.log(`[ERROR]`, stack)
	}
}
module.exports = ErrorEvent
