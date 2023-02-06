module.exports = [{
    name: 'horoscope', //https://informationisbeautiful.net/2011/horoscoped/
    description: 'Get your daily horoscope.',
    async execute(robot, message, args) {
        const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
        const sign = args[0] || signs[Math.floor(Math.random()*signs.length)];
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const date = (new Date).toLocaleDateString(undefined, options);
        return message.reply(`Daily ${sign} horoscope for ${date}:\nWhatever the situation or secret moment, enjoy everything a lot. Feel able to absolutely care. Expect nothing else. Keep making love. Family and friends matter. The world is life, fun and energy. Maybe hard. Or easy. Taking exactly enough is best. Help and talk to others. Change your mind and a better mood comes along...`);
    },
}];
