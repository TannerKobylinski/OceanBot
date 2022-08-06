const apiFunctions = require('../functions/apiFunctions');
const storageFunctions = require('../functions/storageFunctions');

const streamURL = "https://api.twitter.com/2/tweets/search/stream?expansions=author_id&tweet.fields=text,id,author_id&user.fields=username";
const rulesURL  = "https://api.twitter.com/2/tweets/search/stream/rules";
const userURL   = "https://api.twitter.com/2/users";

const storageKey = 'TWITTER_PARROTS';

function getNewFollowRule(username, userId){
    return [{
        'value': `from:${userId}`,
        'tag': `echo ${username}`
    }];
}

async function areParrots(robot) {
    const parrots = await storageFunctions.getBotDataAsync(robot, storageKey);
    return !!(parrots && Object.keys(parrots).length > 0);
}

async function followNewUser(robot, username, channelId){
    let user = await getTwitterUser(robot, username);
    let userId = user.id;
    let newRule = getNewFollowRule(username, userId);
    console.log(`newRule: ${JSON.stringify(newRule)}`);
    await updateTwitterRules(robot, newRule);
    //add user to list in local storage if follow succeeded
    const parrots = await storageFunctions.getBotDataAsync(robot, storageKey);
    parrots[userId] = parrots[userId] || {};
    parrots[userId][channelId] = true;
    await storageFunctions.setBotDataAsync(robot, storageKey, parrots);
}

async function getTwitterUser(robot, username){

    const url = `${userURL}/by?usernames=${username}&user.fields=id`;
    const token = process.env["TWITTER_BEARER_TOKEN"];
    const options = {
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`
        }
    };
    const response = await apiFunctions.getAsync(robot, url, options, true);
    console.log(response);
    return response.data[0];
}

async function getTwitterRules(robot){
    const token = process.env["TWITTER_BEARER_TOKEN"];
    const response = await apiFunctions.getAsync(robot, rulesURL, {
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`
        }
    });
    console.log(response);
}

async function deleteTwitterRules(robot, ids){
    const data = {
        "delete": {
            "ids": ids
        }
    };
    const token = process.env["TWITTER_BEARER_TOKEN"];
    const response = await apiFunctions.postAsync(robot, rulesURL, data, {
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`
        }
    });
    if (response.status !== 200) {
        throw new Error(response.data);
    }

    console.log(response.data);
}

async function updateTwitterRules(robot, rules){
    const data = {
        "add": rules
    }
    const token = process.env["TWITTER_BEARER_TOKEN"];
    const response = await apiFunctions.postAsync(robot, rulesURL, data, {
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`
        }
    });

    if (response.status !== 201) {
        throw new Error(response.body);
    }
    console.log(response.data);
}

async function sendTweetMessageToChannel(robot, tweetData) {
    const userId = tweetData.data.author_id;
    const tweetId = tweetData.data.id;
    const userName = tweetData.includes.users[0].username;
    const url = `https://twitter.com/${userName}/status/${tweetId}`;
    //check local storage to get original channel using twitter user id
    const parrots = await storageFunctions.getBotDataAsync(robot, storageKey);
    console.log('parrots: ', parrots);
    const userParrots = parrots[userId];
    const channelsToMessage = Object.keys(userParrots);
    if(userParrots && channelsToMessage){
        for(let channel of channelsToMessage){
            let targetChannel = robot.client.channels.cache.get(channel);
            if(targetChannel) targetChannel.send(url);
        }
    }
}

function openStream(robot, retryAttempt){
    console.log("in openStream")
    retryAttempt = retryAttempt || 0;
    const token = process.env["TWITTER_BEARER_TOKEN"];
    return robot.https.get(streamURL, {
        headers: {
            // "User-Agent": "v2SampleStreamJS",
            "Authorization": `Bearer ${token}`
        },
        timeout: 20000
    }, (res) => {
        res.on('data', async (data) => {
            try {
                const json = JSON.parse(data);
                console.log(JSON.stringify(json));
                await sendTweetMessageToChannel(robot, json);
                // A successful connection resets retry count.
                retryAttempt = 0;
            }
            catch (e) {
                // Catches error in case of 401 unauthorized error status.
                if (data.status === 401) {
                    console.log(data);
                    process.exit(1);
                }
                else if (data.detail === "This stream is currently at the maximum allowed connection limit.") {
                    console.log(data.detail)
                    process.exit(1)
                }
                else {
                    // Keep alive signal received. Do nothing.
                }
            }
        }).on('err', error => {
            if (error.code !== 'ECONNRESET') {
                console.log(error.code);
                process.exit(1);
            }
            else {
                setTimeout(() => {
                    console.warn("A connection error occurred. Reconnecting...")
                    openStream(robot, ++retryAttempt);
                }, 2 ** retryAttempt);
            }
        });
    });
}


module.exports = {
    areParrots,
    followNewUser,
    updateTwitterRules,
    openStream,
    getTwitterRules,
    deleteTwitterRules
}

function isString(str){
    return typeof str === 'string';
}

function colorShift(r,g,b, rShift, gShift, bShift){
    let color = {
        r: r + rShift,
        g: g + gShift,
        b: b + bShift
    };
    if (r<0) r = 0;
    if (g<0) g = 0;
    if (b<0) b = 0;
    if (r>255) r = 255;
    if (g>255) g = 255;
    if (b>255) b = 255;
    return color;
}
