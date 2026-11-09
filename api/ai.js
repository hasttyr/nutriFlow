// Vercel Function: forwards the planner's chat request to Pollinations.
// Pollinations rejects anonymous calls made from a browser (it asks for a Turnstile token), but
// answers server-to-server ones. With POLLINATIONS_KEY set in Vercel, the keyed endpoint is used.
// The browser never sees a key, and only the messages are forwarded (nothing else from the client).

export const maxDuration = 80;

const ANONYMOUS_URL = 'https://text.pollinations.ai/openai';
const KEYED_URL = 'https://gen.pollinations.ai/v1/chat/completions';
const MAX_CHARS = 20000;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const messages = Array.isArray(body?.messages)
    ? body.messages
        .filter((message) => ['system', 'user'].includes(message?.role) && typeof message.content === 'string')
        .slice(0, 4)
    : [];
  if (!messages.length || messages.reduce((total, message) => total + message.content.length, 0) > MAX_CHARS) {
    return Response.json({ error: 'Invalid messages' }, { status: 400 });
  }

  const key = process.env.POLLINATIONS_KEY;
  try {
    const upstream = await fetch(key ? KEYED_URL : ANONYMOUS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
      body: JSON.stringify({ model: key ? 'openai' : 'openai-fast', reasoning_effort: 'low', max_tokens: 4000, messages }),
      signal: AbortSignal.timeout(72000)
    });
    const text = await upstream.text();
    return new Response(text, { status: upstream.status, headers: { 'Content-Type': 'application/json' } });
  } catch {
    return Response.json({ error: 'AI did not answer' }, { status: 504 });
  }
}
