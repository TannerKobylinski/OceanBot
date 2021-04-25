const fs = require('fs');
const storageFunctions = require('../functions/storageFunctions');
const audioFunctions = require('../functions/audioFunctions');
const helperFunctions = require('../functions/helperFunctions');
const audioReactFunctions = require('../functions/audioReactFunctions');

const MSG_CD = 1000;

module.exports = [{
    name: 'play',
    description: 'Play audio files',
    async execute(robot, message, args, options) {
        const serverId = message.channel.guild.id;

        // CHECK FOR PERMISSIONS
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply("You must be in a voice channel!");
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) return message.channel.send("I need the permissions to join and speak in your voice channel!");

        // STORE LAST ARGS FOR RETRY COMMAND
        let serverData = await storageFunctions.getServerDataAsync(robot, serverId);
        if(args.length > 0){
            serverData.lastPlayArgs = args;
            await storageFunctions.setServerDataAsync(robot, serverId, serverData);
        }

        // GET ALL AVAILABLE AUDIO
        if(!robot.audioFiles) robot.audioFiles = audioFunctions.getAudioFiles(robot.AUDIO_PATH);
        const allAudio = robot.audioFiles;

        // SELECT THE AUDIO
        console.log(`${message.member.user.username} wants to play ${args.length>0? args.join(' ') : 'RANDOM'}`);
        let audio = audioFunctions.selectAudio(allAudio, args);
        if(!audio) return message.reply("Audio not found!");

        // CHECK COMMAND COOLDOWN
        if(!robot.playCoolDown){
            robot.playCoolDown = true;
            setTimeout((robot)=>{
                robot.playCoolDown = false;
            }, MSG_CD, robot);
        }
        else return;

        // PLAY THE AUDIO
        message.reply(`playing *${audio.fullname}${audio.ext}*`);
        serverData.lastAudio = audio;
        await storageFunctions.setServerDataAsync(robot, serverId, serverData);
        await incrementPlayCount(robot, audio.name);
        audioFunctions.playAudio(robot, voiceChannel, audio);
    }
},{
    name: 'pause',
    description: 'Pause audio playback',
    async execute(robot, message, args, options) {
        if(!robot.dispatcher) return message.reply("No audio playing!");
        return robot.dispatcher.pause(true);
    }
},{
    name: 'unpause',
    description: 'Unpause audio playback',
    async execute(robot, message, args, options) {
        if(!robot.dispatcher) return message.reply("No audio playing!");
        return robot.dispatcher.resume();
    }
},{
    name: 'stop',
    description: 'Stop audio playback',
    async execute(robot, message, args, options) {
        if(!robot.dispatcher) return message.reply("No audio playing!");
        return robot.dispatcher.destroy();
    }
},{
    name: 'replay',
    description: 'Replay the last audio clip played in the server',
    async execute(robot, message, args, options) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply("You must be in a voice channel!");
        let serverData = await storageFunctions.getServerDataAsync(robot, message.channel.guild.id);
        let audio = serverData.lastAudio;
        if (!audio){
            if(!robot.audioFiles) robot.audioFiles = audioFunctions.getAudioFiles(robot.AUDIO_PATH);
            audio = audioFunctions.selectAudio(robot.audioFiles);
            serverData.lastAudio = audio;
            await storageFunctions.setServerDataAsync(robot, message.channel.guild.id, hisserverDatatory);
            message.reply("No audio to replay! Picking randomly!");
        }
        await incrementPlayCount(robot, audio.name);
        message.reply(`playing *${audio.fullname}${audio.ext}*`);
        audioFunctions.playAudio(robot, voiceChannel, audio);
    }
},{
    name: 'retry',
    description: 'Retry the last play command',
    async execute(robot, message, args, options) {
        let serverData = await storageFunctions.getServerDataAsync(robot, message.channel.guild.id);
        args = serverData.lastPlayArgs;
        if(!args) return message.reply('No play command to retry!');
        let exec;
        for(let exp of module.exports){
            if(exp.name == 'play') exec = exp.execute(robot, message, args, options);
            break;
        }
    }
},{
    name: 'audio',
    description: 'List all audio that can be played. Specify additional phrases to filter.',
    async execute(robot, message, args, options) {
        if(!robot.audioFiles) robot.audioFiles = audioFunctions.getAudioFiles(robot.AUDIO_PATH);
        let audios = robot.audioFiles;
        if(args.length > 0){
            audios = audioFunctions.getMatchingAudio(audios, args);
        }
        if(audios.length > 0){
            let list = '**Audio Files:**';
            for(file of audios){
                list += `\n${file.fullname}*${file.ext}*`;
            }
            return helperFunctions.messageReplyLong(message, list);
        }
        else {
            return message.reply('No matching audio!')
        }
    }
},{
    name: 'index',
    permissions: ['ADMINISTRATOR'],
    description: 'Index all audio files, update list',
    async execute(robot, message, args, options) {
        robot.audioFiles = audioFunctions.getAudioFiles(robot.AUDIO_PATH);
        message.react('🔍');
        console.log('Audio re-indexed');
    }
},{
    name: 'onjoin',
    description: 'Set a join sound for yourself in this server. Specify terms like play command (Add --off to unset)',
    async execute(robot, message, args, options) {
        const serverId = message.channel.guild.id;
        const userId = message.member.user.id;
        let userData = await storageFunctions.getServerUserDataAsync(robot, serverId, userId);

        if(!args.length && !options.length){
            if(userData.onjoin && userData.onjoin.length>0) return message.reply(`onjoin set to ${userData.onjoin.join(' ')}`);
            else return message.reply('no onjoin set!');
        }
        else if(options.includes('off')){
            if(userData.onjoin){
                userData.onjoin = undefined;
                message.reply('onjoin unset!');
            }
            else return message.reply('no onjoin set!');
        }
        else if(args.length && !options.length){ //setting args
            userData.onjoin = args;
            message.reply(`onjoin set to ${args.join(' ')}`);
        }
        else return;
        await storageFunctions.setServerUserDataAsync(robot, serverId, userId, userData);
    }
},{
    name: 'react',
    // permissions: ['ADMINISTRATOR'],
    description: 'Listens and reacts to user audio (use "react stop" to cancel)',
    async execute(robot, message, args, options) {
        const user = message.member.user;

        robot.listening = robot.listening || {};

        if(args[0] == "stop"){
            if(robot.listening[user.id]){
                delete robot.listening[user.id];
                return message.reply('stopped listening!');
            }
            else return message.reply('not listening!');
        }
        robot.listening[user.id] = true;

        message.reply('ready to react!');
        audioReactFunctions.userListenLoop(robot, message);
    }
}];


// FUNCTIONS

async function incrementPlayCount(robot, fileName){
    let meta = await storageFunctions.getAudioMetadataAsync(robot);
    if(!meta[fileName]) meta[fileName] = {};

    let plays = meta[fileName].plays || 0;
    meta[fileName].plays = plays+1;
    await storageFunctions.setAudioMetadataAsync(robot, meta);
}
