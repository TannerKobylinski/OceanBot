module.exports = {
    async getAsync(robot, url, options){
        return new Promise((resolve, reject) => {
            console.log("GET: ", url);

            robot.https.get(url, res => {
                res.setEncoding("utf8");
                let body = "";
                res.on("data", data => {
                    body += data;
                });
                res.on("end", () => {
                    if(body.includes('Error')){
                        reject('GET Error');
                        return;
                    }
                    body = JSON.parse(body);
                    resolve(body);
                });
            });
        })
    }
}
