const fs = require("fs");
const path = require("path");
const ytdl = require("ytdl-core");
const say = require('say')
const storageFunctions = require('../functions/storageFunctions');

const AUDIO_EXT_REGEX = /\.wav|\.mp3$/i;
const LONG_AUDIO_BYTES_THRESHOLD = 2000 * 1024; // 2kB
const YOUTUBE_STREAM_OPTIONS = { seek: 0, volume: .35 };

module.exports = {
    getBaseAudioObj: function(name, isLinked){
        return {
            name,
            ext: '',
            path: isLinked? name : null,
            size: 0,
            inDirectory: false,
            fullname: isLinked? name : null,
            length: 0,
            isLinked
        }
    },

    queueAudio: function(robot, voiceChannel, audio, message, leaveAfter){
        console.log(`queueing audio ${audio.name}`);
        const audioMeta = {
            channel: voiceChannel,
            message,
            audio,
            leaveAfter,
        };
        const guild = voiceChannel.guild.id;
        if(!robot.audioQueues[guild]) robot.audioQueues[guild] = [];
        const playAudioAfter = robot.audioQueues[guild].length == 0;
        robot.audioQueues[guild].push(audioMeta);
        console.log(`Queue: ${robot.audioQueues[guild].length}, ${JSON.stringify(robot.audioQueues[guild])}`);
        if(playAudioAfter) this.playAudio(robot, guild);
    },

    playAudio: async function(robot, guild){
        console.log(`playAudio with ${robot.audioQueues[guild].length} audios to play`);
        if(!robot.audioQueues[guild] || robot.audioQueues[guild].length == 0) return;
        let audioItem = robot.audioQueues[guild][0];
        console.log(`Popping ${audioItem.audio.name}`);

        // STORE LAST PLAYED
        if(!audioItem.audio.isTTS) {
            const serverData = await storageFunctions.getServerDataAsync(robot, audioItem.channel.guild.id,);
            serverData.lastAudio = audioItem.audio;
            await storageFunctions.setServerDataAsync(robot, audioItem.channel.guild.id, serverData);
        }

        return audioItem.channel.join().then(connection => {

            if(audioItem.message) audioItem.message.reply(`playing *${audioItem.audio.fullname}${audioItem.audio.ext}*`);

            let dispatcher;
            if(audioItem.audio.isLinked) {
                const stream = ytdl(audioItem.audio.url, { filter: 'audioonly' });
                dispatcher = connection.play(stream, YOUTUBE_STREAM_OPTIONS);
            }
            else {
                dispatcher = connection.play(`${audioItem.audio.path}`);
            }
            robot.dispatchers[guild] = dispatcher;

            dispatcher.on('start', () => {
                console.log(`Playing audio "${audioItem.audio.fullname}"`);
            });
            dispatcher.on('end', (end) => {
                console.log(end);
            });
            dispatcher.on('error', (error) => {
                console.error(error);
                audioItem.message.reply(`error playing *${audioItem.audio.fullname}${audioItem.audio.ext}*`);
                dispatcher.emit('finish');
            });
            dispatcher.on('finish', () => {
                robot.audioQueues[guild].shift();
                if(robot.audioQueues[guild].length > 0) {
                    console.log('Playing next audio.');
                    this.playAudio(robot, guild);
                }
                else if(audioItem.leaveAfter) audioItem.channel.leave();
                if(audioItem.audio.isTTS){
                    fs.unlink(audioItem.audio.path, ()=>console.log(`${audioItem.audio.name} deleted`));
                }
            });
        })
        .catch(err => {
            console.log(err);
        });
    },

    selectAudio: function(audioObjects, phrases){
        let results = this.getMatchingAudio(audioObjects, phrases);
        if(results.length < 1) return null;
        let index=Math.floor(Math.random() * results.length);
        return results[index]; // TODO: enhance audio selection
    },

    audioMatch(audio, args){ //check if audio object matches phrases
        for(let a of args){
            let options = a.split(',');
            let matched = false;
            for(let o of options){
                if(audio.fullname.toLowerCase().match(o.toLowerCase())){
                    matched = true;
                    break;
                }
            }
            if(!matched) return null;
        }
        return true;
    },

    getMatchingAudio: function(audioObjects, args){
        let results = [];
        if(!args || args.length ==0){ //get small clips for 'random' plays
            for(let a of audioObjects){
                if(a.size < LONG_AUDIO_BYTES_THRESHOLD) results.push(a);
            }
        }
        else {
            for(let a of audioObjects){
                let matched = this.audioMatch(a, args);
                if(matched) results.push(a);
            }
        }
        return results;
    },

    getAudioFiles: function(path){
        let audios = this.getAudioFilesRecursive(path, null, path.length);
        //move nested audio to top
        audios = audios.sort((a,b) => {
            let aSortName = `${a.inDirectory? " ":""}${a.fullname}`;
            let bSortName = `${b.inDirectory? " ":""}${b.fullname}`;
            return aSortName.localeCompare(bSortName);
        });
        return audios;
    },

    getAudioFilesRecursive: function(dirPath, arrayOfFiles, libraryPathLength, recursive){
        files = fs.readdirSync(dirPath);

        arrayOfFiles = arrayOfFiles || [];

        files.forEach((file) =>{
            let newPath = dirPath + "/" + file;
            if (fs.statSync(newPath).isDirectory()) {
                arrayOfFiles = this.getAudioFilesRecursive(newPath, arrayOfFiles, libraryPathLength, true);
            }
            else {
                let ext = path.extname(file);
                if(ext.match(AUDIO_EXT_REGEX)){
                    let fileName = file.substring(0, file.length-ext.length);
                    let fileObj = this.getBaseAudioObj(fileName);
                    const stats = fs.statSync(newPath);
                    fileObj.ext = ext;
                    fileObj.path = newPath.replace(/\\/g, "/");
                    fileObj.size = stats.size;
                    fileObj.inDirectory = recursive;
                    fileObj.fullname = fileObj.path.substr(libraryPathLength+1, fileObj.path.length-libraryPathLength-1-fileObj.ext.length);
                    arrayOfFiles.push(fileObj);
                }
                else return arrayOfFiles;
            }
        })
        return arrayOfFiles;
    },

    queueTTS: function(robot, message, voiceChannel, text){
        const ttsFile = `recordings\\${message.id}_tts.wav`;
        say.export(text, 'Microsoft Zira Desktop', 1, ttsFile, (err) => {
            const title = text.length > 15 ? `${text.slice(0,15)}...` : text;
            const audio = this.getBaseAudioObj(title);
            audio.ext = '';
            audio.path = `${robot.directory}\\${ttsFile}`;
            audio.fullname = title;
            audio.caption = text;
            audio.isTTS = true;
            this.queueAudio(robot, voiceChannel, audio, message);
        });
    },

    incrementPlayCount: async function(robot, fileName){
        let meta = await storageFunctions.getAudioMetadataAsync(robot);
        if(!meta[fileName]) meta[fileName] = {};

        let plays = meta[fileName].plays || 0;
        meta[fileName].plays = plays+1;
        await storageFunctions.setAudioMetadataAsync(robot, meta);
    },

    setCreatedDate: async function(robot, audioFiles){
        let meta = await storageFunctions.getAudioMetadataAsync(robot);
        for(let audio of audioFiles){
            if(!meta[audio.name]) meta[audio.name] = {};
            if(!meta[audio.name].created){
                const created = fs.statSync(audio.path).birthtime;
                meta[audio.name].created = created;
            }
        }
        // for(const [key, value] of Object.entries(meta)){
        //     if(!value.created) delete meta[key]; //remove metadata that doesn't exist, uncomment for cleanup
        // }
        await storageFunctions.setAudioMetadataAsync(robot, meta);
    }
}
