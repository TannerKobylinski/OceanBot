const reactFunctions = require('../functions/reactFunctions');
const { getMessageReferenced } = require('../functions/utils');

module.exports = [{
    name: 'react',
    description: 'React to the latest channel message with the given characters',
    async execute(robot, message, args, options) {
        let messageToReactTo = await getMessageReferenced(message); //grab referenced message if it exists

        if(messageToReactTo.id == message.id) { //if we didnt get referenced message, find last message in channel
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
            let letters = reactFunctions.getReactableLetters(reactLetters, true);
            if(letters) {
                if(letters.length > 20) letters = letters.slice(0, 20);
                console.info(`${message.author.username} reacting to ${messageToReactTo.content}`);
                await reactFunctions.reactToMessageWithLetters(messageToReactTo, letters);
            }
        }
        message.delete().then(msg => console.log(`Deleted message from ${msg.author.username}`)).catch(err => {
            console.info(`Unable to delete react message in ${message.guild.name}`);
        });
    }
}];
