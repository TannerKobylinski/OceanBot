const fs = require("fs");
const path = require("path");
const MSG_CD = 1000;
const AUDIO_EXT_REGEX = /\.wav|\.mp3$/i;

module.exports = [{
    name: 'play',
    description: 'Play audio files',
    async execute(robot, message, args, options) {
        const samplePath = process.env.SAMPLE_PATH;
        const voiceChannel = message.member.voice.channel;
        if(!robot.audioFiles) robot.audioFiles = getAllAudioFiles(samplePath);
        const allAudio = robot.audioFiles;

        if(!args[0]) return message.reply("No audio specified!");

        if (!voiceChannel) return message.reply("You must be in a voice channel!");

        let search = args[0];
        let audio = selectAudio(allAudio, search);
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
    description: 'List all audio that can be played',
    async execute(robot, message, args, options) {
        const samplePath = process.env.SAMPLE_PATH;
        if(!robot.audioFiles) robot.audioFiles = getAllAudioFiles(samplePath);
        let list = '**Audio Files:**';
        for(file of robot.audioFiles){
            list += `\n${file.name}*${file.ext}*`;
        }
        return message.reply(list);
    }
},{
    name: 'reindex',
    description: 'Re-index all audio files',
    async execute(robot, message, args, options) {
        const samplePath = process.env.SAMPLE_PATH;
        robot.audioFiles = getAllAudioFiles(samplePath);
    }
}];

function selectAudio(audioObjects, phrase){
    let results = [];
    for(let a of audioObjects){
        if(a.name.match(phrase)){
            results.push(a);
        }
    }
    if(results.length < 1) return null;
    let index=Math.floor(Math.random() * results.length);
    return results[index]; // TODO: enhance audio selection
}

function getAllAudioFiles(dirPath, arrayOfFiles){
    files = fs.readdirSync(dirPath)

    arrayOfFiles = arrayOfFiles || []

    files.forEach(function(file) {
        let newPath = dirPath + "/" + file;
        if (fs.statSync(newPath).isDirectory()) {
            arrayOfFiles = getAllAudioFiles(newPath, arrayOfFiles)
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
