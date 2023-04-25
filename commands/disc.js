// const {MessageManager} = require('discord.js');

// module.exports = [{
//     name: 'firstmessage',
//     description: 'Get a link to the first message sent in the server. Specify user with @, channel with #, and add text to filter.',
//     permissions: ['ADMINISTRATOR'],
//     async execute(robot, message, args) {
//         let channel = message.channel;
//         if(!channel) return;
//         const userId = (message.mentions.users.first() || {}).id || null;
//         let texts = message.content.split(/\s+/);
//         texts.splice(0,1);
//         if(userId) for(let i=0; i<texts.length; i++) {
//             if(texts[i].includes('@')) {
//                 texts.splice(i,1);
//                 break;
//             }
//         }
//         if(texts.length === 0) texts = null;

//         const last = await firstMsgInChannel(robot, channel, texts, userId);

//         if(!last) return message.reply('Unable to find messages!');
//         console.log(`First message: ${last.createdAt} ${last.id}\n`);
//         message.reply(last.url);
//     }
// }];

// async function firstMsgInChannel(robot, channel, texts, userId) { //TODO: CACHE ALL messages per channel (content/id/url/timestamp?) if not cached, collect all messages. THEN filter for conditions on ALL
//     const options = {limit: 100};
//     let last = null;

//     function customFilter(m) {
//         return (!texts || texts.some(text => m.content.includes(text))) &&
//         (!userId || m.author === userId);
//     }

//     // Check channel messages cache (persists through bot process, not stored locally)
//     if(!robot.cache) robot.cache = {};
//     if(!robot.cache.channelMessages) robot.cache.channelMessages = {};
//     let channelMessages = robot.cache.channelMessages[channel.id] || [];

//     // Manual channel fetch loop if not cached
//     if(channelMessages.length === 0) {
//         console.log(`Fetching messages for ${channel.id}`);
//         while(true){
//             let messages = await channel.messages.fetch(options);

//             if(!messages || messages.size == 0) break;

//             messages.each(m => channelMessages.push({
//                 id: m.id,
//                 author: m.author.id,
//                 content: m.content,
//                 createdAt: m.createdAt,
//                 url: m.url
//             }));

//             last = messages.last();
//             options.before = last.id;
//         }
//         robot.cache.channelMessages[channel.id] = channelMessages;
//     }
//     console.log('channelMessages length: ',channelMessages.length);

//     if(channelMessages.length > 0) {
//         channelMessages = channelMessages.filter(customFilter);
//         last = channelMessages.pop();
//     }
//     return last;
// }
