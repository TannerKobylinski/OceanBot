const Discord = require('discord.js');

module.exports = [{
    name: 'steamid',
    description: 'Set/view a user\'s Steam ID for use with the suggest command',
    examples: [
        'steamid set <disc_username> <steam_id> - (set another user)',
        'steamid set <steam_id> - (set self)',
        'steamid view <disc_username> - (view steam id)',
    ],
    async execute(robot, message, args, options) {
        if(args[0]){
            let action = args[0];
            if(action!='set' && action!='view'){
                console.error('[steamid]: Unrecognized action');
                return;
            }
            args.splice(0,1);
            let configuredUsers = await robot.storage.getItem('USERS_CONFIG') || {};
            console.log('Users: ', configuredUsers);
            let steamID;

            if(action == 'set'){
                steamID = args[args.length-1].match(/\d+/);
                if(steamID) steamID = steamID[0];
                if(!steamID){
                    console.error("Missing Steam ID / Profile");
                    return;
                }
                args.pop();
            }

            let discUser = args.length>0? getUserFromName(message, args.join(' ')) : message.author;
            if(!discUser){
                message.channel.send(`User not found on server`);
                return;
            }
            let discUserID = discUser.id;
            let userConfig = configuredUsers[discUserID];

            if(action == 'set'){
                userConfig = {
                    discord_id: discUserID,
                    discord_username: discUser.username,
                    steam_id: steamID,
                    steam_profile_link: `https://steamcommunity.com/profiles/${steamID}/`
                };
                configuredUsers[discUserID] = userConfig;
                await robot.storage.setItem('USERS_CONFIG', configuredUsers);
                console.log('Set Steam ID');
            }
            else if (action == 'view'){
                if(!userConfig){
                    message.channel.send('Steam ID not set');
                    return;
                }
            }

            message.channel.send({embed: new Discord.MessageEmbed()
                .setTitle(`${discUser.username}`)
                .setURL(userConfig.steam_profile_link)
                .addField(`User ID:`, `\`${discUserID}\``)
                .addField(`Steam ID:`, `\`${userConfig.steam_id}\``)
            });
        }
        else {
            console.error("[steamid]: Missing parameters");
        }
    }
}];

function getUserFromName(message, userName){
    for(let [userID, object] of message.guild.members.cache){
        console.log('Checking ',object.user.username, 'for', userName);
        if(object.nickname){
            if(userName.toLowerCase() == object.nickname.toLowerCase()) return object.user;
        }
        if(userName.toLowerCase() == object.user.username.toLowerCase()) return object.user;
    };
    return null;
}
