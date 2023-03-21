const ytdl = require("ytdl-core");
const { PermissionsBitField } = require('discord.js');

const storageFunctions = require('../functions/storageFunctions');
const audioFunctions = require('../functions/audioFunctions');
const helperFunctions = require('../functions/helperFunctions');
const audioReactFunctions = require('../functions/audioReactFunctions');
const { AudioPlayerStatus } = require("@discordjs/voice");

const MSG_CD = 1000;
const MAX_AUDIO_QUEUE_LENGTH = 25;
const TOP_AUDIO_PLAYS_LENGTH = 15;
const RECENT_AUDIO_LENGTH = 15;
const YOUTUBE_REGEX = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/;

module.exports = [{
    name: 'play',
    description: 'Play audio files',
    options: [
        {
            "name": "keywords",
            "description": "keywords in audio name to look for",
            "type": 3,
            "required": false,
        },
        {
            "name": "url",
            "description": "YouTube URL",
            "type": 3,
            "required": false,
        }
    ],
    async execute(robot, interaction) {
        const serverId = interaction.guild.id;

        // CHECK FOR PERMISSIONS
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) return interaction.reply("You must be in a voice channel!");
        const permissions = voiceChannel.permissionsFor(interaction.client.user);
        if (!permissions.has(PermissionsBitField.Flags.Connect) || !permissions.has(PermissionsBitField.Flags.Speak)) {
            return interaction.reply("I need the permissions to join and speak in your voice channel!");
        }

        let keywords = (interaction.options.getString('keywords') || '').split(/\s+/);
        let youtubeUrl = interaction.options.getString('url');

        let audio;

        // HANDLE LOCAL AUDIO REQUEST
        if(!youtubeUrl){

            // STORE LAST KEYWORDS FOR RETRY COMMAND
            let serverData = await storageFunctions.getServerDataAsync(robot, serverId);
            if(keywords.length > 0){
                serverData.lastPlayArgs = keywords;
                await storageFunctions.setServerDataAsync(robot, serverId, serverData);
            }

            // GET ALL AVAILABLE AUDIO
            if(!robot.audioFiles) robot.audioFiles = audioFunctions.getAudioFiles(robot.AUDIO_PATH);
            const allAudio = robot.audioFiles;

            // SELECT THE AUDIO
            console.log(`${interaction.member.user.username} wants to play ${keywords.length>0? keywords.join(' ') : 'RANDOM'}`);
            audio = audioFunctions.selectAudio(allAudio, keywords);
            if(!audio) return interaction.reply("Audio not found!");

            // DON'T LET QUEUE GET TOO BIG
            if(robot.audioQueues[serverId] && robot.audioQueues[serverId].length >= MAX_AUDIO_QUEUE_LENGTH) return interaction.reply('Audio queue limit reached!');

            // QUEUE THE AUDIO
            if(robot.audioQueues[serverId] && robot.audioQueues[serverId].length > 0) {
                interaction.reply(`queueing *${audio.fullname}${audio.ext}*`);
            }
            else {
                interaction.reply(`playing *${audio.fullname}${audio.ext}*`);
                interaction.sentPlaying = true;
            }

            await audioFunctions.incrementPlayCount(robot, audio.name);
            audioFunctions.queueAudio(robot, voiceChannel, audio, interaction);
        }
        else {
            if(!youtubeUrl.match(YOUTUBE_REGEX)) interaction.reply('Invalid YouTube link format');
            try {
                const stream = ytdl(youtubeUrl, { filter: 'audioonly' });
                stream.on('info', (info) => {
                    if(info && info.videoDetails && info.videoDetails.title) {
                        audio = audioFunctions.getBaseAudioObj(youtubeUrl, true);
                        audio.url = info.videoDetails.video_url;
                        audio.name = info.videoDetails.title;
                        audio.length = info.videoDetails.lengthSeconds;
                        audio.fullname = audio.name;
                        const minutes = Math.floor(audio.length / 60);
                        const hours = audio.length - minutes * 60;
                        if(robot.audioQueues[serverId] && robot.audioQueues[serverId].length > 0) interaction.reply(`queueing *${audio.name}${audio.ext}* (${minutes}:${hours})`);
                        else {
                            interaction.reply(`playing *${audio.name}${audio.ext}* (${minutes}:${hours})`);
                            interaction.sentPlaying = true;
                        }
                        audioFunctions.queueAudio(robot, voiceChannel, audio, interaction);
                        return;
                    }
                });
                stream.on('error', (err) => {
                    console.error(err);
                    interaction.reply(`trouble playing <${youtubeUrl}>`);
                })
            }
            catch(err){
                console.error(err);
                interaction.reply(`trouble playing <${youtubeUrl}>`);
            }
        }
    }
},{
    name: 'pause',
    description: 'Pause audio playback',
    async execute(robot, interaction) {
        const guild = interaction.channel.guild.id;
        const player = robot.audioPlayers[guild];
        if(!player || !player._state || !player._state.status == 'playing') return interaction.reply("No audio playing!");

        player.pause();
        await interaction.reply('**Paused**');
    }
},{
    name: 'unpause',
    description: 'Unpause audio playback',
    async execute(robot, interaction) {
        const guild = interaction.channel.guild.id;
        const player = robot.audioPlayers[guild];
        if(!player || !player._state || !player._state.status == 'paused') return interaction.reply("No audio paused!");

        player.unpause();
        await interaction.reply('**Unpaused**');
    }
},{
    name: 'stop',
    description: 'Stop audio playback, clear queue',
    async execute(robot, interaction) {
        const guild = interaction.channel.guild.id;
        const player = robot.audioPlayers[guild];
        if(!player || !player._state || !player._state.status == 'playing') return interaction.reply("No audio playing!");
        robot.audioQueues[guild] = [];

        player.stop();
        await interaction.reply('**Stopped audio, cleared queue!**');
    }
},{
    name: 'skip',
    description: 'Skip to next audio',
    async execute(robot, interaction) {
        const guild = interaction.channel.guild.id;
        const player = robot.audioPlayers[guild];
        if(!player || !player._state || !player._state.status == 'playing') return interaction.reply("No audio playing!");

        player.emit(AudioPlayerStatus.Idle);
        await interaction.reply('**Skipping**');
    }
},{
    name: 'replay',
    description: 'Replay the last audio clip played in the server',
    async execute(robot, interaction) {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) return interaction.reply("You must be in a voice channel!");
        let serverData = await storageFunctions.getServerDataAsync(robot, interaction.channel.guild.id);
        let audio = serverData.lastAudio;
        let response;
        if (!audio){
            if(!robot.audioFiles) robot.audioFiles = audioFunctions.getAudioFiles(robot.AUDIO_PATH);
            audio = audioFunctions.selectAudio(robot.audioFiles);
            response = "No audio to replay! Picking randomly!\n";
        }
        await audioFunctions.incrementPlayCount(robot, audio.name);
        interaction.reply(`${response}queueing *${audio.fullname}${audio.ext}*`);
        audioFunctions.queueAudio(robot, voiceChannel, audio, interaction);
    }
},{
    name: 'retry',
    description: 'Retry the last play command',
    async execute(robot, interaction) {
        let serverData = await storageFunctions.getServerDataAsync(robot, interaction.channel.guild.id);
        const keywords = serverData.lastPlayArgs;
        if(!keywords) return interaction.reply('No play command to retry!');
        let exec;
        for(let exp of module.exports){
            if(exp.name == 'play') exec = exp.execute(robot, interaction);
            break;
        }
    }
},{
    name: 'audio',
    description: 'List all audio that can be played. Specify additional phrases to filter.',
    options: [
        {
            "name": "keywords",
            "description": "keywords to filter for",
            "type": 3,
            "required": false,
        }
    ],
    async execute(robot, interaction) {
        if(!robot.audioFiles) robot.audioFiles = audioFunctions.getAudioFiles(robot.AUDIO_PATH);
        let audios = robot.audioFiles;
        let keywords = (interaction.options.getString('keywords') || '').split(/\s+/);
        if(keywords.length > 0){
            audios = audioFunctions.getMatchingAudio(audios, keywords);
        }
        if(audios.length > 0){
            let list = '**Audio Files:**';
            if(keywords.length > 0){
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
            return helperFunctions.messageReplyLong(interaction, list);
        }
        else {
            return interaction.reply('No matching audio!')
        }
    }
},{
    name: 'index',
    permissions: ['DEVELOPER'],
    description: 'Index all audio files, update list',
    async execute(robot, interaction) {
        const audioFiles = audioFunctions.getAudioFiles(robot.AUDIO_PATH);
        audioFunctions.setCreatedDate(robot, audioFiles);
        robot.audioFiles = audioFiles;
        interaction.reply('🔍', { ephemeral: true });
        console.log('Audio re-indexed');
    }
// },{
//     name: 'onjoin',
//     description: 'Set a join sound for yourself in this server. Specify terms like play command (Add --off to unset)',
//     async execute(robot, message) {
//         const serverId = message.channel.guild.id;
//         const userId = message.member.user.id;
//         let userData = await storageFunctions.getServerUserDataAsync(robot, serverId, userId);

//         if(!args.length && !options.length){
//             if(userData.onjoin && userData.onjoin.length>0) return message.reply(`onjoin set to ${userData.onjoin.join(' ')}`);
//             else return message.reply('no onjoin set!');
//         }
//         else if(options.includes('off')){
//             if(userData.onjoin){
//                 userData.onjoin = undefined;
//                 message.reply('onjoin unset!');
//             }
//             else return message.reply('no onjoin set!');
//         }
//         else if(args.length && !options.length){ //setting args
//             userData.onjoin = args;
//             message.reply(`onjoin set to ${args.join(' ')}`);
//         }
//         else return;
//         await storageFunctions.setServerUserDataAsync(robot, serverId, userId, userData);
//     }
// },{
//     name: 'react',
//     permissions: ['DEVELOPER'],
//     description: 'Listens and reacts to user audio (use "react stop" to cancel)',
//     async execute(robot, message) {
//         const user = message.member.user;

//         robot.listening = robot.listening || {};

//         if(args[0] == "stop"){
//             if(robot.listening[user.id]){
//                 delete robot.listening[user.id];
//                 return message.reply('stopped listening!');
//             }
//             else return message.reply('not listening!');
//         }
//         robot.listening[user.id] = true;

//         message.reply('ready to react!');
//         audioReactFunctions.userListenLoop(robot, message);
//     }
// },{
//     name: 'tts',
//     description: 'Text to speech',
//     async execute(robot, message) {

//         // CHECK FOR PERMISSIONS
//         const voiceChannel = message.member.voice.channel;
//         if (!voiceChannel) return message.reply("You must be in a voice channel!");
//         const permissions = voiceChannel.permissionsFor(message.client.user);
//         if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) return message.channel.send("I need the permissions to join and speak in your voice channel!");

//         const text = args.join(' ');

//         message.reply('queuing TTS');
//         audioFunctions.queueTTS(robot, message, voiceChannel, text);
//     }
// },{
//     name: '112',
//     description: 'Play the most inspirational video of all time',
//     async execute(robot, message) {
//         const playExec = module.exports.find(cmd => cmd.name == 'play');
//         if(!playExec) return;
//         args = ['https://www.youtube.com/watch?v=oYmqJl4MoNI'];
//         playExec.execute(robot, message);
//     }
// },{
//     name: 'numplays',
//     description: 'Show the top played audios',
//     async execute(robot, message) {
//         const metadata = await storageFunctions.getAudioMetadataAsync(robot);
//         const kvs = Object.entries(metadata);
//         if(!metadata || !kvs || kvs.length < 1) message.reply('Issue gathering metadata!');

//         kvs.sort((a,b) => b[1].plays - a[1].plays);
//         let size = Math.min(TOP_AUDIO_PLAYS_LENGTH, kvs.length);
//         let list = `Top ${size} audios:`;
//         for(let i=0; i<size; i++){
//             let audio = kvs[i];
//             list += `\n${i==0?'>>> ':''}*${audio[0]}* - [${audio[1].plays} plays]`;
//         }
//         message.reply(list);
//     }
},{
    name: 'recent',
    description: 'Show the most recently added audios',
    async execute(robot, interaction) {
        const metadata = await storageFunctions.getAudioMetadataAsync(robot);
        const kvs = Object.entries(metadata);
        if(!metadata || !kvs || kvs.length < 1) return interaction.reply('Issue gathering metadata!');

        kvs.sort((a,b) => new Date(b[1].created) - new Date(a[1].created));
        let size = Math.min(RECENT_AUDIO_LENGTH, kvs.length);
        let list = `Last ${size} audios added:`;
        for(let i=0; i<size; i++){
            let audio = kvs[i];
            list += `\n${i==0?'>>> ':''}***${audio[0]}*** - ${new Date(audio[1].created).toLocaleDateString()}`;
        }
        return interaction.reply(list);
    }
// },{
//     name: 'queue',
//     description: 'Show the contents of the queue',
//     async execute(robot, message) {
//         const serverId = message.channel.guild.id;
//         const queue = robot.audioQueues[serverId];

//         if(!queue || queue.length === 0) return message.reply('Queue is empty!');

//         let msg = 'Audio queue: ';
//         for(let i=0; i<queue.length; i++){
//             const audio = queue[i];
//             msg += `\n${i==0?'>>> ':''}${i+1}. *${audio.audio.fullname}*${i==0?' [PLAYING]':''}`;
//         }
//         return message.reply(msg);
//     }
}];

