#!/usr/bin/env node
// Serves the prerendered build like GitHub Pages does: <path>/index.html for
// directories, 404.html (or index.csr.html) for anything else.
// Usage: node scripts/serve-dist.mjs [port] [base]   e.g. 4330 /ng-email/
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const port = Number(process.argv[2] ?? 4330);
const base = (process.argv[3] ?? '/').replace(/\/?$/, '/');
const root = resolve(import.meta.dirname, '../dist/browser');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
};

function send(res, status, file) {
  res.writeHead(status, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (!url.pathname.startsWith(base)) {
    res.writeHead(302, { location: base }).end();
    return;
  }
  const rel = normalize(decodeURIComponent(url.pathname.slice(base.length)));
  const file = join(root, rel);
  if (!file.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  if (existsSync(file) && statSync(file).isFile()) return send(res, 200, file);
  if (existsSync(join(file, 'index.html'))) return send(res, 200, join(file, 'index.html'));
  const fallback = existsSync(join(root, '404.html')) ? join(root, '404.html') : join(root, 'index.csr.html');
  send(res, 404, fallback);
}).listen(port, '127.0.0.1', () => console.log(`serving ${root} at http://127.0.0.1:${port}${base}`));
