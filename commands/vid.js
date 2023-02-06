const { getMessageReferenced } = require('../functions/utils');

module.exports = [{
    name: 'obamna',
    description: 'soda',
    async execute(robot, message, args) {
        message = await getMessageReferenced(message);

        const path = `${robot.VIDEO_PATH}/obamna.mp4`
        message.reply('obamna', {
            files: [
                path
            ]
        });
    },
}];
