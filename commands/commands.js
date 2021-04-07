module.exports = [{
    name: 'commands',
    description: 'List out all commands',
    async execute(robot, message, args) {
        let list = '**Bot Commands**';
        for(let cmd of robot.commands){
            list += `\n${formatCommand(robot.prefix, cmd)}`;
        }
        message.reply(list);
    },
}];

function formatCommand(prefix, command){
    command = command[1];
    return `${prefix}${command.name}: *${command.description}*`;
}
