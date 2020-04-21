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
                    body = JSON.parse(body);
                    resolve(body);
                });
            });
        })
    }
}