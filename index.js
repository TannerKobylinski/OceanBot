const fs = require('fs');
const util = require('util');
const { Client, GatewayIntentBits, REST, Routes, Partials } = require('discord.js');
const { Guilds, GuildVoiceStates, GuildMessages, DirectMessages, DirectMessageTyping, MessageContent } = GatewayIntentBits;
const dotenv = require('dotenv');
const spellchecker = require('spellchecker');
require('log-timestamp');
const storageFunctions = require('./functions/storageFunctions');
const audioFunctions = require('./functions/audioFunctions');
const helperFunctions = require('./functions/helperFunctions');
const aiFunctions = require('./functions/aiFunctions');

let robot = {};
robot.storage = require('node-persist');
robot.https = require('https');
robot.axios = require('axios');
dotenv.config();

// INITIALIZE
robot.audioQueues = {};
robot.dispatchers = {};
robot.directory = __dirname;
const client = new Client({ intents: [ Guilds, GuildVoiceStates, GuildMessages, DirectMessages, DirectMessageTyping ], partials: [ Partials.Channel ] });
client.commands = [];
robot.commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const fileCommands = require(`./commands/${file}`);
    if(Object.keys(fileCommands).length < 1) continue;
    for(let cmd of fileCommands){
        if(!cmd.disabled) {
            robot.commands.push(cmd);
            if(cmd.description) cmd.description = cmd.description.slice(0,99);
            cmd.execCommand = undefined;
            client.commands.push(cmd);
        }
    }
}
console.log(client.commands);
const rest = new REST({ version: '10' }).setToken(process.env['DISCORD_TOKEN']);
(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands(process.env['CLIENT_ID']), { headers: {}, body: client.commands });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

robot.voice = client.voice;
robot.client = client;
const BOT_TOKEN = process.env.DISCORD_TOKEN;
client.login(BOT_TOKEN);
robot.AUDIO_PATH = process.env.AUDIO_LIBRARY_PATH;
robot.VIDEO_PATH = process.env.VIDEO_LIBRARY_PATH;
robot.AI_IMAGE_PATH = process.env.AI_IMAGE_LIBRARY_PATH;
robot.speech = require('@google-cloud/speech');


async function checkForCommand(interaction){
    const command = interaction.commandName;
    let options = [];

    try {
        let execCommand = robot.commands.find((c) => c.name === command);
        if(!execCommand) return false;
        console.log(execCommand);
        if(memberCanExecute(interaction.member, execCommand)){
            execCommand.execute(robot, interaction).catch(async (error) => {
                console.error(error);
            });
        }
        else {
            let msg = `User ${interaction.member.name} lacks ${execCommand.permissions.join(' or ')} permissions!`;
            interaction.reply(msg);
            console.log(msg);
        }
    } catch (error) {
        console.error(error);
    }
    return true;
}

async function handleAutocomplete(interaction) {
    if(interaction.commandName === 'play' || interaction.commandName === 'audio') {

        if(!robot.audioFiles) robot.audioFiles = audioFunctions.getAudioFiles(robot.AUDIO_PATH);
        let audios = robot.audioFiles;
        const focusedValue = interaction.options.getFocused();
        audios = audioFunctions.getMatchingAudio(audios, focusedValue.split(/\s+/));
        audios = audios.map(a => ({ name: a.fullname, value: a.fullname})).slice(0,24);
        try {
            await interaction.respond(audios);
        }
        catch (error) {
            console.error(error);
        }
    }
}

// LIFECYCLE

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) await checkForCommand(interaction);
    else if (interaction.isAutocomplete()) await handleAutocomplete(interaction);
    else return;
});

client.on('messageCreate', async message => {
    if (message.author.bot) return; //ignore bots
    if (message.guildId) return; //ignore non-dms
    console.log(message.content);
    try {
        const resp = await aiFunctions.chatAi(robot, message.content);
        message.channel.send(resp.response);
    }
    catch(error){
        return console.error(error);
    }


    const userData = await storageFunctions.getUserDataAsync(robot, message.author.id);

    if(!userData.spellcheck) return;

    const result = spellchecker.checkSpelling(message.content);
    if(result.length > 0){
        corrections = {};
        for(let r of result){
            const word = message.content.slice(r.start, r.end);
            corrections[word] = spellchecker.getCorrectionsForMisspelling(word);
        }
        let correctionMessage = '';
        Object.entries(corrections).forEach((e) => correctionMessage += `\n⦁ ${e[0]} --> ${e[1].join(', ')}`);

        await message.channel.send(`Oopsies! :relaxed:\n>>> ${message.author}: ***${message.content}***`)
        await message.channel.send(`Did you mean: ${correctionMessage}`);
    }
});

client.once('ready', async () => {
    await robot.storage.init();
    getConnectedServers();
});

// client.on('guildMemberSpeaking', async (member, speaking) =>{ //deprecated
//     const userId = member.user.id;

//     const voiceChannel = member.voice.channel;

//     if(robot.mocks && robot.mocks[userId] && !speaking.bitfield) {
//         const chanceToMock = 0.25
//         const rolled = Math.random();
//         console.log(rolled, chanceToMock);
//         if(rolled < chanceToMock) mockUser(robot, voiceChannel, robot.mocks[userId]);
//     }
// });

client.on('voiceStateUpdate', async (oldState, newState) =>{
    let oldUserChannel = oldState.channelId;
    let newUserChannel = newState.channelId;
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
});


// FUNCTIONS
function playAudio(voiceChannel, keywords, leaveAfter){
    if(!robot.audioFiles) robot.audioFiles = audioFunctions.getAudioFiles(robot.AUDIO_PATH);
    const allAudio = robot.audioFiles;
    let audio = audioFunctions.selectAudio(allAudio, keywords);
    if(audio) audioFunctions.queueAudio(robot, voiceChannel, audio, null, leaveAfter);
    else console.log(`No audio found for [${keywords}])`);
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

async function mockUser(robot, voiceChannel, keywords){
    console.log('mockUser: ', voiceChannel.name, keywords);

    // GET ALL AVAILABLE AUDIO
    if(!robot.audioFiles) robot.audioFiles = audioFunctions.getAudioFiles(robot.AUDIO_PATH);
    const allAudio = robot.audioFiles;

    // SELECT THE AUDIO
    audio = audioFunctions.selectAudio(allAudio, keywords);
    if(!audio) return null;

    // PLAY THE AUDIO
    await audioFunctions.incrementPlayCount(robot, audio.name);
    audioFunctions.queueAudio(robot, voiceChannel, audio, null);
}
