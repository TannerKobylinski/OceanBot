const ytdl = require("ytdl-core");
const storageFunctions = require('../functions/storageFunctions');
const audioFunctions = require('../functions/audioFunctions');
const helperFunctions = require('../functions/helperFunctions');
const audioReactFunctions = require('../functions/audioReactFunctions');

const MSG_CD = 1000;
const MAX_AUDIO_QUEUE_LENGTH = 25;
const TOP_AUDIO_PLAYS_LENGTH = 15;
const RECENT_AUDIO_LENGTH = 15;
const YOUTUBE_REGEX = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/;

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

        // CHECK FOR YOUTUBE LINK
        const isLinkedAudio = args[0] && args[0].match(YOUTUBE_REGEX);

        let audio;

        // HANDLE LOCAL AUDIO REQUEST
        if(!isLinkedAudio){

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
            audio = audioFunctions.selectAudio(allAudio, args);
            if(!audio) return message.reply("Audio not found!");

            // DON'T LET QUEUE GET TOO BIG
            if(robot.audioQueues[serverId] && robot.audioQueues[serverId].length >= MAX_AUDIO_QUEUE_LENGTH) return message.reply('Audio queue limit reached!');

            // PLAY THE AUDIO
            if(robot.audioQueues[serverId] && robot.audioQueues[serverId].length > 0) message.reply(`queueing *${audio.fullname}${audio.ext}*`);
            await audioFunctions.incrementPlayCount(robot, audio.name);
            audioFunctions.queueAudio(robot, voiceChannel, audio, message);
        }
        else {
            try {
                const stream = ytdl(args[0], { filter: 'audioonly' });
                stream.on('info', (info) => {
                    if(info && info.videoDetails && info.videoDetails.title) {
                        audio = audioFunctions.getBaseAudioObj(args[0], isLinkedAudio);
                        audio.url = info.videoDetails.video_url;
                        audio.name = info.videoDetails.title;
                        audio.length = info.videoDetails.lengthSeconds;
                        audio.fullname = audio.name;
                        const minutes = Math.floor(audio.length / 60);
                        const hours = audio.length - minutes * 60;
                        if(robot.audioQueues[serverId] && robot.audioQueues[serverId].length > 0) message.reply(`queueing *${audio.name}${audio.ext}* (${minutes}:${hours})`);
                        audioFunctions.queueAudio(robot, voiceChannel, audio, message);
                        return;
                    }
                });
                stream.on('error', (err) => {
                    console.error(err);
                    message.reply(`trouble playing <${args[0]}>`);
                })
            }
            catch(err){
                console.error(err);
                message.reply(`trouble playing <${args[0]}>`);
            }
        }
    }
},{
    name: 'pause',
    description: 'Pause audio playback',
    async execute(robot, message, args, options) {
        const guild = message.channel.guild.id;
        if(!robot.dispatchers[guild]) return message.reply("No audio playing!");
        return robot.dispatchers[guild].pause(true);
    }
},{
    name: 'unpause',
    description: 'Unpause audio playback',
    async execute(robot, message, args, options) {
        const guild = message.channel.guild.id;
        if(!robot.dispatchers[guild]) return message.reply("No audio playing!");
        return robot.dispatchers[guild].resume();
    }
},{
    name: 'stop',
    description: 'Stop audio playback',
    async execute(robot, message, args, options) {
        const guild = message.channel.guild.id;
        if(!robot.dispatchers[guild]) return message.reply("No audio playing!");
        robot.audioQueues[guild] = [];
        return robot.dispatchers[guild].destroy();
    }
},{
    name: 'skip',
    description: 'Skip to next audio',
    async execute(robot, message, args, options) {
        const guild = message.channel.guild.id;
        if(!robot.dispatchers[guild]) return message.reply("No audio playing!");
        robot.dispatchers[guild].emit('finish');
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
            message.reply("No audio to replay! Picking randomly!");
        }
        await audioFunctions.incrementPlayCount(robot, audio.name);
        message.reply(`queueing *${audio.fullname}${audio.ext}*`);
        audioFunctions.queueAudio(robot, voiceChannel, audio, message);
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
            if(args.length > 0){
                for(file of audios){
                    list += `\n${file.fullname}`;
                }
            }
            else {
                let lastFolder = '';
                for(file of audios){
                    if(file.inDirectory) {
                        let folderName = file.fullname.split('/')[0];
                        if(folderName === lastFolder) continue;
                        lastFolder = folderName;
                        list += `\n**/${folderName}/**`;
                    }
                    else list += `\n*${file.fullname}*`;
                }
            }
            return helperFunctions.messageReplyLong(message, list);
        }
        else {
            return message.reply('No matching audio!')
        }
    }
},{
    name: 'index',
    permissions: ['DEVELOPER'],
    description: 'Index all audio files, update list',
    async execute(robot, message, args, options) {
        const audioFiles = audioFunctions.getAudioFiles(robot.AUDIO_PATH);
        audioFunctions.setCreatedDate(robot, audioFiles);
        robot.audioFiles = audioFiles;
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
    permissions: ['DEVELOPER'],
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
},{
    name: 'tts',
    description: 'Text to speech',
    async execute(robot, message, args, options) {

        // CHECK FOR PERMISSIONS
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply("You must be in a voice channel!");
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) return message.channel.send("I need the permissions to join and speak in your voice channel!");

        const text = args.join(' ');

        message.reply('queuing TTS');
        audioFunctions.queueTTS(robot, message, voiceChannel, text);
    }
},{
    name: '112',
    description: 'Play the most inspirational video of all time',
    async execute(robot, message, args, options) {
        const playExec = module.exports.find(cmd => cmd.name == 'play');
        if(!playExec) return;
        args = ['https://www.youtube.com/watch?v=oYmqJl4MoNI'];
        playExec.execute(robot, message, args, options);
    }
},{
    name: 'numplays',
    description: 'Show the top played audios',
    async execute(robot, message, args, options) {
        const metadata = await storageFunctions.getAudioMetadataAsync(robot);
        const kvs = Object.entries(metadata);
        if(!metadata || !kvs || kvs.length < 1) message.reply('Issue gathering metadata!');

        kvs.sort((a,b) => b[1].plays - a[1].plays);
        let size = Math.min(TOP_AUDIO_PLAYS_LENGTH, kvs.length);
        let list = `Top ${size} audios:`;
        for(let i=0; i<size; i++){
            let audio = kvs[i];
            list += `\n${i==0?'>>> ':''}*${audio[0]}* - [${audio[1].plays} plays]`;
        }
        message.reply(list);
    }
},{
    name: 'recent',
    description: 'Show the most recently added audios',
    async execute(robot, message, args, options) {
        const metadata = await storageFunctions.getAudioMetadataAsync(robot);
        const kvs = Object.entries(metadata);
        if(!metadata || !kvs || kvs.length < 1) message.reply('Issue gathering metadata!');

        kvs.sort((a,b) => new Date(b[1].created) - new Date(a[1].created));
        let size = Math.min(RECENT_AUDIO_LENGTH, kvs.length);
        let list = `Last ${size} audios added:`;
        for(let i=0; i<size; i++){
            let audio = kvs[i];
            list += `\n${i==0?'>>> ':''}***${audio[0]}*** - ${new Date(audio[1].created).toLocaleDateString()}`;
        }
        message.reply(list);
    }
},{
    name: 'queue',
    description: 'Show the contents of the queue',
    async execute(robot, message, args, options) {
        const serverId = message.channel.guild.id;
        const queue = robot.audioQueues[serverId];

        if(!queue || queue.length === 0) return message.reply('Queue is empty!');

        let msg = 'Audio queue: ';
        for(let i=0; i<queue.length; i++){
            const audio = queue[i];
            msg += `\n${i==0?'>>> ':''}${i+1}. *${audio.audio.fullname}*${i==0?' [PLAYING]':''}`;
        }
        return message.reply(msg);
    }
}];

