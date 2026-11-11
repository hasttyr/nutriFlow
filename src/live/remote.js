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

// Follows every region's live state. Each region pushes partial updates ({ kind, value });
// when its instance drops, the stream moves to the next replica.
export const followRegions = (onUpdate) => {
  const streams = Object.entries(directory.regions).map(([country, urls]) => {
    let index = 0;
    let source = null;
    let closed = false;
    const open = async () => {
      if (closed) return;
      const url = urls[index % urls.length];
      try {
        const token = await tokenFor(url, 'admin');
        source = new EventSource(`${url}/stream?token=${encodeURIComponent(token)}`);
        source.onmessage = (event) => onUpdate(country, JSON.parse(event.data));
        source.onerror = () => {
          source.close();
          index += 1;
          setTimeout(open, 1000);
        };
      } catch {
        index += 1;
        setTimeout(open, 1500);
      }
    };
    open();
    return () => {
      closed = true;
      source?.close();
    };
  });
  return () => streams.forEach((stop) => stop());
};
