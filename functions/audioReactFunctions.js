const fs = require('fs');
const stringSimilarity = require("string-similarity");
const audioFunctions = require('./audioFunctions');

const encoding = 'LINEAR16';
const sampleRateHertz = 48000;
const languageCode = 'en-US';

module.exports = {
    syncRecognize: async function(robot, filename){

        // Creates a client
        const client = new robot.speech.SpeechClient();
        const config = {
            encoding: encoding,
            sampleRateHertz: sampleRateHertz,
            languageCode: languageCode,
            audioChannelCount: 2,
            sampleRateHertz: 48000,
            enableAutomaticPunctuation: false
        };
        const audio = {
            content: fs.readFileSync(filename).toString('base64'),
        };
        const request = {
            config: config,
            audio: audio,
        };

        // Detects speech in the audio file
        const [response] = await client.recognize(request);
        const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join(' ');
        return transcription;
    },

    userListenLoop: function(robot, message){
        const user = message.member.user;
        const path = `recordings/${user.id}`;

        const voiceChannel = message.member.voice.channel;
        voiceChannel.join().then((connection) => {
            const audio = connection.receiver.createStream(user, { mode: 'pcm' });
            audio.on('end', async()=> {
                if(!robot.listening[user.id]) return;
                let transcription = await this.syncRecognize(robot, path);

                if(!robot.audioFiles) robot.audioFiles = audioFunctions.getAudioFiles(robot.AUDIO_PATH);
                let audios = robot.audioFiles;
                let selectedAudio = this.transcriptionToAudio(audios, transcription);
                if(selectedAudio){
                    audioFunctions.queueAudio(robot, voiceChannel, selectedAudio, null);
                }

                this.userListenLoop(robot, message, connection); //continue looping!
            });
            audio.pipe(fs.createWriteStream(path));
        });
    },

    transcriptionToAudio: function (audioObjects, transcription){
        allAudio = audioObjects.slice(); //copy by value
        transcription = transcription.toLowerCase().replace(/['",!?.]/g, '');
        console.log(transcription);
        let words = transcription.split(/\s+/);
        words.sort((a,b) => b.length - a.length);

        for(let a of allAudio){
            a.score = 0;
            a.matchedWords = [];

            for(let w of words){
                w = w.toLowerCase();
                let matchOn = a.fullname.split(/[\s\-\/]/);
                if(matchOn.includes(w)){
                    if(!a.matchedWords.includes(w)){
                        a.matchedWords.push(w);
                        a.score += w.length;
                    }
                }
            }
        }
        allAudio.sort((a,b) => b.score - a.score);

        const SCORE_THRESHOLD = 5;
        let bestAudio = allAudio[0];
        console.log(`Best audio is ${bestAudio.fullname} with a score of ${bestAudio.score}`);
        console.log(bestAudio.matchedWords);
        if(bestAudio.score > SCORE_THRESHOLD) return bestAudio;
        return null;
    },

    transcriptionToAudio2: function (audioObjects, transcription){
        allAudio = audioObjects.slice(); //copy by value
        transcription = transcription.toLowerCase().replace(/['",!?.]/g, ''); //remove punctuation bc speech2text api sucks
        let transcriptionWords = transcription.split(/\s+/);

        console.log(transcription);

        for(let a of allAudio){
            a.score = 0;
            a.matchedWords = [];

            let audioFileWords = a.fullname.split(/[^\w]/);
            a.score = similarityScore(audioFileWords, transcriptionWords);
        }
        allAudio.sort((a,b) => b.score - a.score);

        const SCORE_THRESHOLD = 5;
        let bestAudio = allAudio[0];
        console.log(`Best audio is ${bestAudio.fullname} with a score of ${bestAudio.score}`);
        console.log(bestAudio.matchedWords);
        if(bestAudio.score > SCORE_THRESHOLD) return bestAudio;
        return null;
    },

    similarityScore: function(a1, a2){ //strings as arrays of words - checking a2 against differing a1s
        let score = 0;
        const maxScore = 0.0 + a1.concat().length;
        // let a2Sorted = a2.slice().sort((a,b) => b.length - a.length);

        for(let w1 of a1){
            let bestScore = 0;
            for(let w2 of a2){
                let simScore = stringSimilarity.compareTwoStrings(w1, w2);
                let wordScore = simScore*w1.length;
            }
        }


        // for(let w of words){
        //     w = w.toLowerCase();
        //     let matchOn = a.fullname.split(/[\s\-\/]/);
        //     if(matchOn.includes(w)){
        //         if(!a.matchedWords.includes(w)){
        //             a.matchedWords.push(w);
        //             score += w.length;
        //         }
        //     }
        // }
        return score / maxScore;
    },

    stringMatch: function(s1, s2){


    }
}
