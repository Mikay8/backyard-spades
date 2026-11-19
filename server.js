// Zero-dependency static server for the Expo web export (dist/).
// Used in production on Railway: build runs `npm run build:web`, then
// `node server.js` serves dist/ on $PORT with SPA fallback to index.html.
// Mirrors Flapjack21's server.js.
const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = path.join(__dirname, 'dist');
const PORT = process.env.PORT || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const TITLE = 'Backyard Spades — pick a family partner, promise your rounds, win the backyard';
const DESCRIPTION =
  'Backyard Spades — pick a family partner, promise your rounds, win the backyard. Points only — no real-money gambling.';

function sendFile(res, filePath, status = 200) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  // Hashed bundles/assets can cache forever; HTML must stay fresh so a new
  // deploy shows up immediately.
  const cache = ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable';
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': cache });
  if (ext === '.html') {
    // The Expo static export ships no <title>/<meta description> (the app
    // sets the tab title at runtime via expo-router Head). Inject static
    // ones here so crawlers and link previews see them too.
    let html = fs.readFileSync(filePath, 'utf8');
    if (!html.includes('<title')) {
      html = html.replace(
        '<head>',
        `<head><title>${TITLE}</title><meta name="description" content="${DESCRIPTION}"/>`,
      );
    }
    res.end(html);
    return;
  }
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end();
    return;
  }
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }
  const safe = path.normalize(path.join(ROOT, urlPath));
  if (!safe.startsWith(ROOT)) {
    res.writeHead(403).end();
    return;
  }
  // Exact file, then directory index, then the SPA entry point.
  if (fs.existsSync(safe) && fs.statSync(safe).isFile()) return sendFile(res, safe);
  const asHtml = safe + '.html';
  if (fs.existsSync(asHtml)) return sendFile(res, asHtml);
  const dirIndex = path.join(safe, 'index.html');
  if (fs.existsSync(dirIndex)) return sendFile(res, dirIndex);
  return sendFile(res, path.join(ROOT, 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backyard Spades web serving dist/ on port ${PORT}`);
});
