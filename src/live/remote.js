import directory from '../../server/directory.json';

// Live mode (`npm run dev:live`): the four apps talk to the regional servers instead of sharing
// state inside the browser. Commands go by HTTP to the region of the order's country; state
// comes back pushed by each region over Server-Sent Events. The directory (server/directory.json)
// is the naming service: country → region URLs, primary first, then replicas.
export const REMOTE = import.meta.env?.VITE_LIVE === '1';

const tokens = new Map();

const tokenFor = async (url, role) => {
  const key = `${url}|${role}`;
  if (!tokens.has(key)) {
    const response = await fetch(`${url}/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ role }),
      signal: AbortSignal.timeout(4000)
    });
    if (!response.ok) throw new Error(`session ${response.status}`);
    tokens.set(key, (await response.json()).token);
  }
  return tokens.get(key);
};

// Sends a command to a country's region; when an instance does not answer (network error,
// timeout, 5xx) the next replica in the directory takes it: failover.
export const call = async (country, path, { method = 'POST', body, role }) => {
  let lastError;
  for (const url of directory.regions[country] ?? []) {
    try {
      const response = await fetch(`${url}${path}`, {
        method,
        headers: { 'content-type': 'application/json', authorization: `Bearer ${await tokenFor(url, role)}` },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(5000)
      });
      if (response.status >= 500) throw new Error(`${url} ${response.status}`);
      const data = await response.json().catch(() => null);
      if (!response.ok) throw Object.assign(new Error(data?.error ?? response.statusText), { status: response.status });
      return data;
    } catch (error) {
      if (error.status) throw error; // the region answered: a business error, not a failure
      lastError = error;
    }
  }
  throw lastError ?? new Error(`No region for ${country}`);
};

// Which instance serves each country right now, for the header badge: { CO: { instance, url, up } }.
// Instances are named as the launcher names them: co-1 is the primary, co-2 the first replica.
let connections = {};
const watchers = new Set();
const setConnection = (country, value) => {
  connections = { ...connections, [country]: value };
  watchers.forEach((watcher) => watcher());
};
export const getConnections = () => connections;
export const subscribeConnections = (watcher) => {
  watchers.add(watcher);
  return () => watchers.delete(watcher);
};

// Follows the live state of the given countries' regions. Each region pushes partial updates
// ({ kind, value }); when its instance drops, the stream moves to the next replica (failover).
export const followRegions = (countries, onUpdate, role = 'admin') => {
  const streams = countries.filter((country) => directory.regions[country]).map((country) => {
    const urls = directory.regions[country];
    let index = 0;
    let source = null;
    let closed = false;
    let timer = null;
    const retry = (ms) => {
      if (closed) return;
      setConnection(country, { ...connections[country], up: false });
      index += 1;
      timer = setTimeout(open, ms);
    };
    const open = async () => {
      if (closed) return;
      const url = urls[index % urls.length];
      try {
        const token = await tokenFor(url, role);
        if (closed) return;
        source = new EventSource(`${url}/stream?token=${encodeURIComponent(token)}`);
        source.onopen = () => setConnection(country, { instance: `${country.toLowerCase()}-${(index % urls.length) + 1}`, url, up: true });
        source.onmessage = (event) => onUpdate(country, JSON.parse(event.data));
        source.onerror = () => {
          source.close();
          tokens.delete(`${url}|${role}`);
          retry(1000);
        };
      } catch {
        retry(1500);
      }
    };
    open();
    return () => {
      closed = true;
      clearTimeout(timer);
      source?.close();
      connections = Object.fromEntries(Object.entries(connections).filter(([key]) => key !== country));
      watchers.forEach((watcher) => watcher());
    };
  });
  return () => streams.forEach((stop) => stop());
};
