/**
 * NVIDIA NIM (build.nvidia.com) integration.
 *
 * NIM exposes an OpenAI-compatible Chat Completions API at
 *   https://integrate.api.nvidia.com/v1/chat/completions
 * with keys that start with `nvapi-`.
 *
 * IMPORTANT — browser CORS:
 *   integrate.api.nvidia.com sends no Access-Control-Allow-Origin header, so a
 *   direct fetch() from the browser is blocked. We therefore always route NIM
 *   traffic through a proxy prefix (`VITE_NVIDIA_PROXY_URL` in production, or
 *   the Vite dev proxy `/nvidia-api` locally). The proxy forwards the
 *   Authorization header untouched, so the NVIDIA key never has to be stored
 *   on the proxy.
 */

export const NVIDIA_API_HOST = 'https://integrate.api.nvidia.com/v1';

export const NVIDIA_KEY_PREFIX = 'nvapi-';

/** LocalStorage key used by Teacher Classroom / Inline Classroom settings. */
export const NVIDIA_LOCAL_KEY_STORAGE = 'meanai_nvidia_key';

/**
 * Models shown in the chat model picker (provider: 'nvidia').
 * `nvidia/llama-3.1-nemotron-ultra-253b-v1` is the NIM reference id from
 * docs.api.nvidia.com and is used as the safe default; everything else can be
 * overridden from Settings → NVIDIA NIM → Model.
 */
export const NVIDIA_MODELS = [
  {
    id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1',
    name: 'Nemotron Ultra 253B',
    provider: 'nvidia',
    icon: '◮',
    badge: 'NIM',
    kind: 'text',
  },
  {
    id: 'nvidia/llama-3.3-nemotron-super-49b-v1',
    name: 'Nemotron Super 49B',
    provider: 'nvidia',
    icon: '◭',
    badge: 'NIM',
    kind: 'text',
  },
  {
    id: 'meta/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    provider: 'nvidia',
    icon: '🦙',
    badge: 'NIM',
    kind: 'text',
  },
  {
    id: 'deepseek-ai/deepseek-r1',
    name: 'DeepSeek R1 (NIM)',
    provider: 'nvidia',
    icon: '◈',
    badge: 'NIM',
    kind: 'reasoning',
  },
  {
    id: 'qwen/qwen3-235b-a22b',
    name: 'Qwen3 235B (NIM)',
    provider: 'nvidia',
    icon: '◉',
    badge: 'NIM',
    kind: 'text',
  },
  {
    // Successor to Kimi K2 on NIM: 2.8T MoE (104B active), 1M-token context,
    // text + image + video input. Vendor id: kimi-k3.1-pro.
    id: 'moonshotai/kimi-k3.1-pro',
    name: 'Kimi K3.1 Pro',
    provider: 'nvidia',
    icon: '☾',
    badge: 'NIM',
    kind: 'multimodal',
    capabilities: { text: true, image: true, video: true, reasoning: true, longContext: true },
    description: 'Agentic coding, 3D modeling and finance · 1M context',
  },
  {
    id: 'mistralai/mistral-large-3-675b-instruct-2512',
    name: 'Mistral Large 3',
    provider: 'nvidia',
    icon: '◆',
    badge: 'NIM',
    kind: 'text',
  },
  {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    name: 'Nemotron Omni (Vision)',
    provider: 'nvidia',
    icon: '👁️',
    badge: 'NIM',
    kind: 'vision',
  },
];

/** Fallback model used when an image is sent to a text-only NIM model. */
export const NVIDIA_VISION_MODEL = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning';

/** Look up catalog metadata for a NIM model id. */
export function nvidiaModelInfo(modelId) {
  return NVIDIA_MODELS.find((m) => m.id === modelId) || null;
}

/**
 * Whether a NIM model accepts image parts. Kimi K3.1 Pro and the omni models
 * are multimodal; everything else in the catalog is text-only and returns a
 * 400 if sent image parts.
 */
export function nvidiaAcceptsImages(modelId) {
  const info = nvidiaModelInfo(modelId);
  if (info) return info.capabilities?.image === true || info.kind === 'vision';
  // Unknown (custom id from Settings): Moonshot and NVIDIA omni ids accept images.
  return /^moonshotai\//.test(modelId || '') || /omni/.test(modelId || '');
}

/** Default NIM model when the selected model is not a NIM one. */
export const DEFAULT_NVIDIA_MODEL = 'nvidia/llama-3.1-nemotron-ultra-253b-v1';

