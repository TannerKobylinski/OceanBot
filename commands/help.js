module.exports = [{
    name: 'help',
    description: 'List out all commands',
    async execute(robot, message, args) {
        let list = '**Bot Commands**';
        robot.commands.sort((a,b) => a.name.localeCompare(b.name));
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
