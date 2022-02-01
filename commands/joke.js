const apiFunctions = require('../functions/apiFunctions');

//https://jokeapi.dev/
module.exports = [{
    name: 'joke',
    description: 'Ask for a joke',
    async execute(robot, message, args) {
        let url = `https://v2.jokeapi.dev/joke/Any?blacklistFlags=racist,sexist,explicit`;
        if(args.length>0) url += `&contains=${args.join('%20')}`;
        try {
            var response = await apiFunctions.getAsync(robot, url, {}, true);
            if(response.error) throw new Error(response.error);
            if(response.type == 'twopart') await sendJokeTwoPart(message, response);
            else sendJokeSingle(message, response);
        }
        catch (error) {
            console.log(error);
            message.reply('no joke found!');
        }
    },
}];

function sendJokeSingle(message, response){
    message.channel.send(response.joke);
}

async function sendJokeTwoPart(message, response){
    message.channel.send(`${response.setup}\n||${response.delivery}||`);
}
