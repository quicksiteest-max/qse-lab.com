import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import edge from './netlify/edge-functions/social-preview.js';

const root = path.join(process.cwd(), 'dist');
const routes = { '/': 'index.html', '/beauty':'beauty.html', '/clinic-demo':'clinic-demo.html', '/consultant-demo':'consultant-demo.html', '/terms': 'terms.html', '/warranty': 'warranty.html', '/thank-you': 'thank-you.html' };
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
export const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end('Local preview only'); return; }
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const request = new Request(new URL(req.url, 'http://127.0.0.1:4173'), {method:req.method});
  const response = await edge(request, {next:()=>null});
  if(response) {
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));
    return;
  }
  const relative = routes[pathname] ?? pathname.replace(/^\//, '');
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
  if (req.method === 'HEAD') { res.end(); return; }
  fs.createReadStream(file).pipe(res);
});
server.listen(4173, '127.0.0.1', () => console.log('Local preview: http://127.0.0.1:4173/'));
