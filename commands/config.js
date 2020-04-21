module.exports = {
    name: 'prefix',
    description: 'View or set command prefix',
    async execute(robot, message, args) {
        if(args[0]){
            let pre = args[0].trim();
            console.log('Setting prefix to ', pre);
            await robot.storage.setItem('BOT_PREFIX', pre);
        }
        let set = await robot.storage.getItem('BOT_PREFIX');
        message.channel.send(`Command prefix set to ${set}`);
    },
};