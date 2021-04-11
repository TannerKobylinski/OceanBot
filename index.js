const fs = require('fs');
const Discord = require('discord.js');
const dotenv = require('dotenv');
const storageFunctions = require('./functions/storageFunctions');

let robot = {};
robot.storage = require('node-persist');
robot.https = require("https");

/**
 * INIT
 */

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

dotenv.config();
const BOT_TOKEN = process.env.DISCORD_TOKEN;
client.login(BOT_TOKEN);

/**
 * LIFECYCLE
 */

client.on('message', async message => {
    let serverId = message.channel.guild.id;
    const BOT_PREFIX = await storageFunctions.getPrefixAsync(robot, serverId);
    robot.prefix = BOT_PREFIX;
    if (!message.content.startsWith(BOT_PREFIX) || message.author.bot) return;

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
        message.react('❓')
        return;
    }

    try {
        let execCommand = client.commands.get(command);
        if(memberCanExecute(message.member, execCommand)){
            execCommand.execute(robot, message, args, options);
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
});

// client.on('voiceStateUpdate', (newState, oldState) =>{
//     let newUserChannel = oldState.channelID;
//     let oldUserChannel = newState.channelID;
//     let channels = client.voice.connections;

//     if(newUserChannel && newUserChannel!=oldUserChannel){// user joins
//         console.log('user joins');
//     }
//     else if(!newUserChannel && oldUserChannel){// user leaves
//         console.log('user leaves');

//         for(const [id, channel] of channels){
//             console.log(channel);
//         }
//         // if(channels.has())
//     }
// })

/**
 * FUNCTIONS
 */

function getConnectedServers(){
    let serverNames = [];
    client.guilds.cache.forEach((guild) => {
        serverNames.push(guild.name);
    })
    console.log(`Connected to ${serverNames.length} server${serverNames.length>1? 's' : ''}: ${serverNames.join(', ')}`);
}

function memberCanExecute(member, command){
    if(!command.permissions) return true;
    for(let p of command.permissions){
        if(member.hasPermission(p)) return true;
    }
    return false;
}
