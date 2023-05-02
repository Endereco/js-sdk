const http = require('http');
const fs = require('fs').promises;
const host = 'localhost';
const port = 8000;

const requestListener = function (req, res) {
    var postData = '';
    req.on('data', chunk => {
        postData += chunk;
    })
    req.on('end', () => {
        if ('/' === req.url) {
            fs.readFile(__dirname + "/example.html")
                .then(contents => {
                    res.setHeader("Content-Type", "text/html");
                    res.writeHead(200);
                    res.end(contents);
                });
        }

        if ('/dist/endereco.min.js' === req.url) {
            fs.readFile(__dirname + "/../dist/endereco.min.js")
                .then(contents => {
                    res.setHeader("Content-Type", "text/javascript");
                    res.writeHead(200);
                    res.end(contents);
                });
        }

        if ('/dist/endereco.min.css' === req.url) {
            fs.readFile(__dirname + "/../dist/endereco.min.css")
                .then(contents => {
                    res.setHeader("Content-Type", "text/css");
                    res.writeHead(200);
                    res.end(contents);
                });
        }

        if ('/proxyfile' === req.url) {
            const options = {
                hostname: 'staging.endereco-service.de',
                port: 80,
                path: '/rpc/v1',
                method: 'POST',
                headers: req.headers
            }
            const reqin = http.request(options, resin => {
                var body = '';
                resin.on('data', d => {
                    body += d;
                })
                resin.on('end', function() {
                    res.setHeader("Content-Type", "application/json");
                    res.writeHead(200);
                    res.end(body);
                });
            })

            reqin.on('error', error => {
                console.error(error)
            })

            reqin.write(postData)
            reqin.end()
        }
    })
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
