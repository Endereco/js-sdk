const http = require('http');
const fs = require('fs').promises;
const host = 'localhost';
const port = 8000;

const requestListener = async function (req, res) {
    try {
        // Serve files based on URL
        const pathname = new URL(req.url, `http://${host}:${port}`).pathname;

        if (req.method === 'POST' && pathname !== '/proxyfile') {
            // Handle POST request
            await processPostRequest(req, res);
            // Redirect to the same page after processing the POST request
            res.writeHead(302, { Location: '/' });
            res.end();

            return;
        }

        switch (pathname) {
        case '/':
            await serveFile(res, '/example.html', 'text/html');
            break;
        case '/dist/endereco.min.js':
            await serveFile(res, '/../dist/endereco.min.js', 'text/javascript');
            break;
        case '/dist/endereco.min.css':
            await serveFile(res, '/../dist/endereco.min.css', 'text/css');
            break;
        case '/proxyfile':
            handleProxyRequest(req, res);
            break;
        default:
            // Handle 404 Not Found
            res.writeHead(404);
            res.end('404 Not Found');
        }
    } catch (error) {
        res.writeHead(500);
        res.end('Internal Server Error');
        console.error(error);
    }
};

async function serveFile (res, filePath, contentType) {
    const contents = await fs.readFile(__dirname + filePath);

    res.setHeader('Content-Type', contentType);
    res.writeHead(200);
    res.end(contents);
}

function processPostRequest (req, res) {
    return new Promise((resolve, reject) => {
        req.on('end', () => {
            resolve();
        });
        req.on('error', (err) => {
            reject(err);
        });
        // Discard the body, 'end' only fires once it has been consumed.
        req.resume();
    });
}

function handleProxyRequest (req, res) {
    let postData = '';

    req.on('data', chunk => {
        postData += chunk;
    });
    req.on('end', () => {
        const options = {
            hostname: 'endereco-service.de',
            port: 80,
            path: '/rpc/v1',
            method: 'POST',
            headers: req.headers
        };

        const proxyReq = http.request(options, proxyRes => {
            let body = '';

            proxyRes.on('data', d => {
                body += d;
            });
            proxyRes.on('end', function () {
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(200);
                res.end(body);
            });
        });

        proxyReq.on('error', error => {
            console.error(error);
            res.writeHead(500);
            res.end('Internal Server Error');
        });

        proxyReq.write(postData);
        proxyReq.end();
    });
}

const server = http.createServer(requestListener);

server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
