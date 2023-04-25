// const Discord = require('discord.js');
// const storageFunctions = require('../functions/storageFunctions');
// const STEAM_DOMAIN = 'https://api.steampowered.com';
// const STEAM_OWNED_GAMES_PATH = '/IPlayerService/GetOwnedGames/v0001/';
// const apiFunctions = require('../functions/apiFunctions');
// const SUGGEST_CATEGORIES = [
//     'PvP',
//     'Online PvP',
//     'Co-op',
//     'Online Co-op',
//     'Multi-player',
//     'Multiplayer',
//     'Massively Multiplayer',
//     'MMORPG',
//     'Co-op Campaign',
//     'Cross-Platform Multiplayer'
// ];
// const MAX_GAME_SUGGESTION_NUM = 5;

// module.exports = [{
//     name: 'suggest',
//     description: 'Suggest a Steam game among the users in a voice call',
//     async execute(robot, message) {
//         let STEAM_API_KEY = process.env.STEAM_API_KEY;
//         if(!STEAM_API_KEY) {
//             return console.error("STEAM_API_KEY not set");
//         }
//         let numOfSuggestions = 1;
//         let userChannel = null;
//         let voiceUsers = [];
//         const voiceChannels = message.guild.channels.cache.filter(c => c.type == 'voice');
//         for(let [channelID, channel] of voiceChannels){
//             let tempUsers = [];
//             for(let [userID, member] of channel.members){
//                 tempUsers.push({discordId: userID, discordUsername: member.user.username});
//                 if(userID == message.author.id){
//                     userChannel = channel;
//                 }
//             }
//             if(userChannel){
//                 voiceUsers = tempUsers;
//                 break;
//             }
//         }
//         if(!options.includes('configured')){
//             if(!userChannel || voiceUsers.length < 2){
//                 message.channel.send('Must be in a voice channel of two or more to use this command');
//                 return;
//             }
//         }
//         let suggestAll;
//         if(args[0]){
//             let suggestNum = args[0].match(/\d+/);
//             suggestAll = args[0].match(/all/i);
//             if(suggestNum){
//                 numOfSuggestions = Math.min(suggestNum, MAX_GAME_SUGGESTION_NUM);
//                 numOfSuggestions = Math.max(numOfSuggestions, 0);
//             }
//         }

//         let configuredUsers = await storageFunctions.getAllUsersData(robot);
//         let suggestableUsers = [];
//         let missingConfigUsers = [];

//         if(options.includes('configured')){
//             for(const [id, userData] of Object.entries(configuredUsers)){
//                 if(userData.steamId) suggestableUsers.push(userData);
//             }
//         }
//         else{
//             for(let vUser of voiceUsers){
//                 let discId = vUser.discordId;
//                 if(configuredUsers[discId] && configuredUsers[discId].steamId) suggestableUsers.push(configuredUsers[discId]);
//                 else missingConfigUsers.push(vUser.discordUsername);
//             }
//         }

//         message.channel.send(`Looking at games of *${suggestableUsers.map(usr => {return usr.discordUsername}).join('*, *')}*`);

//         let filteredGames = [];
//         let userList = generateUserList(suggestableUsers);
//         // Check for cached game list
//         console.log('Looking for ',userList, 'in cache');

//         let cachedLists = await storageFunctions.getGamesListCacheAsync(robot);
//         let gamesList = cachedLists[userList];

//         if(!gamesList){
//             console.log(`Key ${userList} not found in cache`);
//         }
//         let useCache = !options.includes('no-cache') && gamesList;

//         if(useCache) {
//             filteredGames = gamesList.games;
//             if(filteredGames.length == 0){
//                 return message.channel.send('No games in common');
//             }
//         }
//         else {
//             if(suggestableUsers.length < 2) {
//                 message.channel.send(`One or more users missing steam ID configuration: *${missingConfigUsers.join('*, *')}*`);
//                 return;
//             }
//             if(missingConfigUsers.length>0) console.log(`[suggest]: steam ID missing: ${missingConfigUsers.join(', ')}`);

//             let usersGameListReceived = [];
//             for(let user of suggestableUsers){
//                 let path = `${STEAM_DOMAIN}${STEAM_OWNED_GAMES_PATH}?key=${STEAM_API_KEY}&steamid=${user.steamId}&include_appinfo=true&include_played_free_games=true&format=json`;
//                 try {
//                     var response = await apiFunctions.getAsync(robot, path);
//                 }
//                 catch (error) {
//                     console.error(error);
//                     console.error(`Unable to get games for Steam ID: ${user.steamId} - ${user.discordUsername}`);
//                     continue;
//                 }
//                 user.game_count = response.response.game_count;
//                 user.games = response.response.games;
//                 usersGameListReceived.push(user);
//             }
//             if(usersGameListReceived.length < 2){
//                 console.error(`Retrieved games lists for ${usersGameListReceived.length} user(s)`);
//                 return;
//             }

//             let gameSuggestions = gameCompare(usersGameListReceived);
//             console.log(gameSuggestions.length, 'games in common');
//             if(gameSuggestions.length == 0){
//                 return message.channel.send('No games in common');
//             }
//             else {
//                 message.channel.send(`Getting game details from steam for ${gameSuggestions.length} games`);
//                 let detailedGames = await getGamesDetails(robot, gameSuggestions);
//                 filteredGames = filterGamesCategory(detailedGames);
//             }

