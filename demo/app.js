const express = require('express');
const path = require('path');
const http = require('http');
const cors = require('cors');
const nunjucks = require('nunjucks');

const app = express();
const host = 'localhost';
const port = 8888;

nunjucks.configure(path.join(__dirname, 'views'), {
    autoescape: true,
    express: app
});

app.set('view engine', 'njk');

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
    res.sendStatus(204); // No Content
});

// Serve static files from the "assets" directory
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res) => {
    res.render('index', { currentPage: '/' });
});

app.all('/use-cases/:usecase/', (req, res) => {
    let submittedData = null;
    if (req.method === 'POST') {
        submittedData = req.body;
    }
    const usecase = req.params.usecase;
    res.render(`use-cases/${usecase}`, { submittedData, currentPage: `/use-cases/${usecase}` });
});

app.post('/proxyfile', async (req, res) => {
    let postData = req.body;

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
            res.setHeader("Content-Type", "application/json");
            res.status(200).send(body);
        });
    });

    proxyReq.on('error', error => {
        console.error(error);
        res.status(500).send('Internal Server Error');
    });

    proxyReq.write(JSON.stringify(postData));
    proxyReq.end();
});

// Start server
app.listen(port, host, () => {
  console.log(`Demonstration is running on http://${host}:${port}. Press CTRL+C to quit.`);
});