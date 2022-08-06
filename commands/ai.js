const IMAGES_PER_QUERY = 1;
const AI_BACKEND_KEY = 'AI_BACKEND_KEY';

const apiFunctions = require('../functions/apiFunctions');
const storageFunctions = require('../functions/storageFunctions');
const fs = require('fs');

//https://colab.research.google.com/github/saharmor/dalle-playground/blob/main/backend/dalle_playground_backend.ipynb#scrollTo=qrRYWN7qTioY

module.exports = [{
    name: 'setbackend',
    permissions: ['ADMINISTRATOR'],
    description: 'Set DALL-E backend URL',
    async execute(robot, message, args, options) {
        if(!args[0]) return message.reply('Specify backend!');
        let backend = args[0];
        if(!backend.includes('http'))  return message.reply('Invalid backend!');
        await storageFunctions.setBotDataAsync(robot, AI_BACKEND_KEY, backend);

        message.react('🔍');
        console.log('Backend set');
    }
},{
    name: 'dalle',
    description: 'Have DALL-E generate an image',
    async execute(robot, message, args, options) {
        if(!args[0]) return message.reply('Specify text!');
        let text = args.join(' ');

        // Check that backend is up
        let backendUrl = await storageFunctions.getBotDataAsync(robot, AI_BACKEND_KEY);
        let status = await apiFunctions.getAsync(robot, backendUrl, null, true);
        if(!status || !status.success) return message.reply('Backend is currently down! \nYou\'ll have to use https://huggingface.co/spaces/dalle-mini/dalle-mini like a pleb.');

        message.reply('Generating images...');
        let response = await apiFunctions.postAsync(robot, `${backendUrl}/dalle`, JSON.stringify({text, num_images: IMAGES_PER_QUERY}));
        if(!response || response.status != 200) return message.reply('Error retrieving images!');

        const fileNames = [];
        response.data.forEach((base64Raw, index) => {
            const base64Data = base64Raw.replace(/^data:image\/png;base64,/, "");
            const fileName = `images/dalle${index}.png`;
            fs.writeFileSync(fileName, base64Data, {encoding: 'base64', flag: 'w' }, function(err) {
                console.log(err);
            });
            fileNames.push(fileName);
        });

        message.reply(text, {files: fileNames});
    },
}];
