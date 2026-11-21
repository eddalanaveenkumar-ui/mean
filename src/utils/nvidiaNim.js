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

/** Models shown in the chat model picker (provider: 'nvidia'). */
export const NVIDIA_MODELS = [
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b',
    name: 'Nemotron 3 Ultra',
    provider: 'nvidia',
    icon: '◮',
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
    id: 'moonshotai/kimi-k2-instruct',
    name: 'Kimi K2 (NIM)',
    provider: 'nvidia',
    icon: '☾',
    badge: 'NIM',
    kind: 'text',
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

/** Default NIM model when the selected model is not a NIM one. */
export const DEFAULT_NVIDIA_MODEL = 'meta/llama-3.3-70b-instruct';

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

export function getNvidiaProxyUrl() {
  let base = '';
  try {
    base = (import.meta.env.VITE_NVIDIA_PROXY_URL || '').trim();
  } catch { /* import.meta.env always exists in Vite */ }
  if (!base) base = '/nvidia-api';
  return base.replace(/\/+$/, '');
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

  if (userContent !== undefined) {
    if (imageDataUrl) {
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

  const payload = { model, messages: finalMessages, stream };
  if (maxTokens) payload.max_tokens = maxTokens;
  if (typeof temperature === 'number') payload.temperature = temperature;
  if (typeof topP === 'number') payload.top_p = topP;
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

export function humanizeNvidiaError(status, bodyText) {
  let detail = '';
  try {
    const parsed = JSON.parse(bodyText);
    detail = parsed?.error?.message || parsed?.detail || parsed?.message || '';
  } catch { /* plain text body */ }
  if (!detail && bodyText) detail = bodyText.slice(0, 240);

  if (status === 401 || status === 403) {
    return `NVIDIA NIM rejected the API key (${status}). Add/refresh your nvapi- key in Settings. ${detail}`.trim();
  }
  if (status === 404) {
    return `NVIDIA NIM model not found (404). The model may have been retired — pick another NIM model. ${detail}`.trim();
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

  const resp = await fetch(nvidiaChatUrl(), {
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

  if (!resp.ok) throw new Error(humanizeNvidiaError(resp.status, await readError(resp)));

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

  const resp = await fetch(nvidiaChatUrl(), {
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

  if (!resp.ok) throw new Error(humanizeNvidiaError(resp.status, await readError(resp)));

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

  const resp = await fetch(nvidiaModelsUrl(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${resolvedKey}`, Accept: 'application/json' },
  });
  if (!resp.ok) throw new Error(humanizeNvidiaError(resp.status, await readError(resp)));
  const data = await resp.json();
  return Array.isArray(data?.data) ? data.data.map((m) => m.id) : [];
}
