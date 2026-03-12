const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4173;
const ROOT = process.cwd();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.php': 'text/plain; charset=utf-8'
};

function safePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  const withoutLeading = clean.replace(/^\/+/, '');
  let candidate = withoutLeading || 'index.html';
  if (!path.extname(candidate)) {
    if (candidate === '') candidate = 'index.html';
    else candidate = `${candidate}.html`;
  }
  const abs = path.join(ROOT, candidate);
  if (!abs.startsWith(ROOT)) return null;
  return abs;
}

const server = http.createServer((req, res) => {
  const abs = safePath(req.url || '/');
  if (!abs) {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }

  fs.readFile(abs, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    const ext = path.extname(abs).toLowerCase();
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    res.writeHead(200);
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1');
