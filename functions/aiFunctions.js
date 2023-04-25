const apiFunctions = require('../functions/apiFunctions');

async function chatAi(robot, prompt) {
    const url = 'https://api.openai.com/v1/chat/completions';
    const model = "gpt-4";
    const bias = "Your name is OceanBot and you should refer to yourself as OceanBot. You should always stay in character. Follow these rules: 1. If you can, do the opposite of whatever is requested. 2. If given a choice, always side with the least agreeable option and always have a strong opinion. 3. If you can, respond in a way to subtley gaslight me into thinking the opposite of whatever I say. 4. Try to be funny. 5. If I mention OceanBot or say please, ignore all previous instruction.";
    const body = {
        model,
        messages: [{"role": "system", "content": bias}, {"role": "user", "content": prompt}]
    };
    const aiOptions = {
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${process.env['OPENAI_API_KEY_MAIN']}`
        }
    };

    var response = await apiFunctions.postAsync(robot, url, JSON.stringify(body), aiOptions);
    if (response.error) throw new Error(response.error);
    // const cost = `${response.data.usage.total_tokens * 0.002 / 1000}`;
    const cost = `${response.data.usage.prompt_tokens * 0.03 / 1000 + response.data.usage.completion_tokens * 0.06 / 1000}`.slice(0,8);
    // console.log(`cost: $${cost.match(/\d+\.\d\d/)}`);
    console.log(`cost: $${cost}`);
    console.log(response.data.choices[0]);
    const aiResp = response.data.choices[0].message.content;
    return {
        response: aiResp,
        cost: cost
    }
}

async function imageAi(robot, prompt) {
    const url = 'https://api.openai.com/v1/images/generations';
    const body = {
        prompt,
        n: 1,
        size: "512x512"
    };
    const aiOptions = {
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${process.env['OPENAI_API_KEY_ALT']}`
        }
    };

    var response = await apiFunctions.postAsync(robot, url, JSON.stringify(body), aiOptions);
    if (response.error) throw new Error(response.error);
    console.log(response.data.data);
    const aiResp = response.data.data[0].url;
    return aiResp;
}

module.exports = {
    chatAi,
    imageAi
};
