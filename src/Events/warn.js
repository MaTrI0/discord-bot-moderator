const Event = require('../Classes/Others/Events')

class WarnEvent extends Event {
	constructor() {
		super('warn', false)
	}
	execute(info) {
		console.log(`[WARN]`, info)
	}
}
module.exports = WarnEvent
