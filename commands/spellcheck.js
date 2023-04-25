// const storageFunctions = require('../functions/storageFunctions');

// module.exports = [{
//     name: 'spellcheck',
//     description: 'Spellcheck a given user\'s messages',
//     permissions: ['DEVELOPER'],
//     async execute(robot, message) {
//         const user = (message.mentions.users.first() || {});
//         const userId = user.id || null;
//         const userName = user.username || null;
//         if(!userId)  return message.reply('Must provide @user');
//         if(user.bot) return message.reply('Won\'t check bot!');


//         const userData = await storageFunctions.getUserDataAsync(robot, userId);

//         if(!userData.spellcheck) {
//             userData.spellcheck = true;
//             await storageFunctions.setUserDataAsync(robot, userId, userData);
//             message.reply(`Spellchecking ${userName}`);
//         }
//         else {
//             userData.spellcheck = false;
//             await storageFunctions.setUserDataAsync(robot, userId, userData);
//             message.reply(`Not spellchecking ${userName}`);
//         }
//     }
// }];