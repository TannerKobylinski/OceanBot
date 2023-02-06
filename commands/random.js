
module.exports = [{
    name: 'roll',
    description: 'Roll a N sided die (e.g. *roll N*); N defaults to 6',
    async execute(robot, message, args) {
        let max = 6;
        let min = 1;
        if(args.length > 0) {
            let num = parseInt(args[0]);
            if(Number.isInteger(num)) max = num;
            else return message.reply("that's a weird number.");
        }
        let rand = Math.floor(Math.random() * (max - min + 1)) + min;
        return message.reply(`**${rand}**`);
    },
}];
