const fs = require('fs');
const Discord = require('discord.js');
// const socketIo = require("socket.io");
const dotenv = require('dotenv');
require('log-timestamp');
const storageFunctions = require('./functions/storageFunctions');
const audioFunctions = require('./functions/audioFunctions');
const twitterFunctions = require('./functions/twitterFunctions');
const helperFunctions = require('./functions/helperFunctions');

let robot = {};
robot.storage = require('node-persist');
robot.https = require('https');
robot.axios = require('axios');
// robot.io = socketIo()


// INITIALIZE
robot.audioQueues = {};
robot.dispatchers = {};
robot.directory = __dirname;
const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const fileCommands = require(`./commands/${file}`);
    for(let cmd of fileCommands){
        client.commands.set(cmd.name, cmd);
    }
}
robot.commands = client.commands;
robot.voice = client.voice;
robot.client = client;
dotenv.config();
const BOT_TOKEN = process.env.DISCORD_TOKEN;
client.login(BOT_TOKEN);
robot.AUDIO_PATH = process.env.AUDIO_LIBRARY_PATH;
robot.speech = require('@google-cloud/speech');


// LIFECYCLE
client.on('message', async message => {
    let serverId = message.channel.guild.id;
    const BOT_PREFIX = await helperFunctions.getPrefixAsync(robot, serverId);

    // if (message.author.bot) return; //ignore bots
    if (!message.content.startsWith(BOT_PREFIX) ) { //non-command messages
        return;
    }
    if (message.content.length <= BOT_PREFIX.length) return; // ignore just the prefix itself

    const args = message.content.slice(BOT_PREFIX.length).split(/\s+/);
    const command = args.shift().toLowerCase();
    let options = [];
    for(let i=args.length-1; i>=0; i--){
        let foundOption = args[i].match(/\-\-(\w+[\1-]?\w+)/);
        if(!foundOption) continue;
        options.push(foundOption[1]);
        args.splice(i,1);
    }
    if (!client.commands.has(command)){
        return message.react('❓');
    }

    try {
        let execCommand = client.commands.get(command);
        if(memberCanExecute(message.member, execCommand)){
            execCommand.execute(robot, message, args, options).catch((error) => {
                console.error(error);
            });
        }
        else {
            console.log(`User ${message.member.name} lacks ${execCommand.permissions.join(' or ')} permissions!`);
        }
    } catch (error) {
        console.error(error);
    }
});

client.once('ready', async () => {
    await robot.storage.init();
    getConnectedServers();
    // if(twitterFunctions.areParrots(robot)){//open up twitter stream
    //     robot.twitterStream = twitterFunctions.openStream(robot);
    // }
});

client.on('voiceStateUpdate', async (oldState, newState) =>{
    let oldUserChannel = oldState.channelID;
    let newUserChannel = newState.channelID;
    let botId = client.user.id;

    if(newState.member.id == botId) return; //ignore self

    if(newUserChannel && !oldUserChannel){ //user joins, not switches channel
        await onServerJoin(client, newState);
    }
    else if(oldUserChannel && newUserChannel!=oldUserChannel){ //user left channel/server
        if(newUserChannel){
            onChannelSwitch(oldState, newState); //user switches channels
        }
        else{
            onServerLeave(oldState); //user leaves server
        }
        await leaveChannelCheck(client, oldUserChannel, newState);
    }
})


// FUNCTIONS
function playAudio(voiceChannel, args, leaveAfter){
    if(!robot.audioFiles) robot.audioFiles = audioFunctions.getAudioFiles(robot.AUDIO_PATH);
    const allAudio = robot.audioFiles;
    let audio = audioFunctions.selectAudio(allAudio, args);
    if(audio) audioFunctions.queueAudio(robot, voiceChannel, audio, null, leaveAfter);
    else console.log(`No audio found for [${args}])`);
}

function getConnectedServers(){
    let serverNames = [];
    client.guilds.cache.forEach((guild) => {
        serverNames.push(guild.name);
    })
    console.log(`Connected to ${serverNames.length} server${serverNames.length>1? 's' : ''}: ${serverNames.join(', ')}`);
}

function memberCanExecute(member, command){
    if(!command.permissions) return true;
    if(command.permissions.includes('DEVELOPER') && member.id == 163119583304089600) return true;
    for(let p of command.permissions){
        if(member.hasPermission(p)) return true;
    }
    return false;
}

function onChannelSwitch(oldState, newState){
    console.log(`${newState.member.user.username} moved from ${oldState.channel.name} to ${newState.channel.name} [${newState.guild.name}]`);
}

function onServerLeave(oldState){
    console.log(`${oldState.member.user.username} left ${oldState.channel.name} [${oldState.guild.name}]`);
}


async function leaveChannelCheck(client, oldUserChannel, newState){
    let botId = client.user.id;
    let oldChannel = client.channels.cache.get(oldUserChannel);
    let guild = await client.guilds.fetch(newState.guild.id);
    let vStatesInOldChannel = guild.voiceStates.cache.filter(c=>c.channelID==oldUserChannel);
    if(vStatesInOldChannel.has(botId) && vStatesInOldChannel.array().length == 1) {
        oldChannel.leave(); //make bot leave if last in channel
        robot.audioQueues[oldChannel.guild.id] = []; //clear any pending audio
    }
}

async function onServerJoin(client, newState){
    console.log(`${newState.member.user.username} joined ${newState.channel.name} [${newState.guild.name}]`);

    // IGNORE BOT ACCOUNTS
    const isBot = newState.member.user.bot;
    if(isBot) return;

    // ENSURE VOICECHANNEL EXISTS
    let voiceChannel = newState.member.voice.channel;
    if(!voiceChannel) return;

    // CHECK IF JOIN SOUNDS ARE ENABLED ON THE SERVER
    const serverId = newState.guild.id;
    let serverData = await storageFunctions.getServerDataAsync(robot, serverId);
    if(serverData.onjoin){

        // DETERMINE IF BOT SHOULD LEAVE AFTER AUDIO
        const botId = client.user.id;
        let botVoiceState = newState.guild.voiceStates.cache.get(botId);
        const newUserChannel = newState.channelID;
        let leaveAfter = !botVoiceState || botVoiceState.channelID != newUserChannel;

        // CHECK FOR USER SET SOUND
        const userId = newState.member.user.id;
        let userData = await storageFunctions.getServerUserDataAsync(robot, serverId, userId);
        if(userData.onjoin){
            if(robot.audioQueues[serverId] && robot.audioQueues[serverId].length > 0) return; //
            await helperFunctions.timeout(1200);
            playAudio(voiceChannel, userData.onjoin, leaveAfter);
        }
        else if(serverData.onjoin != 'on'){
            if(robot.audioQueues[serverId] && robot.audioQueues[serverId].length > 0) return;
            await helperFunctions.timeout(1200);
            playAudio(voiceChannel, serverData.onjoin.split(' '), leaveAfter);
        }
    }
}
