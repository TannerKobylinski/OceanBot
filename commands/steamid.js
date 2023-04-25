// const Discord = require('discord.js');
// const storageFunctions = require('../functions/storageFunctions');

// module.exports = [{
//     name: 'steamid',
//     description: 'Set/view a user\'s Steam ID for use with the suggest command',
//     examples: [
//         'steamid set <disc_username> <steam_id> - (set another user)',
//         'steamid set <steam_id> - (set self)',
//         'steamid view <disc_username> - (view steam id)',
//     ],
//     async execute(robot, message) {

//         if(!args[0]){
//             return console.error("[steamid]: Missing parameters");
//         }

//         let action = args.shift();
//         if(action!='set' && action!='view'){
//             console.error('[steamid]: Unrecognized action');
//             return;
//         }
//         let steamID;

//         if(action == 'set'){
//             steamID = args.pop().match(/\d+/);
//             if(steamID) steamID = steamID[0];
//             if(!steamID){
//                 console.error("Missing Steam ID / Profile");
//                 return;
//             }
//         }

//         let discUser = args.length>0? getUserFromName(message, args.join(' ')) : message.author;
//         if(!discUser){
//             message.channel.send(`User not found on server`);
//             return;
//         }
//         let discUserID = discUser.id;
//         let userConfig = await storageFunctions.getUserDataAsync(robot, discUserID);
//         console.log(userConfig);

//         if(action == 'set'){
//             userConfig.discordUsername = discUser.username;
//             userConfig.steamId = steamID;
//             userConfig.steamProfile = `https://steamcommunity.com/profiles/${steamID}/`;

//             await storageFunctions.setUserDataAsync(robot, discUserID, userConfig);
//             console.log('Set Steam ID');
//         }
//         else if (action == 'view'){
//             if(!userConfig || !userConfig.steamId){
//                 return message.channel.send('Steam ID not set');
//             }
//         }

//         message.channel.send({embed: new Discord.MessageEmbed()
//             .setTitle(`${discUser.username}`)
//             .setURL(userConfig.steamProfile)
//             .addField(`User ID:`, `\`${discUserID}\``)
//             .addField(`Steam ID:`, `\`${userConfig.steamId}\``)
//         });

//     }
// }];

// function getUserFromName(message, userName){
//     for(let [userID, object] of message.guild.members.cache){
//         console.log('Checking ',object.user.username, 'for', userName);
//         if(object.nickname){
//             if(userName.toLowerCase() == object.nickname.toLowerCase()) return object.user;
//         }
//         if(userName.toLowerCase() == object.user.username.toLowerCase()) return object.user;
//     };
//     return null;
// }
