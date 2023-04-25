const fs = require("fs");

async function getAsync(robot, url, options, parseBody){
    options = options || {};
    return new Promise((resolve, reject) => {
        console.log(`GET ${url}`);
        console.log(`With `, options);

        robot.https.get(url, options, res => {
            res.setEncoding("utf8");
            let body = "";
            res.on("data", data => {
                body += data;
            });
            res.on("end", () => {
                if(body.includes('Error')){
                    return reject('GET Error');
                }
                if(parseBody) body = JSON.parse(body);
                resolve(body);
            });
        });
    });
}

async function postAsync(robot, url, body, options){
    return new Promise((resolve, reject) => {
        robot.axios.post(url, body, options).then(res => {
            return resolve(res);
        }).catch(error => {
            return reject(error);
        });
    });
}

async function downloadImageAsync(robot, url, filename, options){
    if(!url || url.length <1) throw Error('Missing url!');
    options = options || {};
    const filepath = `images/ai/${filename}.jpg`;
    return new Promise((resolve, reject) => {
        robot.https.get(url, options, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', () => resolve(filepath));
            }
            else {
                res.resume();
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
            }
        });
    });
}

module.exports = {
    getAsync,
    postAsync,
    downloadImageAsync
}