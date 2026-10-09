# Interactive Evo — research website

An external-facing research site for process-oriented evaluation of multi-turn AI. The current
demo is deliberately **fixed**: it replays 76 reviewed case records and never presents a hidden
model call as live inference.

## Run locally

```bash
python3 server.py --port 8787
```

Open <http://127.0.0.1:8787>.

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
- `GET /api/v1/cases`
- `GET /api/v1/cases/{case_id}`
- `POST /api/v1/evaluate`

Current request:

```json
{"case_id": "case_043", "mode": "fixed"}
```

`mode: "live"` intentionally returns `501 LIVE_PROVIDER_NOT_CONFIGURED`. A future model provider
can implement the same response contract without changing the presentation layer.

## Design principles

- research claim first, visual effects second;
- fixed data is explicitly labelled as fixed;
- case evidence remains inspectable at turn level;
- no external JavaScript, CSS, font or analytics dependency;
- responsive, keyboard-accessible controls and reduced-motion support.
