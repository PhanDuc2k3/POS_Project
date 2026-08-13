const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const REQUESTED_PORT = parseInt(process.env.PORT, 10) || 3003;
const HAS_EXPLICIT_PORT = Boolean(process.env.PORT);
let currentPort = REQUESTED_PORT;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(url.pathname);

  if (pathname === '/') {
    pathname = '/index.html';
  }

  const filePath = path.join(ROOT, pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return sendFile(res, filePath);
  }

  return sendFile(res, path.join(ROOT, 'index.html'));
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && !HAS_EXPLICIT_PORT) {
    currentPort += 1;
    console.warn(`Port ${currentPort - 1} is busy, trying http://localhost:${currentPort}`);
    server.listen(currentPort);
    return;
  }

  throw err;
});

server.listen(currentPort, () => {
  console.log(`POS Admin App running at http://localhost:${currentPort}`);
});
