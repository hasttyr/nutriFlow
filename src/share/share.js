import { getProductById } from '../data/products';

// Multi-device without a server: the list (and the weekly plan) travel inside the URL fragment,
// compressed. The fragment never reaches any server; the other device decodes it locally.

const toBase64Url = (bytes) => {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
};

const fromBase64Url = (text) => {
  const binary = atob(text.replaceAll('-', '+').replaceAll('_', '/'));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Response(bytes).body.pipeThrough(stream)).arrayBuffer());
const canCompress = typeof CompressionStream === 'function';

// { items: [{ id, quantity }], plan?: { summary, days, source } } → "z<base64>" or "j<base64>"
export const encodeShare = async ({ items, plan }) => {
  const payload = {
    v: 1,
    l: items.map((item) => [item.id, item.quantity]),
    ...(plan ? { p: { s: plan.summary ?? '', o: plan.source, d: plan.days.map((day) => [day.breakfast, day.lunch, day.dinner]) } } : {})
  };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  return canCompress ? `z${toBase64Url(await pipe(bytes, new CompressionStream('deflate-raw')))}` : `j${toBase64Url(bytes)}`;
};

export const decodeShare = async (code) => {
  const bytes = fromBase64Url(code.slice(1));
  const raw = code[0] === 'z' ? await pipe(bytes, new DecompressionStream('deflate-raw')) : bytes;
  const payload = JSON.parse(new TextDecoder().decode(raw));
  if (payload?.v !== 1 || !Array.isArray(payload.l)) throw new Error('Invalid share');
  const items = payload.l
    .filter(([id, quantity]) => getProductById(id) && Number.isInteger(quantity) && quantity > 0)
    .map(([id, quantity]) => ({ id, quantity: Math.min(quantity, 100) }));
  const plan = payload.p
    ? {
        summary: payload.p.s || null,
        source: payload.p.o,
        days: payload.p.d.slice(0, 7).map(([breakfast, lunch, dinner]) => ({ breakfast, lunch, dinner })),
        items
      }
    : null;
  return { items, plan };
};

export const shareUrl = (code) => `${window.location.origin}/share#${code}`;
