import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import edge from './netlify/edge-functions/social-preview.js';

const root = path.join(process.cwd(), 'dist');
const routes = { '/': 'index.html', '/beauty':'beauty.html', '/clinic-demo':'clinic-demo.html', '/consultant-demo':'consultant-demo.html', '/terms': 'terms.html', '/warranty': 'warranty.html', '/thank-you': 'thank-you.html' };
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp':'image/webp', '.ttf':'font/ttf', '.woff2':'font/woff2', '.json':'application/json', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.mp4':'video/mp4' };
const port = Number(process.env.QSE_PREVIEW_PORT || 4173);

function serveFile(file, req, res) {
  const size = fs.statSync(file).size;
  const type = mime[path.extname(file)] ?? 'application/octet-stream';
  const headers = {'Content-Type':type, 'Cache-Control':'no-store', 'Content-Length':size};
  const isVideo = type === 'video/mp4';
  if (isVideo) headers['Accept-Ranges'] = 'bytes';

  if (isVideo && req.method === 'GET' && req.headers.range) {
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    const start = range?.[1] ? Number(range[1]) : Math.max(0, size - Number(range?.[2]));
    const end = range?.[1] && range[2] ? Math.min(size - 1, Number(range[2])) : size - 1;
    if (!range || (!range[1] && !range[2]) || start >= size || end < start) {
      res.writeHead(416, {'Content-Range':`bytes */${size}`});
      res.end();
      return;
    }
    res.writeHead(206, {...headers, 'Content-Length':end - start + 1, 'Content-Range':`bytes ${start}-${end}/${size}`});
    fs.createReadStream(file, {start,end}).pipe(res);
    return;
  }
  res.writeHead(200, headers);
  if (req.method === 'HEAD') res.end();
  else fs.createReadStream(file).pipe(res);
}
export const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end('Local preview only'); return; }
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const request = new Request(new URL(req.url, `http://127.0.0.1:${port}`), {method:req.method});
  const response = await edge(request, {next:()=>null});
  if(response) {
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));
    return;
  }
  const relative = routes[pathname] ?? pathname.replace(/^\//, '');
  let file = path.resolve(root, relative);
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory()){
    if(!pathname.endsWith('/')){res.writeHead(301,{Location:pathname+'/'+new URL(req.url,'http://localhost').search});res.end();return;}
    file=path.join(file,'index.html');
  }
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    const demo404=path.join(root,'demos/digital-agency/404.html');
    if(pathname.startsWith('/demos/digital-agency/')&&fs.existsSync(demo404)){res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(fs.readFileSync(demo404));return;}
    res.writeHead(404); res.end('Not found'); return;
  }
  serveFile(file, req, res);
});
server.listen(port, '127.0.0.1', () => console.log(`Local preview: http://127.0.0.1:${port}/`));
