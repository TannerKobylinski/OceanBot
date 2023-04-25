// const twitterFunctions = require('../functions/twitterFunctions');

// module.exports = [{
//     name: 'parrot',
//     disabled: true,
//     description: 'Echo tweets from a specified Twitter username',
//     permissions: ['ADMINISTRATOR'],
//     async execute(robot, message) {
//         if(args.length < 1) return;
//         const username = args[0];

//         const channelId = message.channel.id;
//         await twitterFunctions.followNewUser(robot, username, channelId);



//         // let deleteRules = [
//         //     "1454240809893744647",
//         //     "1454240809893744648"
//         // ];
//         // await twitterFunctions.deleteTwitterRules(robot, deleteRules);
//         // await twitterFunctions.updateTwitterRules(robot);
//         // await twitterFunctions.getTwitterRules(robot);
//         if(!robot.twitterStream){
//             (async () => {
//                 robot.twitterStream = twitterFunctions.openStream(robot);
//             })();
//         }
//     },
// },
// // // {
// // //     name: 'untweet',
// // //     description: 'Stop getting updates from a specified Twitter user',
// // //     permissions: ['ADMINISTRATOR'],
// // //     async execute(robot, message, args) {

// // //     },
// // // }
// ];


// // const streamURL = "https://api.twitter.com/2/tweets/search/stream?tweet.fields=context_annotations&expansions=author_id";

// // const rulesURL = "https://api.twitter.com/2/tweets/search/stream/rules";


// // let response = await apiFunctions.getAsync(robot, url);