// ─────────────────────────────────────────────────────────────────────────────
// Key helpers
// ─────────────────────────────────────────────────────────────────────────────

export function isNvidiaKey(key) {
  return typeof key === 'string' && key.trim().startsWith(NVIDIA_KEY_PREFIX);
}

export function isNvidiaModel(model) {
  return !!model && model.provider === 'nvidia';
}

/**
 * Returns the key to use for a NIM request.
 * Priority: app/SDK key (if it looks like a NIM key) → locally saved NIM key.
 */
export function resolveNvidiaKey(sdkKey) {
  if (isNvidiaKey(sdkKey)) return sdkKey.trim();
  try {
    const local = localStorage.getItem(NVIDIA_LOCAL_KEY_STORAGE);
    if (local && local.trim()) return local.trim();
  } catch { /* ignore (SSR / privacy mode) */ }
  return '';
}

/**
 * Key resolution for explicit calls: a key passed directly to nvidiaStream /
 * nvidiaComplete / nvidiaListModels is trusted as-is (users sometimes paste it
 * without the nvapi- prefix), otherwise fall back to the stored key.
 */
function resolveExplicitKey(keyOverride, sdkKey) {
  if (typeof keyOverride === 'string' && keyOverride.trim()) return keyOverride.trim();
  return resolveNvidiaKey(sdkKey);
}

export function saveNvidiaLocalKey(key) {
  try {
    if (key && key.trim()) localStorage.setItem(NVIDIA_LOCAL_KEY_STORAGE, key.trim());
    else localStorage.removeItem(NVIDIA_LOCAL_KEY_STORAGE);
  } catch { /* ignore */ }
}

const isDevServer = (() => {
  try {
    return !!import.meta.env?.DEV;
  } catch {
    return false;
  }
})();

/**
 * Where NIM traffic is relayed to.
 *
 * `integrate.api.nvidia.com` sends no Access-Control-Allow-Origin header, so a
 * browser `fetch()` to it always fails. Requests therefore go to a same-origin
 * (or configured) relay:
 *
 *  1. `VITE_NVIDIA_PROXY_URL` — always wins. Point it at your deployed relay,
 *     e.g. https://<app>.vercel.app/api/nvidia
 *  2. Dev/preview server — `/nvidia-api`, proxied by vite.config.js
 *  3. Production build with nothing configured — fall back to the bundled
 *     Vercel edge function at `/api/nvidia` so the feature still works.
 *
 * If none of those exist the request 404s on the SPA fallback; `nvidiaFetch`
 * turns that into an actionable message instead of a bogus "model not found".
 */
export function getNvidiaProxyUrl() {
  let configured = '';
  try {
    configured = (import.meta.env?.VITE_NVIDIA_PROXY_URL || '').trim();
  } catch { /* ignore */ }

  let base = configured;
  if (!base) base = isDevServer ? '/nvidia-api' : '/api/nvidia';
  return base.replace(/\/+$/, '');
}

/** True when a relay is explicitly configured or shipped with the build. */
export function hasNvidiaRelay() {
  let configured = '';
  try {
    configured = (import.meta.env?.VITE_NVIDIA_PROXY_URL || '').trim();
  } catch { /* ignore */ }
  return !!configured || isDevServer;
}

/**
 * Chat completions endpoint. If a full URL is supplied it is treated as a
 * custom proxy and the NIM path is appended (unless it already ends with it).
 */
export function nvidiaChatUrl(customBase) {
  const base = (customBase || getNvidiaProxyUrl()).replace(/\/+$/, '');
  if (base.endsWith('/chat/completions')) return base;
  return `${base}/chat/completions`;
}

export function nvidiaModelsUrl(customBase) {
  const base = (customBase || getNvidiaProxyUrl()).replace(/\/+$/, '');
  if (base.endsWith('/models')) return base;
  return `${base}/models`;
}

/** Body the SPA fallback (index.html) returns when the proxy is missing. */
function looksLikeHtml(text) {
  const head = (text || '').slice(0, 200).toLowerCase();
  return head.includes('<!doctype html') || head.includes('<html');
}

function relayMissingError(url) {
  return new Error(
    `NVIDIA NIM relay not found at ${url || getNvidiaProxyUrl()} (got the app's 404 page). ` +
    'The NIM proxy only exists while running `vite dev`; a deployed build needs ' +
    'VITE_NVIDIA_PROXY_URL pointing at the api/nvidia.js relay ' +
    '(e.g. https://<your-app>.vercel.app/api/nvidia).',
  );
}

