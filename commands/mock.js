
// module.exports = [{
//     name: 'mock',
//     description: 'Mock a given user',
//     permissions: ['DEVELOPER'],
//     async execute(robot, message, args) {
//         const user = (message.mentions.users.first() || {});
//         const userId = user.id || null;
//         const userName = user.username || null;
//         if(!userId)  return message.reply('Must provide @user');
//         if(user.bot) return message.reply('Won\'t mock bot!');

//         let texts = message.content.split(/\s+/);
//         texts.splice(0,1);
//         if(userId) for(let i=0; i<texts.length; i++) {
//             if(texts[i].includes('@')) {
//                 texts.splice(i,1);
//             }
//         }
//         if(texts.length === 0) texts = ['nerdge'];

//         if(!robot.mocks) robot.mocks = {};
//         robot.mocks[userId] = texts;
//         message.reply(`Mocking ${userName} with \`${texts}\``);
//     }
// },{
//     name: 'unmock',
//     description: 'Stop mocking a given user',
//     permissions: ['DEVELOPER'],
//     async execute(robot, message, args) {
//         const user = (message.mentions.users.first() || {});
//         const userId = user.id || null;
//         const userName = user.username || null;
//         if(!userId)  return message.reply('Must provide @user');
//         if(user.bot) return message.reply('Won\'t mock bot!');

//         if(!robot.mocks) robot.mocks = {};
//         delete robot.mocks[userId];
//         message.reply(`Done mocking ${userName}`);
//     },
// }];
