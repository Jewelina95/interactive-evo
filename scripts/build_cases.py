#!/usr/bin/env python3
"""Build compact, browser-ready records from the reviewed case markdown files."""

from __future__ import annotations

import json
import re
from pathlib import Path


HERE = Path(__file__).resolve().parent
SITE = HERE.parent
SOURCE = SITE.parent / "case" / "interactive_cases" / "en"
DATA = SITE / "data"
DETAILS = DATA / "cases"


def section(text: str, title: str, next_level: int = 2) -> str:
    marker = re.search(rf"^{'#' * next_level} {re.escape(title)}\s*$", text, re.M)
    if not marker:
        return ""
    start = marker.end()
    end = re.search(rf"^{'#' * next_level} (?!{re.escape(title)}$).+$", text[start:], re.M)
    return text[start : start + end.start() if end else None].strip()


def labelled_block(scene: str, label: str) -> str:
    match = re.search(
        rf"^\*\*{re.escape(label)}\*\*\s*\n\n(.*?)(?=\n\n\*\*[^\n]+\*\*|\n\n<details>|\Z)",
        scene,
        re.M | re.S,
    )
    return re.sub(r"\s+", " ", match.group(1)).strip() if match else ""


def field(text: str, label: str) -> str:
    match = re.search(rf"^- \*\*{re.escape(label)}\*\*: (.+)$", text, re.M)
    return match.group(1).strip() if match else ""


def parse_turns(text: str) -> list[dict]:
    block = section(text, "Per-turn summary")
    rows = []
    for line in block.splitlines():
        if not line.startswith("|") or "---" in line or "turn" in line.lower():
            continue
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if len(cells) < 10 or not cells[0].isdigit():
            continue
        levels = [float(value) for value in re.findall(r"\d+(?:\.\d+)?", cells[1])[:6]]
        rows.append(
            {
                "turn": int(cells[0]),
                "levels": levels,
                "plateau": cells[2],
                "blocking": cells[3],
                "path": cells[4],
                "advance": cells[5],
                "user_interest": cells[6],
                "ai_tolerance": cells[7],
                "decay": cells[8],
                "signals": cells[9],
                "halt": cells[10] if len(cells) > 10 else "",
            }
        )
    return rows


def parse_transcript(text: str) -> list[dict]:
    block = section(text, "Full transcript")
    pattern = re.compile(
        r"^\*\*\[(\d+)\] (user|assistant)\*\*\s*\n\n(.*?)(?=^\*\*\[\d+\] (?:user|assistant)\*\*|\Z)",
        re.M | re.S | re.I,
    )
    messages = []
    for turn, role, body in pattern.findall(block):
        lines = []
        for line in body.strip().splitlines():
            line = re.sub(r"^>\s?", "", line).strip()
            if line:
                lines.append(line)
        messages.append({"turn": int(turn), "role": role.lower(), "content": "\n".join(lines)})
    return messages


def parse_case(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    scene = section(text, "Scene")
    axes = re.search(
        r"Realism: `([^`]+)` · Information sufficiency: `([^`]+)` · Interaction purpose: `([^`]+)`",
        text,
    )
    outcome = field(text, "Outcome")
    composite = re.search(r"Composite \*\*([0-9.]+)\*\*", outcome)
    terminal = re.search(r"Terminal state \*\*([^*]+)\*\*", outcome)
    turns_count = re.search(r"(\d+) assistant turns", outcome)
    turns = parse_turns(text)
    record = {
        "id": path.stem,
        "scene_id": (re.search(r"\*\*Scene\*\*: `([^`]+)`", text) or [None, ""])[1],
        "realism": axes.group(1) if axes else "",
        "information": axes.group(2) if axes else "",
        "purpose": axes.group(3) if axes else "",
        "assistant": field(text, "System under test"),
        "partner": field(text, "Partner (user role)"),
        "judge": field(text, "Judge"),
        "terminal": terminal.group(1) if terminal else "",
        "assistant_turns": int(turns_count.group(1)) if turns_count else len(turns),
        "composite": float(composite.group(1)) if composite else None,
        "persona": labelled_block(scene, "Persona"),
        "objective": labelled_block(scene, "Objective"),
        "initial_situation": labelled_block(scene, "Initial situation"),
        "turns": turns,
        "transcript": parse_transcript(text),
    }
    return record


def main() -> None:
    DETAILS.mkdir(parents=True, exist_ok=True)
    records = [parse_case(path) for path in sorted(SOURCE.glob("case_*.md"))]
    summaries = [
        {key: record[key] for key in (
            "id", "scene_id", "realism", "information", "purpose", "assistant",
            "partner", "terminal", "assistant_turns", "composite", "persona", "objective"
        )}
        for record in records
    ]
    (DATA / "cases.json").write_text(json.dumps(summaries, ensure_ascii=False, indent=2), encoding="utf-8")
    for record in records:
        (DETAILS / f"{record['id']}.json").write_text(
            json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    print(f"Built {len(records)} fixed case records in {DATA}")


if __name__ == "__main__":
    main()
