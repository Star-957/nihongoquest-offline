import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative, sep } from 'node:path';

// Only serve build output. An explicit allowlist prevents traversal, dotfile,
// source, dependency or directory disclosure, including encoded URL variants.
export async function startServer(port = Number(process.env.PORT ?? 4173)) {
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const files = new Map();
async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) await collect(path);
    else if (entry.isFile() && /\.(?:html|css|js)$/.test(entry.name)) {
      files.set('/' + relative(root, path).split(sep).join('/'), path);
    }
  }
}
try { await collect(root); } catch {
  throw new Error('No build found. Run npm run build first.');
}
if (!files.has('/index.html')) {
  throw new Error('Incomplete build. Run npm run build first.');
}
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('PORT must be an integer from 1024 to 65535.');
}
const csp = "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'none'; img-src 'none'; font-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
const server = createServer(async (request, response) => {
  response.setHeader('Content-Security-Policy', csp);
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Cache-Control', 'no-store');
  if (request.headers.host !== `127.0.0.1:${port}` && request.headers.host !== `localhost:${port}`) {
    response.writeHead(403).end('Use the loopback URL shown in the terminal.'); return;
  }
  if (!['GET', 'HEAD'].includes(request.method ?? '')) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end(); return;
  }
  let path;
  try { path = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname); }
  catch { response.writeHead(400).end('Invalid URL'); return; }
  const file = files.get(path === '/' ? '/index.html' : path);
  if (!file) { response.writeHead(404).end('Not found'); return; }
  try {
    const body = await readFile(file);
    const type = file.endsWith('.html') ? 'text/html' : file.endsWith('.css') ? 'text/css' : 'text/javascript';
    response.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch { response.writeHead(500).end('Could not read build output'); }
});
await new Promise((ok, fail) => { server.once('error', fail); server.listen(port, '127.0.0.1', ok); });
return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const server = await startServer();
    console.log(`NihongoQuest: http://127.0.0.1:${server.address().port}`);
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
      server.closeAllConnections(); server.close();
    });
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
