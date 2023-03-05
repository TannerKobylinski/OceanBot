const apiFunctions = require('../functions/apiFunctions');

//https://jokeapi.dev/
module.exports = [{
    name: 'joke',
    description: 'Ask for a joke',
    options: [
        {
            "name": "keywords",
            "description": "keywords to include",
            "type": 3,
            "required": false,
        }
    ],
    async execute(robot, interaction) {
        let url = `https://v2.jokeapi.dev/joke/Any?blacklistFlags=racist,sexist,explicit`;
        const userKeywords = interaction.options.getString('keywords');
        if(userKeywords) url += `&contains=${userKeywords.replace(/\s/,'%20')}`;
        try {
            var response = await apiFunctions.getAsync(robot, url, {}, true);
            if(response.error) throw new Error(response.error);
            if(response.type == 'twopart') await sendJokeTwoPart(interaction, response);
            else sendJokeSingle(interaction, response);
        }
        catch (error) {
            console.log(error);
            interaction.reply('no joke found!');
        }
    },
}];

function sendJokeSingle(interaction, response){
    interaction.reply(response.joke);
}

async function sendJokeTwoPart(interaction, response){
    interaction.reply(`${response.setup}\n||${response.delivery}||`);
}
