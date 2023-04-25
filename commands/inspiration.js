
const apiFunctions = require('../functions/apiFunctions');

module.exports = [{
    name: 'inspire',
    description: 'Generate an inspirational quote!',
    async execute(robot, interaction) {
        // //https://github.com/kishlaya/inspirobot-bot/blob/master/README.md
        let image = await apiFunctions.getAsync(robot, 'https://inspirobot.me/api?generate=true', null);
        interaction.reply(image);

        // const url = 'https://images-ext-2.discordapp.net/external/QPqM8SzPkOQz10wbPTyjuh_d5KlNYXpuvCdUKlg8PPY/%3Fst%3D2023-03-25T22%253A54%253A18Z%26se%3D2023-03-26T00%253A54%253A18Z%26sp%3Dr%26sv%3D2021-08-06%26sr%3Db%26rscd%3Dinline%26rsct%3Dimage%2Fpng%26skoid%3D6aaadede-4fb3-4698-a8f6-684d7786b067%26sktid%3Da48cca56-e6da-484e-a814-9c849652bcb3%26skt%3D2023-03-25T22%253A34%253A19Z%26ske%3D2023-03-26T22%253A34%253A19Z%26sks%3Db%26skv%3D2021-08-06%26sig%3DP%2FGqVTete6z4ngALuGMfg1BLz1aJp3t6uOSntL9YM%252BY%253D/https/oaidalleapiprodscus.blob.core.windows.net/private/org-AIGUdFPRqfayynB6AOm690xu/user-fGMp5P2s5jl1RtmtMqdIrxmV/img-cb60KkEbouAJhzl9Ofv73gfE.png';
        // await apiFunctions.getImageAsync(robot, url, );
    }
}];
