const AUDIO_METADATA_KEY = 'AUDIO_METADATA';
const GAMES_LIST_CACHE_KEY = 'GAMES_LIST';
const SERVER_DATA_KEY = 'SERVER_DATA';
const USER_DATA_KEY = 'USER_DATA';
const BOT_DATA = 'BOT_DATA';

module.exports = {
    getAudioMetadataAsync: async function(robot){
        let meta = await robot.storage.getItem(AUDIO_METADATA_KEY) || {};
        return meta;
    },
    setAudioMetadataAsync: async function(robot, meta){
        await robot.storage.setItem(AUDIO_METADATA_KEY, meta);
    },

    getGamesListCacheAsync: async function(robot){
        let cachedLists = await robot.storage.getItem(GAMES_LIST_CACHE_KEY) || {};
        cachedLists = cleanCache(cachedLists);
        return cachedLists;
    },
    setGamesListCacheAsync: async function(robot, data){
        await robot.storage.setItem(GAMES_LIST_CACHE_KEY, data);
    },

    getBotDataAsync: async function(robot, key){
        let data = await robot.storage.getItem(BOT_DATA) || {};
        return data[key] || {};
    },
    setBotDataAsync: async function(robot, key, newData){
        let data = await robot.storage.getItem(BOT_DATA) || {};
        data[key] = newData;
        await robot.storage.setItem(BOT_DATA, data);
    },

    getServerDataAsync: async function(robot, serverId){
        serverId = ''+serverId;
        let data = await robot.storage.getItem(SERVER_DATA_KEY) || {};
        return data[serverId] || {};
    },
    setServerDataAsync: async function(robot, serverId, newData){
        serverId = ''+serverId;
        let data = await robot.storage.getItem(SERVER_DATA_KEY) || {};
        data[serverId] = newData;
        await robot.storage.setItem(SERVER_DATA_KEY, data);
    },

    getServerUserDataAsync: async function(robot, serverId, userId){
        userId = ''+userId;
        let data = await robot.storage.getItem(SERVER_DATA_KEY) || {};
        let serverData = data[serverId] || {};
        let userData = serverData[userId] || {};
        return userData;
    },
    setServerUserDataAsync: async function(robot, serverId, userId, newData){
        userId = ''+userId;
        let data = await robot.storage.getItem(SERVER_DATA_KEY) || {};
        if(!data[serverId]) data[serverId] = {};
        data[serverId][userId] = newData;
        await robot.storage.setItem(SERVER_DATA_KEY, data);
    },

    getUserDataAsync: async function(robot, userId){
        userId = ''+userId;
        let data = await robot.storage.getItem(USER_DATA_KEY) || {};
        return data[userId] || {};
    },
    setUserDataAsync: async function(robot, userId, newData){
        userId = ''+userId;
        let data = await robot.storage.getItem(USER_DATA_KEY) || {};
        data[userId] = newData;
        await robot.storage.setItem(USER_DATA_KEY, data);
    },
    getAllUsersData: async function(robot){
        return await robot.storage.getItem(USER_DATA_KEY) || {};
    }
}

function cleanCache(cache){
    let toDelete = [];
    for(const [key, value] of Object.entries(cache)){
        if(value.date && value.date == new Date().toLocaleDateString()) continue;
        toDelete.push(key);
    }
    for(let key of toDelete){
        delete cache[key];
    }
    return cache;
}
