/**
 * CORS relay for NVIDIA NIM (Vercel Edge Function).
 *
 * NVIDIA's gateway (integrate.api.nvidia.com) sends no Access-Control-Allow-Origin
 * header, so browsers cannot call it directly. This function forwards the
 * request (Authorization header included) and adds CORS headers to the reply —
 * the nvapi- key is never stored here.
 *
 * Deploy → https://<app>.vercel.app/api/nvidia
 * Then set VITE_NVIDIA_PROXY_URL=https://<app>.vercel.app/api/nvidia
 * (In `vite dev` the /nvidia-api Vite proxy is used instead.)
 */
export const config = { runtime: 'edge' };

const NVIDIA_BASE = 'https://integrate.api.nvidia.com/v1';
const ALLOWED_HEADERS = 'authorization,content-type,accept';

const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': ALLOWED_HEADERS,
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin',
});

const json = (status, body, origin) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });

export default async function handler(req) {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' }, origin);
  }

  const url = new URL(req.url);
  // /api/nvidia/chat/completions → /chat/completions  (base already ends in /v1)
  const upstreamPath = url.pathname
    .replace(/^\/api\/nvidia/, '')
    .replace(/^\/nvidia-api/, '');

  if (!upstreamPath.startsWith('/')) {
    return json(400, { error: 'Bad proxy path' }, origin);
  }

  // Buffer the request body: passing a ReadableStream straight to fetch needs
  // `duplex: 'half'`, which some runtimes reject. NIM payloads are JSON.
  const requestBody = req.method === 'POST' ? await req.text() : undefined;

  let upstream;
  try {
    upstream = await fetch(`${NVIDIA_BASE}${upstreamPath}${url.search}`, {
      method: req.method,
      headers: {
        Authorization: req.headers.get('authorization') || '',
        'Content-Type': req.headers.get('content-type') || 'application/json',
        Accept: req.headers.get('accept') || 'text/event-stream',
      },
      body: requestBody,
    });
  } catch (err) {
    return json(502, { error: `NIM upstream unreachable: ${err.message}` }, origin);
  }

  const headers = new Headers(upstream.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  headers.delete('content-encoding');
  headers.delete('content-length');

  return new Response(upstream.body, { status: upstream.status, headers });
}
