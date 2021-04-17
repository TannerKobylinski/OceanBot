const DEFAULT_PREFIX = '!';
const PREFIX_STORAGE_KEY = 'SERVER_PREFIXES';
const AUDIO_METADATA_KEY = 'AUDIO_METADATA';
const SERVER_DATA_KEY = 'SERVER_DATA';

module.exports = {
    getPrefixAsync: async function(robot, serverId){
        let prefixStorage = await robot.storage.getItem(PREFIX_STORAGE_KEY) || {};
        return prefixStorage[serverId] || DEFAULT_PREFIX;
    },
    setPrefixAsync: async function(robot, serverId, prefix){
        let prefixStorage = await robot.storage.getItem(PREFIX_STORAGE_KEY) || {};
        prefixStorage[serverId] = prefix;
        await robot.storage.setItem(PREFIX_STORAGE_KEY, prefixStorage);
    },

    getAudioMetadataAsync: async function(robot){
        let meta = await robot.storage.getItem(AUDIO_METADATA_KEY) || {};
        return meta;
    },
    setAudioMetadataAsync: async function(robot, meta){
        await robot.storage.setItem(AUDIO_METADATA_KEY, meta);
    },

    getServerDataAsync: async function(robot, serverId){
        let data = await robot.storage.getItem(SERVER_DATA_KEY) || {};
        return data[serverId] || {};
    },
    setServerDataAsync: async function(robot, serverId, newData){
        let data = await robot.storage.getItem(SERVER_DATA_KEY) || {};
        data[serverId] = newData;
        await robot.storage.setItem(SERVER_DATA_KEY, data);
    },

    getServerUserDataAsync: async function(robot, serverId, userId){
        let data = await robot.storage.getItem(SERVER_DATA_KEY) || {};
        let serverData = data[serverId] || {};
        let userData = serverData[userId] || {};
        return userData;
    },
    setServerUserDataAsync: async function(robot, serverId, userId, newData){
        let data = await robot.storage.getItem(SERVER_DATA_KEY) || {};
        if(!data[serverId]) data[serverId] = {};
        data[serverId][userId] = newData;
        await robot.storage.setItem(SERVER_DATA_KEY, data);
    }
}
