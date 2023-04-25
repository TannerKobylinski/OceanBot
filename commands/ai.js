const apiFunctions = require('../functions/apiFunctions');
const aiFunctions = require('../functions/aiFunctions');

module.exports = [{
    name: 'chat',
    description: 'Talk to chatgpt',
    options: [
        {
            "name": "prompt",
            "description": "message to send",
            "type": 3,
            "required": true,
        }
    ],
    async execute(robot, interaction) {
        try {
            const prompt = interaction.options.getString('prompt');
            await interaction.deferReply();

            const aiResp = await aiFunctions.chatAi(robot, prompt);
            const reply = `> *${prompt}* (*$${aiResp.cost}*)\n${aiResp.response}`;
            await interaction.editReply(reply.slice(0,1999));
        }
        catch (error) {
            console.log(error);
            interaction.editReply('Issue with OpenAI API :(');
        }
    },
},{
    name: 'image',
    description: 'Generate an image',
    options: [
        {
            "name": "prompt",
            "description": "description of image",
            "type": 3,
            "required": true,
        }
    ],
    async execute(robot, interaction) {
        try {
            const prompt = interaction.options.getString('prompt');
            await interaction.deferReply();

            const aiResp = await aiFunctions.imageAi(robot, prompt);
            await interaction.channel.send(`***${prompt}*** *($0.018)*`);
            await interaction.editReply(`${aiResp}`);

            const filename = prompt.slice(0,50).replace(/[^a-z0-9]/gi, '_').toLowerCase()
            if(interaction.user.id === '163119583304089600') await apiFunctions.downloadImageAsync(robot, aiResp, filename, prompt);
        }
        catch (error) {
            console.log(error);
            if(error.response.status === 400) interaction.editReply('Prompt not accepted :(');
            else if(error.response) interaction.editReply('Issue with API :(');
        }
    },
}];

