const helperFunctions = require('../functions/helperFunctions');

module.exports = [{
    name: 'help',
    description: 'List out all commands',
    async execute(robot, message, args) {
        let serverId = message.channel.guild.id;
        let list = '**Bot Commands**';
        robot.commands.sort((a,b) => a.name.localeCompare(b.name));
        const BOT_PREFIX = await helperFunctions.getPrefixAsync(robot, serverId);
        for(let cmd of robot.commands){
            list += `\n${formatCommand(BOT_PREFIX, cmd)}`;
        }
        message.reply(list);
    },
}];

function formatCommand(prefix, command){
    command = command[1];
    return `${prefix}${command.name}: *${command.description}*`;
}
