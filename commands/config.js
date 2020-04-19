module.exports = {
    name: 'prefix',
    description: 'View or set command prefix',
    async execute(message, storage, args) {
        if(args[0]){
            let pre = args[0].trim();
            console.log('Setting prefix to ', pre);
            await storage.setItem('BOT_PREFIX', pre);
        }
        let set = await storage.getItem('BOT_PREFIX');
        message.channel.send(`Command prefix set to ${set}`);
    },
};