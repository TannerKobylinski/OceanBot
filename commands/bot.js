const storageFunctions = require('../functions/storageFunctions');

module.exports = [{
    name: 'prefix',
    description: 'View or set command prefix',
    permissions: ['ADMINISTRATOR'],
    async execute(robot, message, args) {
        let server = message.channel.guild;
        let botId = message.client.user.id;
        let newPrefix = args[0];
        if(newPrefix){
            console.log(`Setting ${server.name} prefix to ${newPrefix}`);
            storageFunctions.setPrefixAsync(robot, server.id, newPrefix);

            let botMember = await message.guild.members.fetch(botId);
            await botMember.setNickname(`OceanBot (${newPrefix}help)`);
        }
        let prefix = await storageFunctions.getPrefixAsync(robot, server.id);
        message.channel.send(`Command prefix set to ${prefix}`);
    },
},{
    name: 'leave',
    description: 'Make the bot leave your voice channel',
    async execute(robot, message, args) {
        let userVoiceChannel = message.member.voice.channel;
        let botVoiceChannels = robot.voice.connections;
        let userAndBotChannels = botVoiceChannels.filter(vc => vc.channel.id == userVoiceChannel.id).array();

        if(userAndBotChannels.length > 0) userVoiceChannel.leave();
        else return message.reply('You must be in a voice channel with the bot!');
    },
}];
