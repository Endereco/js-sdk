const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const https = require('https');
const cors = require('cors');
const app = express();
const host = 'localhost';
const port = 8888;
const syncPort = 3000;

const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;
const HTTP_NOT_FOUND = 404;
const HTTP_INTERNAL_SERVER_ERROR = 500;

// Helper function to read a file
async function readFile (filePath, res, contentType) {
    try {
        const contents = await fs.readFile(filePath);

        res.setHeader('Content-Type', contentType);
        res.status(HTTP_OK).send(contents);
    } catch (error) {
        res.status(HTTP_NOT_FOUND).send('Datei nicht gefunden');
    }
}

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());
app.options('*', cors());

// Set CORS headers for the proxyfile route
app.options('/proxyfile', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Agent, X-Auth-Key, X-Remote-Api-Url, X-Transaction-Id, X-Transaction-Referer');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendStatus(HTTP_NO_CONTENT);
});

// Serve static files from the "assets" directory
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Define routes
const router = express.Router();

// Handle POST requests to /use-cases
router.post('/use-cases/:usecase', (req, res) => {
    // Handle your POST request here
    // You can access the posted data with req.body
    const filePath = path.join(__dirname, `/use-cases/${req.params.usecase}/index.html`);

    readFile(filePath, res, 'text/html');
});

// Handle GET requests to /use-cases
router.get('/use-cases/:usecase', (req, res) => {
    const filePath = path.join(__dirname, `/use-cases/${req.params.usecase}/index.html`);

    readFile(filePath, res, 'text/html');
});

// Serve index page
router.get('/', async (req, res) => {
    const usecases = await fs.readdir(path.join(__dirname, 'use-cases'));
    const directories = await Promise.all(usecases.map(async (file) => {
        const stat = await fs.stat(path.join(__dirname, 'use-cases', file));

        return stat.isDirectory() ? file : null;
    }));

    const links = directories.filter(Boolean).map(dir => `<a href="/use-cases/${dir}">${dir}</a>`);

    res.send(`Verfügbare Testfälle: ${links.join(', ')}`);
});

// Proxy file upload
router.post('/proxyfile', (req, res) => {
    const serverUrl = req.header('x-remote-api-url') ?? 'staging.endereco-service.de';
    const postData = req.body;

    const options = {
        hostname: serverUrl,
        port: 443,
        path: '/rpc/v1',
        method: 'POST',
        headers: req.headers,
        servername: serverUrl
    };

    delete options.headers['accept-encoding'];

    const proxyReq = https.request(options, proxyRes => {
        let body = '';

        proxyRes.on('data', d => {
            body += d;
        });
        proxyRes.on('end', function () {
            res.setHeader('Content-Type', 'application/json');
            res.status(HTTP_OK).send(body);
        });
    });

    proxyReq.on('error', error => {
        console.error(error);
        res.status(HTTP_INTERNAL_SERVER_ERROR).send('Internal Server Error');
    });

    proxyReq.write(JSON.stringify(postData));
    proxyReq.end();
});

// Catch all other routes
router.post('*', (req, res) => {
    res.redirect('/');
});

// Use the router
app.use('/', router);

// Handle errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || HTTP_INTERNAL_SERVER_ERROR).send(err.message || 'Internal Server Error');
});

// Start server
app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port} and starts with browsersync from http://${host}:${syncPort}`);
});
