const storageFunctions = require("./storageFunctions");

const MESSAGE_CHAR_LIMIT = 1600;
const DEFAULT_PREFIX = '!';

module.exports = {
    timeout: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    messageReplyLong: function(message, str){
        if(str.length <= MESSAGE_CHAR_LIMIT) return message.reply(str);

        let firstMessage = true;

        let lines = str.split('\n');
        let i = 0;
        let chunk = '';
        while(i < lines.length){
            let line = lines[i]+'\n';
            if(chunk.length + line.length < MESSAGE_CHAR_LIMIT){ //carefully construct chunk
                chunk += line;
                i++;
            }
            else{ //reply with full chunks
                if(firstMessage){
                    message.reply(chunk)
                    firstMessage=false;
                }
                else message.channel.send(chunk);
                chunk = '';
            }
        }
        if(chunk.length > 0) message.channel.send(chunk); //send last bit
    },

    getPrefixAsync: async function(robot, serverId){
        let serverSettings = await storageFunctions.getServerDataAsync(robot, serverId);
        return serverSettings.prefix || DEFAULT_PREFIX;
    },

    setPrefixAsync: async function(robot, serverId, prefix){
        let serverSettings = await storageFunctions.getServerDataAsync(robot, serverId);
        serverSettings.prefix = prefix;
        if(prefix == DEFAULT_PREFIX) delete serverSettings.prefix;
        await storageFunctions.setServerDataAsync(robot, serverId, serverSettings);
    },
}