/**
 * fetch() wrapper for NIM relays. Distinguishes "the relay itself is missing"
 * (the SPA fallback answered with HTML) from a genuine upstream error such as
 * a retired model id (JSON body, real status) so users get the right message.
 */
export async function nvidiaFetch(url, options = {}) {
  let resp;
  try {
    resp = await fetch(url, options);
  } catch (err) {
    throw new Error(
      `Could not reach the NVIDIA NIM relay (${err.message}). ` +
      (hasNvidiaRelay()
        ? 'Check that the relay deployment is up.'
        : 'Set VITE_NVIDIA_PROXY_URL to your api/nvidia.js deployment.'),
    );
  }

  const contentType = resp.headers.get('content-type') || '';

  // Relay missing: SPA fallback served index.html (200 or 404) and/or a plain
  // HTML 404 page. Genuine NIM errors always come back as JSON.
  const maybeSpaFallback = contentType.includes('text/html') || resp.status === 404;
  if (!maybeSpaFallback) return resp;

  let body = '';
  try { body = await resp.text(); } catch { /* ignore */ }

  if (looksLikeHtml(body) || contentType.includes('text/html')) throw relayMissingError(url);
  if (resp.status === 404 && !body) throw relayMissingError(url);

  // Real JSON error from NIM (e.g. retired model) — hand it back to the caller.
  return new Response(body, { status: resp.status, headers: resp.headers });
}

// ─────────────────────────────────────────────────────────────────────────────
// Request / response helpers
// ─────────────────────────────────────────────────────────────────────────────

export function nvidiaHeaders(key, extra = {}) {
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
    ...extra,
  };
}

export function buildNvidiaPayload({
  model = DEFAULT_NVIDIA_MODEL,
  messages,
  systemPrompt,
  stream = true,
  maxTokens,
  temperature,
  topP,
  userContent,
  imageDataUrl,
}) {
  const finalMessages = [];
  if (systemPrompt) finalMessages.push({ role: 'system', content: systemPrompt });

  (messages || []).forEach((m) => {
    if (!m || !m.role || m.role === 'system') return;
    finalMessages.push({ role: m.role, content: m.content });
  });

  const payload = { model, messages: finalMessages, stream };
  if (maxTokens) payload.max_tokens = maxTokens;
  if (typeof temperature === 'number') payload.temperature = temperature;
  if (typeof topP === 'number') payload.top_p = topP;

  if (userContent !== undefined) {
    if (imageDataUrl) {
      // Multimodal models (Kimi K3.1 Pro, Nemotron Omni) take image parts as-is;
      // text-only models would 400, so route those to the vision fallback.
      if (!nvidiaAcceptsImages(payload.model)) payload.model = NVIDIA_VISION_MODEL;
      finalMessages.push({
        role: 'user',
        content: [
          { type: 'text', text: userContent || 'Describe this image.' },
          { type: 'image_url', image_url: { url: imageDataUrl } },
        ],
      });
    } else {
      finalMessages.push({ role: 'user', content: userContent });
    }
  }

  return payload;
}

/**
 * Extract the text delta from one SSE chunk. Reasoning models (DeepSeek R1,
 * Nemotron reasoning…) stream their chain of thought in `reasoning_content`.
 */
export function nvidiaDelta(chunk) {
  const choice = chunk?.choices?.[0];
  if (!choice) return '';
  return choice.delta?.content || '';
}

export function humanizeNvidiaError(status, bodyText, model) {
  let detail = '';
  try {
    const parsed = JSON.parse(bodyText);
    detail = parsed?.error?.message || parsed?.detail || parsed?.message || '';
  } catch { /* plain text body */ }
  if (!detail && bodyText) detail = bodyText.slice(0, 240);

  if (status === 401 || status === 403) {
    // NIM answers "Unauthorized" for models the key is not entitled to as well
    // as for bad keys, so point at both causes when a model id is known.
    const entitlement = model
      ? ` If your key works for other models, "${model}" may not be enabled for this account — check its page on build.nvidia.com or pick another NIM model.`
      : '';
    return `NVIDIA NIM rejected the request (${status}). Add/refresh your nvapi- key in Settings.${entitlement} ${detail}`.trim();
  }
  if (status === 404) {
    return `NVIDIA NIM model not found (404): "${model}". Verify the exact id with Settings → NVIDIA NIM → Browse models, or pick another NIM model. ${detail}`.trim();
  }
  if (status === 429) {
    return `NVIDIA NIM rate limit hit (429). Wait a moment or use a different NIM model. ${detail}`.trim();
  }
  if (status >= 500) {
    return `NVIDIA NIM is temporarily unavailable (${status}). Try again shortly. ${detail}`.trim();
  }
  return `NVIDIA NIM error ${status}. ${detail}`.trim();
}

