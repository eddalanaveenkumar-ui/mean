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
| **NVIDIA NIM** | Nemotron, Llama 3.3, DeepSeek R1, Qwen3, Kimi K2, Mistral Large 3, Nemotron Omni (vision) | `nvapi-…` | Settings → **NVIDIA NIM** |

### NVIDIA NIM setup

1. Create a free key at [build.nvidia.com/models](https://build.nvidia.com/models).
2. Paste it in **Settings → NVIDIA NIM** and hit **Save & Test Key** (it calls
   `GET /v1/models` to verify).
3. Pick any model under **NVIDIA NIM** in the chat model picker. The Teacher
   Classroom, Inline Classroom, PPT generator, Freebuff agent and title
   generator all honour the NIM engine too.

NIM (`integrate.api.nvidia.com`) does not send CORS headers, so the browser
cannot call it directly. Requests therefore go through a same-origin relay:

- **Dev** — Vite proxies `/nvidia-api/*` → `https://integrate.api.nvidia.com/v1/*`
  (see `vite.config.js`); nothing to configure.
- **Production** — deploy the included edge function `api/nvidia.js` on Vercel
  and set `VITE_NVIDIA_PROXY_URL=https://<your-app>.vercel.app/api/nvidia`.
  The function only forwards to NVIDIA and adds CORS headers; the `nvapi-` key
  travels in the `Authorization` header and is never stored server-side.

Android builds are served from the app bundle, where the dev proxy does not
exist — set `VITE_NVIDIA_PROXY_URL` before `npx cap sync android`.
