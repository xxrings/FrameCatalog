const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(body);
}

function resolveFilePath(urlPath) {
  const safePath = decodeURIComponent(urlPath.split('?')[0] || '/');
  const relativePath = safePath === '/' ? 'index.html' : safePath.replace(/^\/+/, '');
  const fullPath = path.resolve(root, relativePath);

  if (!fullPath.startsWith(root)) return null;
  return fullPath;
}

const server = http.createServer((req, res) => {
  const filePath = resolveFilePath(req.url || '/');
  if (!filePath) {
    send(res, 403, 'Forbidden');
    return;
  }

  let resolvedPath = filePath;
  if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
    resolvedPath = path.join(resolvedPath, 'index.html');
  }

  fs.readFile(resolvedPath, (error, data) => {
    if (error) {
      send(res, 404, 'Not found');
      return;
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    send(res, 200, data, mimeTypes[ext] || 'application/octet-stream');
  });
});

server.on('error', error => {
  if (error && (error.code === 'EACCES' || error.code === 'EADDRINUSE')) {
    console.error(`Unable to start preview on http://127.0.0.1:${port}`);
    console.error('Try closing any existing preview window or set a different PORT before starting.');
    process.exit(1);
  }

  throw error;
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Preview running at http://127.0.0.1:${port}`);
  console.log('Press Ctrl+C to stop the preview server.');
});
