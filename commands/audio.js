const fs = require("fs");
const path = require("path");
const storageFunctions = require('../functions/storageFunctions');

const MSG_CD = 1000;
const AUDIO_EXT_REGEX = /\.wav|\.mp3$/i;
const MESSAGE_CHAR_LIMIT = 1600;

module.exports = [{
    name: 'play',
    description: 'Play audio files',
    async execute(robot, message, args, options) {
        const samplePath = process.env.SAMPLE_PATH;
        const voiceChannel = message.member.voice.channel;
        if(!robot.audioFiles) robot.audioFiles = getAudioFiles(samplePath);
        const allAudio = robot.audioFiles;

        if (!voiceChannel) return message.reply("You must be in a voice channel!");

        let audio = selectAudio(allAudio, args);
        if(!audio) return message.reply("Audio not found!");

        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) return message.channel.send("I need the permissions to join and speak in your voice channel!");

        if(!robot.cooldown){
            robot.cooldown = true;
            setTimeout((robot)=>{
                robot.cooldown = false;
            }, MSG_CD, robot);
        }
        else return;

        await incrementPlayCount(robot, audio.name);
        voiceChannel.join()
        .then(connection => {
            if(robot.dispatcher) robot.dispatcher.destroy();
            message.reply(`playing *${audio.name}${audio.ext}*`);
            const dispatcher = connection.play(`${audio.path}`);
            robot.dispatcher = dispatcher;
            dispatcher.on('start', () => {
                console.log('audio playing');
            });
            dispatcher.on('finish', () => {
                console.log('audio has finished playing!');
            });
        })
        .catch(err => {
            console.log(err);
        });
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
    name: 'audiolist',
    description: 'List all audio that can be played. Specify additional phrases to filter.',
    async execute(robot, message, args, options) {
        const samplePath = process.env.SAMPLE_PATH;
        if(!robot.audioFiles) robot.audioFiles = getAudioFiles(samplePath);
        let audios = robot.audioFiles;
        if(args.length > 0){
            audios = getMatchingAudio(audios, args);
        }
        if(audios.length > 0){
            let list = '**Audio Files:**';
            for(file of audios){
                list += `\n${file.name}*${file.ext}*`;
            }

            return messageReplyLong(message, list);
        }
        else {
            return message.reply('No matching audio!')
        }
    }
},{
    name: 'reindex',
    permissions: ['ADMINISTRATOR'],
    description: 'Re-index all audio files',
    async execute(robot, message, args, options) {
        const samplePath = process.env.SAMPLE_PATH;
        robot.audioFiles = getAudioFiles(samplePath);
        message.react('🔍');
        console.log('Audio re-indexed');
    }
},{
    name: 'record',
    permissions: ['ADMINISTRATOR'],
    description: 'Record user audio',
    async execute(robot, message, args, options) {

    }
}];

async function incrementPlayCount(robot, fileName){
    let meta = await storageFunctions.getAudioMetadataAsync(robot);
    if(!meta[fileName]) meta[fileName] = {};

    let plays = meta[fileName].plays || 0;
    meta[fileName].plays = plays+1;
    await storageFunctions.setAudioMetadataAsync(robot, meta);
}

function messageReplyLong(message, str){
    if(str.length <= MESSAGE_CHAR_LIMIT) return message.reply(str);

    let firstMessage = true;

    let lines = str.split('\n');
    let i = 0;
    let chunk = '';
    while(i < lines.length){
        let line = lines[i]+'\n';
        if(chunk.length + line.length < MESSAGE_CHAR_LIMIT){ //carefully construct chunk
            chunk += line;
            i++;
        }
        else{ //reply with full chunks
            if(firstMessage){
                message.reply(chunk)
                firstMessage=false;
            }
            else message.channel.send(chunk);
            chunk = '';
        }
    }
    if(chunk.length > 0) message.channel.send(chunk); //send last bit
}

function selectAudio(audioObjects, phrases){
    let results = getMatchingAudio(audioObjects, phrases);
    if(results.length < 1) return null;
    let index=Math.floor(Math.random() * results.length);
    return results[index]; // TODO: enhance audio selection
}

function getMatchingAudio(audioObjects, phrases){
    let results = [];
    if(!phrases || phrases.length ==0){
        results = audioObjects;
    }
    else {
        for(let a of audioObjects){
            let matched = true;
            for(let p of phrases){
                if(!a.name.toLowerCase().match(p.toLowerCase())){
                    matched = false;
                    break
                }
            }
            if(matched) results.push(a);
        }
    }
    return results
}

function getAudioFiles(path){
    let audios = getAudioFilesRecursive(path);
    audios.sort((a,b) =>{
        return a.name.localeCompare(b.name);
    });
    return audios
}

function getAudioFilesRecursive(dirPath, arrayOfFiles){
    files = fs.readdirSync(dirPath)

    arrayOfFiles = arrayOfFiles || []

    files.forEach(function(file) {
        let newPath = dirPath + "/" + file;
        if (fs.statSync(newPath).isDirectory()) {
            arrayOfFiles = getAudioFilesRecursive(newPath, arrayOfFiles)
        }
        else {
            let ext = path.extname(file);
            if(ext.match(AUDIO_EXT_REGEX)){
                let fileName = file.substring(0, file.length-ext.length)
                let fileObj = {
                    name: fileName,
                    ext: ext,
                    path: newPath.replace(/\\/g, "/")
                }
                arrayOfFiles.push(fileObj)
            }
            else return arrayOfFiles;
        }
    })

    return arrayOfFiles
}
