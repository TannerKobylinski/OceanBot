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



// const IMAGES_PER_QUERY = 1;
// const AI_BACKEND_KEY = 'AI_BACKEND_KEY';

// const apiFunctions = require('../functions/apiFunctions');
// const storageFunctions = require('../functions/storageFunctions');
// const fs = require('fs');

// //https://colab.research.google.com/github/saharmor/dalle-playground/blob/main/backend/dalle_playground_backend.ipynb#scrollTo=qrRYWN7qTioY

// module.exports = [{
//     name: 'setbackend',
//     disabled: true,
//     permissions: ['DEVELOPER'],
//     description: 'Set DALL-E backend URL',
//     async execute(robot, message) {
//         if(!args[0]) return message.reply('Specify backend!');
//         let backend = args[0];
//         if(!backend.includes('http'))  return message.reply('Invalid backend!');
//         await storageFunctions.setBotDataAsync(robot, AI_BACKEND_KEY, backend);

//         message.react('🔍');
//         console.log('Backend set');
//     }
// },{
//     name: 'dalle',
//     disabled: true,
//     description: 'Have DALL-E generate an image',
//     async execute(robot, message) {
//         if(!args[0]) return message.reply('Specify text!');
//         let text = args.join(' ');

//         // Check that backend is up
//         let backendUrl = await storageFunctions.getBotDataAsync(robot, AI_BACKEND_KEY);
//         let status = await apiFunctions.getAsync(robot, backendUrl, null, true);
//         if(!status || !status.success) return message.reply('Backend is currently down! \nYou\'ll have to use https://huggingface.co/spaces/dalle-mini/dalle-mini like a pleb.');

//         message.reply('Generating images...');
//         let response = await apiFunctions.postAsync(robot, `${backendUrl}/dalle`, JSON.stringify({text, num_images: IMAGES_PER_QUERY}));
//         if(!response || response.status != 200) return message.reply('Error retrieving images!');

//         const fileNames = [];
//         response.data.forEach((base64Raw, index) => {
//             const base64Data = base64Raw.replace(/^data:image\/png;base64,/, "");
//             const fileName = `images/dalle${index}.png`;
//             fs.writeFileSync(fileName, base64Data, {encoding: 'base64', flag: 'w' }, function(err) {
//                 console.log(err);
//             });
//             fileNames.push(fileName);
//         });

//         message.reply(text, {files: fileNames});
//     },
// }];


// const { Configuration, OpenAIApi } = require("openai");
// const configuration = new Configuration({
//     apiKey: process.env['OPENAI_API_KEY'],
// });
// const openai = new OpenAIApi(configuration);


            // curl https://api.openai.com/v1/chat/completions \
            // -H "Content-Type: application/json" \
            // -H "Authorization: Bearer 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" \
            // -d '{
            //     "model": "gpt-3.5-turbo",
            //     "messages": [{"role": "user", "content": "Hello!"}]
            // }'



            // const completion = await openai.createCompletion({
            //     model: "text-davinci-003",
            //     prompt: prompt
            // });
            // const response = completion.data.choices[0].text;
            // console.log(response);
            // interaction.reply(response)