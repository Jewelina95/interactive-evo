# Interactive Evo — research website

An external-facing research site for process-oriented evaluation of multi-turn AI. It combines
76 reviewed case records with a transparent interface preview. Neither path presents a hidden
model call as live inference.

## Run locally

```bash
python3 server.py --port 8787
```

Open <http://127.0.0.1:8787>.

## Publish the research site

The front end is static and can be published on GitHub Pages. In the repository settings,
open **Pages**, choose **Deploy from a branch**, and select `main` with the `/ (root)` folder.
The site will be available at <https://jewelina95.github.io/interactive-evo/> after Pages finishes
its first build. The `research.html` journal is published alongside the case explorer.

GitHub Pages serves the static interface and reviewed case records. It does not run `server.py`,
so the local `/api/v1/*` endpoints and API-backed preview require a separate Python-capable host.
The static case explorer continues to work on Pages; do not set `apiBase` to a local-only URL.

For local use, start the complete interface and API together:

```bash
python3 server.py --port 8787
```

## Case data

Browser-ready records are generated from the case markdown collection:

```bash
python3 scripts/build_cases.py
```

This writes a compact index to `data/cases.json` and one on-demand JSON record per case under
`data/cases/`. The static files allow the full case explorer to work on GitHub Pages or any plain
HTTP host.

## API contract

The local server exposes a versioned interface:

- `GET /api/v1/status`
- `GET /api/v1/schema`
- `GET /api/v1/cases`
- `GET /api/v1/cases/{case_id}`
- `POST /api/v1/evaluate`

Fixed replay request:

```json
{"case_id": "case_043", "mode": "fixed"}
```

Interface preview request:

```json
{
  "mode": "preview",
  "transcript": "User: ...\nAssistant: ..."
}
```

Preview mode only validates and structures the transcript; it does not generate a benchmark
score. `mode: "live"` intentionally returns `501 LIVE_PROVIDER_NOT_CONFIGURED` until a provider
is attached.

To connect a deployed service, set `apiBase` in `config.js`:

```js
window.INTERACTIVE_EVO_CONFIG = { apiBase: 'https://api.example.org' };
```

The future live request contract accepts `messages` and `provider`, so the presentation layer
does not need to change when the model endpoint is added.

## Design principles

- research claim first, visual effects second;
- fixed data is explicitly labelled as fixed;
- case evidence remains inspectable at turn level;
- no external JavaScript, CSS, font or analytics dependency;
- responsive, keyboard-accessible controls and reduced-motion support.
