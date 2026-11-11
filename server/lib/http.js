import http from 'node:http';

// A small HTTP layer on node:http: JSON in and out, CORS for the web app, a size limit on bodies.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const MAX_BODY = 64 * 1024;

const readJson = (req) =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new HttpError(413, 'Body too large'));
        req.destroy();
      } else chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new HttpError(400, 'Invalid JSON'));
      }
    });
    req.on('error', reject);
  });

// routes: [[method, /regex/, handler({ params, body, query, req, res }) → { status, body } | undefined]]
// A handler that writes the response itself (Server-Sent Events) returns undefined.
export const serve = (port, routes, name) => {
  const server = http.createServer(async (req, res) => {
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('access-control-allow-headers', 'content-type, authorization');
    res.setHeader('access-control-allow-methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.writeHead(204).end();
    const url = new URL(req.url, 'http://local');
    try {
      for (const [method, pattern, handler] of routes) {
        const match = req.method === method && url.pathname.match(pattern);
        if (!match) continue;
        const body = method === 'POST' || method === 'PUT' ? await readJson(req) : {};
        const result = await handler({ params: match.slice(1).map(decodeURIComponent), body, query: url.searchParams, req, res });
        if (!result) return undefined;
        res.writeHead(result.status ?? 200, { 'content-type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(result.body ?? {}));
      }
      throw new HttpError(404, 'Not found');
    } catch (error) {
      const status = error.status ?? 500;
      if (status === 500) console.error(`[${name}]`, error);
      if (!res.headersSent) res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: status === 500 ? 'Internal error' : error.message }));
    }
  });
  return new Promise((resolve) => server.listen(port, '0.0.0.0', () => resolve(server)));
};
