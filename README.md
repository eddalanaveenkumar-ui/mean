# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


## AI providers

| Provider | Models | Key format | Where to add it |
| --- | --- | --- | --- |
| OpenRouter | `openrouter/free` + paid models | `sk-or-v1-…` | Login / Settings |
| Google Gemini | Gemini Flash (direct) | `AIza…` | Settings |
| OpenAI | GPT-4o / GPT-4o mini | `sk-…` | Login / Settings |
| **NVIDIA NIM** | Nemotron, Llama 3.3, DeepSeek R1, Qwen3, **Kimi K3.1 Pro** (text+image, 1M ctx), Mistral Large 3, Nemotron Omni (vision) | `nvapi-…` | Settings → **NVIDIA NIM** |

### NVIDIA NIM setup

1. Create a free key at [build.nvidia.com/models](https://build.nvidia.com/models).
2. Paste it in **Settings → NVIDIA NIM** and hit **Save & Test Key** (it calls
   `GET /v1/models` to verify).
3. Pick any model under **NVIDIA NIM** in the chat model picker. The Teacher
   Classroom, Inline Classroom, PPT generator, Freebuff agent and title
   generator all honour the NIM engine too.
4. If anything fails, open **Settings → NVIDIA NIM → Run diagnostics**. It
   checks relay → key → a real completion and prints the exact endpoint in use,
   so a broken relay never shows up as a bogus "model not found".
5. **Stale bundle check.** Relay errors are prefixed with the integration build
   (`[nim-v4]`) and Settings shows the same version. If your browser reports an
   older build than the current deploy — or you still see errors that contain
   `"undefined"`, which no current build can produce — hard-reload with
   Ctrl/Cmd+Shift+R. **Test a relay URL** in the same section probes any relay
   (`?action=models`, `/models`, `/v1/models`, bare base) and reports which
   shape answered.

NIM (`integrate.api.nvidia.com`) does not send CORS headers, so the browser
cannot call it directly. Requests therefore go through a same-origin relay:

| Environment | Relay used |
| --- | --- |
| `vite dev` / `vite preview` | `/nvidia-api` → `https://integrate.api.nvidia.com/v1/*` (built into `vite.config.js`, no setup) |
| Production / Vercel | `VITE_NVIDIA_PROXY_URL` if set, otherwise `/api/nvidia` (the bundled edge function `api/nvidia.js`) |

So a Vercel deploy works out of the box: `api/nvidia.js` is served at
`/api/nvidia` and the app calls it by default. To use a relay on another
domain, set `VITE_NVIDIA_PROXY_URL=https://…/api/nvidia` at build time.

The relay only forwards to NVIDIA and adds CORS headers; the `nvapi-` key
travels in the `Authorization` header and is never stored server-side.

### Vercel routing

`vercel.json` maps the relay explicitly, ahead of the SPA fallback:

```json
{ "source": "/api/nvidia/:path*",  "destination": "/api/nvidia" }
{ "source": "/nvidia-api/:path*",  "destination": "/api/nvidia" }
```

Both the query form (`/api/nvidia?action=chat`) and real sub-paths
(`/api/nvidia/chat/completions`) therefore reach the function. `index.html` is
served with `no-cache`, so a deploy never leaves browsers pinned to an old
bundle.

### Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `NVIDIA NIM relay not found at …` | The relay URL doesn't answer with JSON. On Vercel the function is a single route, so the app calls `/api/nvidia?action=chat` and `?action=models`; if you point `VITE_NVIDIA_PROXY_URL` elsewhere it must accept those (or real sub-paths such as `/chat/completions`). Use **Run diagnostics** to see which URL failed. |
| `The NVIDIA NIM relay at … was blocked by CORS` | The relay is on another origin without `Access-Control-Allow-Origin`. Deploy this repo's `api/nvidia.js` (it sets the header) or proxy the relay through the app's own domain. |
| `Could not list NVIDIA NIM models (404 …)` | `/models` reached something that isn't the relay — usually the app's own 404 page because the function wasn't deployed. |
| `NVIDIA NIM model not found (404): "…"` | That id is retired/renamed. Settings → NVIDIA NIM → **Save & Test Key** loads the live model list; choose the id there. |
| `NVIDIA NIM rejected the request (401)` | Either the key is stale, or that specific model isn't enabled for your account (NIM answers `Unauthorized` for some models, e.g. Kimi K3.1 Pro on some tiers). Confirm your key works with another NIM model, else check the model page on build.nvidia.com. |
| Switched to a vision model automatically | Multimodal models (Kimi K3.1 Pro, Nemotron Omni) receive images directly; text-only models are routed to the omni fallback, since they'd reject image parts with a 400. |

Android builds are served from the app bundle, where the dev proxy does not
exist — set `VITE_NVIDIA_PROXY_URL` before `npx cap sync android`.