async function readError(resp) {
  try {
    return await resp.text();
  } catch {
    return '';
  }
}

/**
 * Non-streaming completion. Returns the assistant text (reasoning models have
 * their `reasoning_content` prefixed so the user still sees the thought
 * process, matching the OpenAI-compatible NIM contract).
 */
export async function nvidiaComplete({
  key,
  keyOverride,
  model = DEFAULT_NVIDIA_MODEL,
  messages,
  systemPrompt,
  userContent,
  imageDataUrl,
  maxTokens,
  temperature,
  topP,
}) {
  const resolvedKey = resolveExplicitKey(keyOverride, key);
  if (!resolvedKey) throw new Error('Add your NVIDIA NIM API key (nvapi-…) in Settings to use these models.');

  const resp = await nvidiaFetch(nvidiaChatUrl(), {
    method: 'POST',
    headers: nvidiaHeaders(resolvedKey),
    body: JSON.stringify(
      buildNvidiaPayload({
        model,
        messages,
        systemPrompt,
        userContent,
        imageDataUrl,
        stream: false,
        maxTokens,
        temperature,
        topP,
      }),
    ),
  });

  if (!resp.ok) throw new Error(humanizeNvidiaError(resp.status, await readError(resp), model));

  const data = await resp.json();
  const message = data?.choices?.[0]?.message || {};
  const reasoning = message.reasoning_content ? `> 🧠 ${message.reasoning_content}\n\n` : '';
  return `${reasoning}${message.content || ''}`;
}

/**
 * Streaming completion. `onDelta(textSoFar)` is invoked for every token.
 * Returns the full assistant text.
 */
export async function nvidiaStream({
  key,
  keyOverride,
  model = DEFAULT_NVIDIA_MODEL,
  messages,
  systemPrompt,
  userContent,
  imageDataUrl,
  maxTokens,
  temperature,
  topP,
  stream = true,
  signal,
  onDelta,
}) {
  const resolvedKey = resolveExplicitKey(keyOverride, key);
  if (!resolvedKey) throw new Error('Add your NVIDIA NIM API key (nvapi-…) in Settings to use these models.');

  const resp = await nvidiaFetch(nvidiaChatUrl(), {
    method: 'POST',
    headers: nvidiaHeaders(resolvedKey),
    body: JSON.stringify(
      buildNvidiaPayload({
        model,
        messages,
        systemPrompt,
        userContent,
        imageDataUrl,
        stream,
        maxTokens,
        temperature,
        topP,
      }),
    ),
    signal,
  });

  if (!resp.ok) throw new Error(humanizeNvidiaError(resp.status, await readError(resp), model));

  // Some deployments ignore `stream: true` and answer with plain JSON.
  const contentType = resp.headers.get('content-type') || '';
  if (!resp.body || contentType.includes('application/json') && !contentType.includes('event-stream')) {
    const data = await resp.json();
    const message = data?.choices?.[0]?.message || {};
    const text = `${message.reasoning_content ? `> 🧠 ${message.reasoning_content}\n\n` : ''}${message.content || ''}`;
    if (text) onDelta?.(text);
    return text;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (!trimmed.startsWith('data: ')) continue;
      try {
        const parsed = JSON.parse(trimmed.slice(6));
        const delta = nvidiaDelta(parsed);
        if (delta) {
          full += delta;
          onDelta?.(full);
        }
      } catch { /* partial JSON — wait for the next chunk */ }
    }
  }

  return full;
}

/** GET /models — used by Settings to verify a key and list models. */
export async function nvidiaListModels(keyOverride) {
  const resolvedKey = resolveExplicitKey(keyOverride);
  if (!resolvedKey) throw new Error('Enter an nvapi- key first.');

  const resp = await nvidiaFetch(nvidiaModelsUrl(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${resolvedKey}`, Accept: 'application/json' },
  });
  if (!resp.ok) throw new Error(humanizeNvidiaError(resp.status, await readError(resp)));
  const data = await resp.json();
  return Array.isArray(data?.data) ? data.data.map((m) => m.id) : [];
}