//             //Cache game list
//             let setCached = {
//                 games: filteredGames,
//                 date: `${new Date().toLocaleDateString()}`
//             }
//             cachedLists[userList] = setCached;
//             await storageFunctions.setGamesListCacheAsync(robot, cachedLists);
//         }
//         if(suggestAll){
//             message.channel.send(`Listing all ${filteredGames.length} games in common`);
//             console.log('num suggestions: ', numOfSuggestions);
//             for(let i=0; i<filteredGames.length; i++){
//                 let suggestion = filteredGames[i];
//                 sendDiscordEmbeddedSlim(message, suggestion);
//                 await sleep(1000);
//             }
//         }
//         else {
//             message.channel.send(`Suggesting${numOfSuggestions>1? ` ${numOfSuggestions}` : ``} random game${numOfSuggestions>1? `s` : ``} from ${filteredGames.length} games in common`);
//             console.log('num suggestions: ', numOfSuggestions);
//             for(let i=0; i<numOfSuggestions; i++){
//                 let index = Math.floor(Math.random() * filteredGames.length);
//                 let suggestion = filteredGames[index];
//                 filteredGames.splice(index,1);
//                 sendDiscordEmbeddedFull(message, suggestion);
//             }
//         }
//     },
// }];

// function sendDiscordEmbeddedFull(message, game){
//     message.channel.send({embed: new Discord.MessageEmbed()
//         .setImage(`https://steamcdn-a.akamaihd.net/steam/apps/${game.appid}/library_600x900_2x.jpg`)
//         .setTitle(`${game.name}`)
//         .setURL(`https://store.steampowered.com/app/${game.appid}`)
//         .addField(`Average Playtime`, `${(game.avg_playtime/60).toFixed(1)} hours`)
//         .addField(`Categories`, `\`${game.categories.map(g => g.description).join('`, `')}\``)
//     });
// }

// function sendDiscordEmbeddedSlim(message, game){
//     message.channel.send({embed: new Discord.MessageEmbed()
//         .setTitle(`${game.name}`)
//         .setURL(`https://store.steampowered.com/app/${game.appid}`)
//         .addField(`Average Playtime`, `${(game.avg_playtime/60).toFixed(1)} hours`)
//     });
// }

// function sleep(ms) {
//     return new Promise((resolve) => {
//         setTimeout(resolve, ms);
//     });
// }

// function generateUserList(users){
//     users.sort((a,b) => {
//         return b.steamId - a.steamId;
//     });
//     let ids = users.map(user => {return user.steamId})
//     return `${ids.join(`-`)}`;
// }

// function filterGamesCategory(gameList){
//     let newGameList = [];
//     for(game of gameList){
//         if(!game.categories || game.categories.length<1) continue;
//         for(cat of SUGGEST_CATEGORIES){
//             if(game.categories.find(element => {
//                 return element.description.includes(cat);
//             })){
//                 gameAdded = true;
//                 newGameList.push(game);
//                 break;
//             }
//         }
//     }
//     return newGameList;
// }

// async function getGamesDetails(robot, gameList){
//     let failedGames = [];
//     let successGames = [];
//     for(game of gameList){
//         let appid = game.appid;
//         let url = `https://store.steampowered.com/api/appdetails?appids=${appid}`;
//         try {
//             var response = await apiFunctions.getAsync(robot, url);
//             if(!response || !response[appid].success) throw new Error(`Steam API call failed for ${game.name}`);
//         }
//         catch (error) {
//             console.error(error);
//             failedGames.push(game.name);
//             continue;
//         }
//         // console.log(response);
//         game.categories = response[appid].data.categories;
//         successGames.push(game);
//     }
//     if(failedGames.length>0) console.error(`Missing game info for: ${failedGames.join(', ')}`);
//     return successGames;
// }

// function gameCompare(users){
//     let gamesArrayOne = users[0].games || [];
//     gamesArrayOne = gamesArrayOne.map(game => {
//         return {
//             appid: game.appid,
//             name: game.name,
//             avg_playtime: game.playtime_forever,
//             img_logo_url: game.img_logo_url,
//             img_icon_url: game.img_icon_url
//         }
//     })
//     console.log('Starting: ', gamesArrayOne.length);

//     for(let i=1; i<users.length; i++){
//         let gamesArrayTwo = users[i].games;
//         console.log('Comparing to ', gamesArrayTwo.length);

//         gamesArrayOne = gamesArrayOne.filter(gameOne => {
//             return gamesArrayTwo.find(gameTwo => {
//                 if(gameTwo.appid == gameOne.appid){
//                     let avg = gameOne.avg_playtime;
//                     avg *= i;
//                     avg += gameTwo.playtime_forever;
//                     avg /= (i+1);
//                     gameOne.avg_playtime = avg;
//                     return true;
//                 }
//                 return false;
//             });
//         });
//         console.log(`Pass ${i} games: ${gamesArrayOne.length}`);
//     }
//     return gamesArrayOne.sort( (a,b) => {
//         if(a.avg_playtime < b.avg_playtime) return 1;
//         else if(a.avg_playtime > b.avg_playtime) return -1;
//         return 0;
//     });
// }
