
const apiFunctions = require('../functions/apiFunctions');

module.exports = [{
    name: 'inspire',
    description: 'Generate an inspirational quote!',
    async execute(robot, message) {
        //https://github.com/kishlaya/inspirobot-bot/blob/master/README.md
        let image = await apiFunctions.getAsync(robot, 'https://inspirobot.me/api?generate=true', null, true);
        message.reply(image);
    }
}];
