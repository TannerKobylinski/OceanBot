const helperFunctions = require('../functions/helperFunctions');

module.exports = [{
    name: 'help',
    description: 'List out all commands',
    async execute(robot, interaction) {
        let list = '**Bot Commands**';
        robot.commands.sort((a,b) => a.name.localeCompare(b.name));
        console.log(robot.commands);
        for(let cmd of robot.commands){
            list += `\n***/${cmd.name}***: *${cmd.description}*`;
        }
        return interaction.reply(list);
    },
}];
