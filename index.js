const fs = require('fs');
const Discord = require('discord.js');
const dotenv = require('dotenv');
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

dotenv.config();
const BOT_TOKEN = process.env.DISCORD_TOKEN;
client.login(BOT_TOKEN);

/**
 * LIFECYCLE
 */

client.on('message', async message => {
    let BOT_PREFIX = await robot.storage.getItem('BOT_PREFIX');
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
        client.commands.get(command).execute(robot, message, args, options);
    } catch (error) {
        console.error(error);
    }
});

client.once('ready', async () => {
    await robot.storage.init();
    BOT_PREFIX = await robot.storage.getItem('BOT_PREFIX') || '!';
    getConnectedServers();
});

/**
 * FUNCTIONS
 */

function getConnectedServers(){
    let serverNames = [];
    client.guilds.cache.forEach((guild) => {
        serverNames.push(guild.name);
    })
    console.log(`Connected to ${serverNames.length} server${serverNames.length>1? 's' : ''}: ${serverNames.join(', ')}`);
    console.log(`Prefix commands with: \`${BOT_PREFIX}\``);
}
