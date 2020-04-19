const fs = require('fs');
const Discord = require('discord.js');
const dotenv = require('dotenv');
const storage = require('node-persist');

/**
 * INIT
 */

const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

dotenv.config();
const BOT_TOKEN = process.env.OCEAN_BOT_DISCORD_TOKEN;
client.login(BOT_TOKEN);

/**
 * LIFECYCLE
 */

client.on('message', async message => {
    let BOT_PREFIX = await storage.getItem('BOT_PREFIX');
    if (!message.content.startsWith(BOT_PREFIX) || message.author.bot) return;

    const args = message.content.slice(BOT_PREFIX.length).split(/\s+/);
    const command = args.shift().toLowerCase();
    if (!client.commands.has(command)) return;

    try {
        client.commands.get(command).execute(message, storage, args);
    } catch (error) {
        console.error(error);
    }
});

client.once('ready', async () => {
    await storage.init();
    BOT_PREFIX = await storage.getItem('BOT_PREFIX') || '!';
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