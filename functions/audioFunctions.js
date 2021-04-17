const fs = require("fs");
const path = require("path");
const AUDIO_EXT_REGEX = /\.wav|\.mp3$/i;
const LONG_AUDIO_BYTES_THRESHOLD = 2000 * 1024; // 2kB

module.exports = {

    playAudio: function(robot, voiceChannel, audio, leaveAfter){
        return voiceChannel.join().then(connection => {
            if(robot.dispatcher) robot.dispatcher.destroy();
            const dispatcher = connection.play(`${audio.path}`);
            robot.dispatcher = dispatcher;
            dispatcher.on('start', () => {
                console.log(`Playing audio ${audio.name}`);
            });
            dispatcher.on('finish', () => {
                console.log('audio has finished playing!');
                if(leaveAfter) voiceChannel.leave();
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

    audioMatch(audio, args){
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
        // audios.sort((a,b) => {
        //     return a.name.localeCompare(b.name);
        // });
        return audios;
    },

    getAudioFilesRecursive: function(dirPath, arrayOfFiles, libraryPathLength){
        files = fs.readdirSync(dirPath);

        arrayOfFiles = arrayOfFiles || [];

        files.forEach((file) =>{
            let newPath = dirPath + "/" + file;
            if (fs.statSync(newPath).isDirectory()) {
                arrayOfFiles = this.getAudioFilesRecursive(newPath, arrayOfFiles, libraryPathLength);
            }
            else {
                let ext = path.extname(file);
                if(ext.match(AUDIO_EXT_REGEX)){
                    let fileName = file.substring(0, file.length-ext.length);
                    let fileObj = {
                        name: fileName,
                        ext: ext,
                        path: newPath.replace(/\\/g, "/"),
                        size: fs.statSync(newPath).size
                    };
                    fileObj.fullname = fileObj.path.substr(libraryPathLength+1, fileObj.path.length-libraryPathLength-1-fileObj.ext.length)
                    arrayOfFiles.push(fileObj);
                }
                else return arrayOfFiles;
            }
        })
        return arrayOfFiles;
    },

    downSampleStereoToMono: function (file) { //TODO: improve downsample strategy (choosing left may not be best)
        try {
            // read stereo audio file into signed 16 array
            const data = new Int16Array(fs.readFileSync(file))

            // create new array for the mono audio data
            const ndata = new Int16Array(data.length/2)

            // copy left audio data (skip the right part)
            for (let i = 0, j = 0; i < data.length; i+=4) {
                ndata[j++] = data[i]
                ndata[j++] = data[i+1]
            }

            // save the mono audio file
            fs.writeFileSync(file, Buffer.from(ndata), 'binary')
        } catch (e) {
            console.log(e)
        }
    }
}
