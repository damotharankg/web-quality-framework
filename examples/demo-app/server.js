import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3456;

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Set standard headers for live header audit
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;");

  if (pathname === '/' || pathname === '/index.html') {
    const html = fs.readFileSync(path.join(__dirname, 'src', 'index.html'), 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (pathname === '/products') {
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Products</title></head><body><h1>Products Catalog</h1><a href="/">Back to Home</a></body></html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (pathname === '/dashboard') {
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Dashboard</title></head><body><h1>User Dashboard</h1><a href="/">Back to Home</a></body></html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (pathname === '/about') {
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>About Us</title></head><body><h1>About Us</h1><a href="/">Back to Home</a></body></html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (pathname === '/app.js') {
    const js = fs.readFileSync(path.join(__dirname, 'src', 'app.js'), 'utf-8');
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(js);
    return;
  }

  if (pathname === '/logo.svg') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><rect width="120" height="40" fill="#3b82f6"/><text x="10" y="25" fill="#fff" font-family="sans-serif" font-size="14">ENTERPRISE</text></svg>`;
    res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
    res.end(svg);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`Demo Application server active at http://localhost:${PORT}`);
});

