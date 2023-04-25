const reactFunctions = require('../functions/reactFunctions');

module.exports = [{
    name: 'react',
    description: 'React to the latest channel message with the given alphabet characters',
    type: 1,
    options: [
        {
            "name": "phrase",
            "description": "Phrase to react with",
            "type": 3,
            "required": false,
        },
        {
            "name": "message_id",
            "description": "Message to react to",
            "type": 3,
            "required": false,
        }
    ],
    async execute(robot, interaction) {
        let phrase = interaction.options.getString('phrase');
        let messageId = interaction.options.getString('message_id');
        let messageToReactTo;

        if(messageId) {
            messageToReactTo = await interaction.channel.messages.fetch(messageId);
        }
        else {
            let messages = await interaction.channel.messages.fetch({ limit: 1 });
            messageToReactTo = messages.last();
        }
        // React to message if retrieved
        if(!messageToReactTo) return;
        await interaction.deferReply();

        if(!phrase || phrase.length < 1){
            console.info(`${interaction.user.username} reacting to ${messageToReactTo.content}`);
            reactFunctions.reactWithRandomEmoji(messageToReactTo);
        }
        else {
            const reactLetters = phrase.split(/\s+/).join('');
            console.log(reactLetters);
            let letters = reactFunctions.getReactableLetters(reactLetters, true);
            if(!letters) return interaction.editReply('Invalid phrase! Must be alphabet characters!');
            if(letters) {
                if(letters.length > 20) letters = letters.slice(0, 20);
                console.info(`${interaction.user.username} reacting to ${messageToReactTo.content}`);
                await reactFunctions.reactToMessageWithLetters(messageToReactTo, letters);
            }
        }
        await interaction.editReply(':)', {ephemeral: true});
        await interaction.deleteReply();
    }
}];
