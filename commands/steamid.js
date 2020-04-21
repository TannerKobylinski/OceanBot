
module.exports = {
    name: 'steamid',
    description: 'Set/view a user\'s Steam ID',
    async execute(robot, message, args) {
        // console.log(message);
        if(args[0]){
            let action = args[0];
            let users = await robot.storage.getItem('USERS_CONFIG') || {};
            console.log('Users: ', users);
            let steamID, userID;

            if(action == 'set'){
                steamID = args[args.length-1].match(/\d+/)[0];
                if(!steamID){
                    console.error("Missing Steam ID / Profile");
                    return;
                }
                args.pop();
            }
            userID = args[1]? getUserID(message, args[1]) : message.author.id;
            if(!userID){
                message.channel.send(`User not found on server`);
                return;
            }

            if(action == 'set'){
                users[userID] = {
                    steam_id: steamID,
                }
                await robot.storage.setItem('USERS_CONFIG', users);
                message.channel.send(`User ID: ${userID} set`);
                console.log('Set Steam ID');
            }
            else if (action == 'view'){
                let userConfig = users[userID];
                if(!userConfig){
                    message.channel.send('Steam ID not set');
                    return;
                }
                message.channel.send(`User ID: ${userID} set to ${users[userID].steam_id}`);
            }
        }
        else {
            console.error("[steamid]: Missing parameters");
        }
    }
};

function getUserID(message, userName){
    for(let [userID, object] of message.guild.members.cache){
        if(object.nickname){
            if(userName.toLowerCase() == object.nickname.toLowerCase()) return userID;
        }
        if(userName.toLowerCase() == object.user.username.toLowerCase()) return userID;
    };
    return null;
}
