const emoji = require('node-emoji');


function getReactableLetters(message) {
    if(!message.match(/^[A-Za-z\s]+$/g)) return null;
    message = message.toLowerCase();
    const regex = /([a-z])/g;
    const letters = [...message.matchAll(regex)].map((match) => match[0]);
    const duplicates = letters.filter((letter, index) => letters.indexOf(letter) !== index);
    if (duplicates.length > 0) return null;
    return letters;
}

async function reactToMessageWithLetters(message, letters) {
    for(let letter of letters) {
        try {
            const emoji = getEmojiFromLetter(letter);
            await message.react(emoji);
        }
        catch(error){
            console.error(`Failed to react with ${letter}`, error);
        }
    }
}

function reactWithRandomEmoji(message) {
    const randomEmoji = emoji.random().emoji;
    message.react(randomEmoji);
}

function getEmojiFromLetter(letter) {
    const REGIONAL_INDICATOR_A_CODE_POINT = 127462;
    letter = letter.toLowerCase();
    const emoji = String.fromCodePoint(REGIONAL_INDICATOR_A_CODE_POINT + letter.codePointAt(0) - 'a'.codePointAt(0));
    return emoji;
}

module.exports = {
    getReactableLetters,
    reactToMessageWithLetters,
    reactWithRandomEmoji
}
