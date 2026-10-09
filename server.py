#!/usr/bin/env python3
"""Serve the Interactive Evo research site and its versioned evaluation API."""

from __future__ import annotations

import argparse
import json
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse


HERE = Path(__file__).resolve().parent
DATA_DIR = HERE / "data"
CASE_DIR = DATA_DIR / "cases"
CASE_SUMMARIES = json.loads((DATA_DIR / "cases.json").read_text(encoding="utf-8"))
CASE_IDS = {item["id"] for item in CASE_SUMMARIES}


def load_case(case_id: str) -> dict:
    if case_id not in CASE_IDS:
        raise KeyError(case_id)
    return json.loads((CASE_DIR / f"{case_id}.json").read_text(encoding="utf-8"))


class Handler(BaseHTTPRequestHandler):
    server_version = "InteractiveEvo/1.0"

    def log_message(self, fmt: str, *args) -> None:
        print(f"[interactive-evo] {self.address_string()} {fmt % args}")

    def json_response(self, data, status: int = 200) -> None:
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        path = unquote(urlparse(self.path).path)
        if path in {"/api/scenes", "/api/v1/cases"}:
            return self.json_response(CASE_SUMMARIES)
        if path.startswith("/api/v1/cases/"):
            case_id = path.rsplit("/", 1)[-1]
            try:
                return self.json_response(load_case(case_id))
            except KeyError:
                return self.json_response({"error": "Unknown case_id"}, 404)
        if path in {"/health", "/api/v1/status"}:
            return self.json_response({
                "ok": True,
                "mode": "fixed",
                "cases": len(CASE_SUMMARIES),
                "live_provider": False,
                "api_version": "v1",
            })
        relative = "index.html" if path == "/" else path.lstrip("/")
        target = (HERE / relative).resolve()
        if HERE not in target.parents and target != HERE:
            return self.send_error(403)
        if not target.is_file():
            return self.send_error(404)
        body = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mimetypes.guess_type(target.name)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache" if target.suffix in {".html", ".js", ".css"} else "public, max-age=3600")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self) -> None:  # noqa: N802
        if urlparse(self.path).path not in {"/api/evaluate", "/api/v1/evaluate"}:
            return self.send_error(404)
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length) or b"{}")
            mode = str(payload.get("mode", "fixed"))
            case_id = str(payload.get("case_id", ""))
            if mode != "fixed":
                return self.json_response({
                    "error": "Live evaluation provider is not configured",
                    "code": "LIVE_PROVIDER_NOT_CONFIGURED",
                    "accepted_contract": {"case_id": "string", "mode": "live", "provider": "string"},
                }, 501)
            try:
                record = load_case(case_id)
            except KeyError:
                return self.json_response({"error": "Unknown case_id"}, 404)
            return self.json_response({
                "mode": "fixed",
                "schema_version": "interactive-evo/v1",
                "case": record,
            })
        except (ValueError, json.JSONDecodeError) as exc:
            return self.json_response({"error": f"Invalid request: {exc}"}, 400)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8787)
    args = parser.parse_args()
    print(f"Interactive Evo: http://{args.host}:{args.port}")
    ThreadingHTTPServer((args.host, args.port), Handler).serve_forever()
