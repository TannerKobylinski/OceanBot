
async function getMessageReferenced(message){
    const reference = message.reference;
    if(!reference) return message;

    const newMessage = await message.channel.messages.fetch(reference.messageID);
    return newMessage || message;
}

module.exports = {
    getMessageReferenced
}
