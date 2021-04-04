const Discord = require('discord.js');
const audioMap = require('../audiomap.json');

module.exports = {
    name: 'playaudio',
    description: 'Play audio files',
    async execute(robot, message, args, options) {
        const samplePath = process.env.SAMPLE_PATH;
        const voiceChannel = message.member.voice.channel;
        if(!args[0]) return message.reply("No audio specified!");
        if(args[0].match(/list/i)) {
            let list = '**Audio Files:**';
            for(key in audioMap){
                list += `\n${key} - *${audioMap[key]}*`;
            }
            return message.reply(list);
        }
        if(args[0].match(/stop/i)) {
            if(!robot.currentDispatcher) return message.reply("No audio playing!");
            robot.currentDispatcher.destroy();
            voiceChannel.leave();
            return;
        }
        if (!voiceChannel) return message.reply("You must be in a voice channel!");
        const audio = audioMap[args[0]];
        if(!audio) return message.reply("Audio not found!");

        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) return message.channel.send("I need the permissions to join and speak in your voice channel!");

        voiceChannel.join()
        .then(connection => {
            const dispatcher = connection.play(`${samplePath}/${audio}`);
            robot.currentDispatcher = dispatcher;
            dispatcher.on('start', () => {
                console.log('audio playing');
            });
            dispatcher.on('finish', () => {
                voiceChannel.leave();
                console.log('audio has finished playing!');
            });
        })
        .catch(err => {
            voiceChannel.leave();
            console.log(err);
        });
    }
}