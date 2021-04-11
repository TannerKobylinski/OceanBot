const DEFAULT_PREFIX = '!';
const PREFIX_STORAGE_KEY = 'SERVER_PREFIXES';
const SERVER_SETTING_KEY = 'SERVER_SETTINGS';
const AUDIO_METADATA_KEY = 'AUDIO_METADATA';

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
    getServerSettingAsync: async function(robot, serverId, setting){

    },
    setServerSettingAsync: async function(robot, serverId, setting, value){

    },
    getAudioMetadataAsync: async function(robot){
        let meta = await robot.storage.getItem(AUDIO_METADATA_KEY) || {};
        return meta;
    },
    setAudioMetadataAsync: async function(robot, meta){
        await robot.storage.setItem(AUDIO_METADATA_KEY, meta);
    }
}
