
module.exports = [{
    name: 'roll',
    description: 'Roll an n-sided die, defaults to 6',
    options: [
        {
            "name": "n",
            "description": "number of sides",
            "type": 4,
            "required": false,
        }
    ],
    async execute(robot, interaction) {
        let sides = interaction.options.getInteger('n');
        let max = 6;
        let min = 1;
        if(sides) {
            if(Number.isInteger(sides)) max = sides;
            else return interaction.reply(`${sides}? that's a weird number.`);
        }
        let rand = Math.floor(Math.random() * (max - min + 1)) + min;
        return interaction.reply(`**${rand}**`);
    },
}];
