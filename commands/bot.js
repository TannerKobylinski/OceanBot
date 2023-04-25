// const helperFunctions = require('../functions/helperFunctions');
// const storageFunctions = require('../functions/storageFunctions');

// module.exports = [{
//     name: 'leave',
//     description: 'Make the bot leave your voice channel',
//     async execute(robot, message, args) {
//         let userVoiceChannel = message.member.voice.channel;
//         let botVoiceChannels = robot.voice.connections;
//         let userAndBotChannels = botVoiceChannels.filter(vc => vc.channel.id == userVoiceChannel.id).array();

//         if(userAndBotChannels.length > 0) userVoiceChannel.leave();
//         else return message.reply('You must be in a voice channel with the bot!');
//     }
// },{
//     name: 'server',
//     description: 'View/set server configuration. e.g. set=[!server <setting> <value>], view=[!server <setting>]',
//     permissions: ['ADMINISTRATOR'],
//     async execute(robot, message) {
//         const setting = args[0];
//         if(!setting) return message.reply('no setting specified!');
//         const configOptions = ['onjoin'];
//         if(!configOptions.includes(setting)) return message.reply('setting not found!');

//         const serverId = message.channel.guild.id;
//         let serverData = await storageFunctions.getServerDataAsync(robot, serverId);
//         let settingValue = args[1];
//         if(settingValue){
//             if(settingValue == 'false' || settingValue == 'off') settingValue = false;
//             serverData[setting] = settingValue;
//             await storageFunctions.setServerDataAsync(robot, serverId, serverData);
//         }
//         return message.reply(`${setting} set to ${serverData[setting]}`);
//     }
// }];
