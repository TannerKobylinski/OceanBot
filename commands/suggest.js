
const STEAM_DOMAIN = 'https://api.steampowered.com';
const STEAM_OWNED_GAMES_PATH = '/IPlayerService/GetOwnedGames/v0001/';
const apiFunctions = require('../functions/apiFunctions');

module.exports = {
    name: 'suggest',
    description: 'Suggest a steam game',
    async execute(robot, message, args) {
        let STEAM_API_KEY = process.env.STEAM_API_KEY;
        if(!STEAM_API_KEY) {
            console.error("STEAM_API_KEY not set");
            return;
        }

        let userChannel = null;
        let voiceUsers = [];
        const voiceChannels = message.guild.channels.cache.filter(c => c.type == 'voice');
        for(let [channelID, channel] of voiceChannels){
            let tempUsers = [];
            for(let [userID, member] of channel.members){
                tempUsers.push(userID);
                if(userID == message.author.id){
                    userChannel = channel;
                }
            }
            if(userChannel){
                voiceUsers = tempUsers;
                break;
            }
        }
        if(!userChannel || voiceUsers.length < 2){
            message.channel.send('Must be in a voice channel of two or more to use this command');
            return;
        }
        console.log('Users: ', voiceUsers);
        return;


        let path = `${STEAM_DOMAIN}${STEAM_OWNED_GAMES_PATH}?key=${STEAM_API_KEY}&steamid=${userID}&include_appinfo&include_played_free_games&format=json`;
        try {
            var response = await apiFunctions.getAsync(robot, path, {})
        }
        catch (error) {
            console.error(error);
            return;
        }
        console.log('RESPONSE: ', response);
    },
};
