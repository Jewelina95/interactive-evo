#!/usr/bin/env python3
"""Serve the Interactive Evo research site and its versioned evaluation API."""

from __future__ import annotations

import argparse
import json
import mimetypes
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse


HERE = Path(__file__).resolve().parent
DATA_DIR = HERE / "data"
CASE_DIR = DATA_DIR / "cases"
CASE_SUMMARIES = json.loads((DATA_DIR / "cases.json").read_text(encoding="utf-8"))
CASE_IDS = {item["id"] for item in CASE_SUMMARIES}


def parse_preview_transcript(payload: dict) -> list[dict]:
    """Normalize visitor input without assigning a scientific evaluation score."""
    messages = payload.get("messages")
    if isinstance(messages, list):
        normalized = []
        for index, message in enumerate(messages):
            if not isinstance(message, dict):
                continue
            content = str(message.get("content", "")).strip()
            if not content:
                continue
            role = str(message.get("role", "user" if index % 2 == 0 else "assistant")).lower()
            normalized.append({"role": role, "content": content})
        return normalized

    transcript = str(payload.get("transcript", "")).strip()
    normalized = []
    for index, line in enumerate(filter(None, (item.strip() for item in transcript.splitlines()))):
        match = re.match(r"^(user|assistant|system)\s*:\s*(.+)$", line, flags=re.IGNORECASE)
        if match:
            normalized.append({"role": match.group(1).lower(), "content": match.group(2)})
        else:
            normalized.append({"role": "user" if index % 2 == 0 else "assistant", "content": line})
    return normalized


def preview_response(payload: dict) -> dict:
    messages = parse_preview_transcript(payload)
    if len(messages) < 2:
        raise ValueError("preview requires at least two non-empty turns")
    if len(messages) > 40:
        raise ValueError("preview accepts at most 40 turns")

    content = " ".join(message["content"] for message in messages)
    folded = content.casefold()
    repeated_lines = len(messages) - len({message["content"].casefold() for message in messages})
    closure_terms = ("shall i", "resolved", "complete", "done", "next step", "reference number", "door is open")
    return {
        "mode": "preview",
        "schema_version": "interactive-evo/v1",
        "provider_status": "not_configured",
        "disclaimer": "Interface-only deterministic preview. No benchmark score was generated.",
        "input": {
            "turns": len(messages),
            "user_turns": sum(message["role"] == "user" for message in messages),
            "assistant_turns": sum(message["role"] == "assistant" for message in messages),
            "characters": len(content),
        },
        "observable_signals": {
            "questions": content.count("?"),
            "repeated_lines": repeated_lines,
            "closure_cues": sum(folded.count(term) for term in closure_terms),
        },
        "trace": [
            {"stage": "Input", "status": "parsed", "detail": f"{len(messages)} turns validated"},
            {"stage": "Trajectory", "status": "structured", "detail": "Role order and observable signals retained"},
            {"stage": "Provider", "status": "waiting", "detail": "Connect a live evaluator"},
            {"stage": "Diagnosis", "status": "not scored", "detail": "No scientific score generated"},
        ],
    }


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
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

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
        if path == "/api/v1/schema":
            return self.json_response({
                "version": "interactive-evo/v1",
                "endpoint": "/api/v1/evaluate",
                "modes": {
                    "fixed": {"input": {"case_id": "string"}, "available": True},
                    "preview": {"input": {"transcript": "string", "messages": "optional array"}, "available": True},
                    "live": {"input": {"messages": "array", "provider": "string"}, "available": False},
                },
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
            if mode == "preview":
                return self.json_response(preview_response(payload))
            if mode != "fixed":
                return self.json_response({
                    "error": "Live evaluation provider is not configured",
                    "code": "LIVE_PROVIDER_NOT_CONFIGURED",
                    "accepted_contract": {"messages": "array", "mode": "live", "provider": "string"},
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
