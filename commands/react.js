const reactFunctions = require('../functions/reactFunctions');

module.exports = [{
    name: 'react',
    description: 'React to the latest channel message with the given characters',
    async execute(robot, message, args, options) {
        const reference = message.reference;
        let messageToReactTo;

        // Get message to react to
        if(reference) {
            messageToReactTo = await message.channel.messages.fetch(reference.messageID);
        }
        else {
            let messages = await message.channel.messages.fetch({ limit: 2 });
            messageToReactTo = messages.last();
        }

        // React to message if retrieved
        if(!messageToReactTo) return;
        if(args.length < 1){
            console.info(`${message.author.username} reacting to ${messageToReactTo.content}`);
            reactFunctions.reactWithRandomEmoji(messageToReactTo);
        }
        else {
            const reactLetters = args.join('');
            const letters = reactFunctions.getReactableLetters(reactLetters);
            if(letters && letters.length <= 20) {
                console.info(`${message.author.username} reacting to ${messageToReactTo.content}`);
                await reactFunctions.reactToMessageWithLetters(messageToReactTo, letters);
            }
        }
        message.delete().then(msg => console.log(`Deleted message from ${msg.author.username}`)).catch(err => {
            console.info(`Unable to delete react message in ${message.guild.name}`);
        });
    }
}];