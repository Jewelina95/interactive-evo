#!/usr/bin/env python3
"""Build compact, browser-ready records from the reviewed case markdown files."""

from __future__ import annotations

import json
import re
import statistics
from pathlib import Path


CAPABILITY_LEVELS = [
    "goal establishment", "absorb info", "state progression",
    "style adapt", "proactive agency", "long horizon",
]


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


def numeric(value: str | int | float | None) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def case_metrics(record: dict) -> dict:
    turns = record.get("turns", [])
    valid_levels = [row["levels"] for row in turns if len(row.get("levels", [])) == 6]
    interests = [value for row in turns if (value := numeric(row.get("user_interest"))) is not None]
    tolerances = [value for row in turns if (value := numeric(row.get("ai_tolerance"))) is not None]
    advances = [value for row in turns if (value := numeric(row.get("advance"))) is not None]
    decays = [value for row in turns if (value := numeric(row.get("decay"))) is not None]
    return {
        "capability_level_means": [statistics.mean(row[index] for row in valid_levels) for index in range(6)] if valid_levels else [],
        "user_interest_start": interests[0] if interests else None,
        "user_interest_end": interests[-1] if interests else None,
        "user_interest_change": interests[-1] - interests[0] if len(interests) > 1 else None,
        "ai_tolerance_start": tolerances[0] if tolerances else None,
        "ai_tolerance_end": tolerances[-1] if tolerances else None,
        "ai_tolerance_change": tolerances[-1] - tolerances[0] if len(tolerances) > 1 else None,
        "mean_turn_advance": statistics.mean(advances) if advances else None,
        "mean_turn_decay": statistics.mean(decays) if decays else None,
    }


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


def model_summaries(records: list[dict]) -> list[dict]:
    """Aggregate the reviewed case records by assistant under test.

    Each case contributes one observation to case-level metrics. Per-turn capability
    levels are averaged within each case first, so long conversations do not receive
    extra weight in the model profile.
    """
    grouped: dict[str, list[dict]] = {}
    for record in records:
        grouped.setdefault(record["assistant"], []).append(record)

    summaries = []
    for assistant, cases in sorted(grouped.items()):
        scores = [case["composite"] for case in cases if case["composite"] is not None]
        turns = [case["assistant_turns"] for case in cases]
        terminals = [case["terminal"].casefold() for case in cases]
        successful = ["successful closure" in value for value in terminals]
        exhaustion = ["exhaustion of interest" in value for value in terminals]
        safety_cap = ["safety cap" in value for value in terminals]
        case_levels = []
        interest_changes = []
        advances_by_case = []
        decays_by_case = []
        successful_turns = []
        unresolved_turns = []
        for case in cases:
            rows = [row["levels"] for row in case["turns"] if len(row.get("levels", [])) == 6]
            if rows:
                case_levels.append([statistics.mean(row[index] for row in rows) for index in range(6)])
            metrics = case_metrics(case)
            if metrics["user_interest_change"] is not None:
                interest_changes.append(metrics["user_interest_change"])
            if metrics["mean_turn_advance"] is not None:
                advances_by_case.append(metrics["mean_turn_advance"])
            if metrics["mean_turn_decay"] is not None:
                decays_by_case.append(metrics["mean_turn_decay"])
            (successful_turns if "successful closure" in case["terminal"].casefold() else unresolved_turns).append(case["assistant_turns"])
        level_means = [
            round(statistics.mean(row[index] for row in case_levels), 4)
            for index in range(6)
        ] if case_levels else []
        summaries.append({
            "assistant": assistant,
            "case_count": len(cases),
            "mean_composite": round(statistics.mean(scores), 4) if scores else None,
            "median_composite": round(statistics.median(scores), 4) if scores else None,
            "min_composite": round(min(scores), 4) if scores else None,
            "max_composite": round(max(scores), 4) if scores else None,
            "successful_closure_rate": round(statistics.mean(successful), 4),
            "interest_exhaustion_rate": round(statistics.mean(exhaustion), 4),
            "safety_cap_rate": round(statistics.mean(safety_cap), 4),
            "median_assistant_turns": statistics.median(turns) if turns else None,
            "mean_assistant_turns": statistics.mean(turns) if turns else None,
            "median_successful_turns": statistics.median(successful_turns) if successful_turns else None,
            "median_unresolved_turns": statistics.median(unresolved_turns) if unresolved_turns else None,
            "median_user_interest_change": statistics.median(interest_changes) if interest_changes else None,
            "mean_turn_advance": statistics.mean(advances_by_case) if advances_by_case else None,
            "mean_turn_decay": statistics.mean(decays_by_case) if decays_by_case else None,
            "scenario_count": len({case["scene_id"] for case in cases}),
            "realism_counts": {
                value: sum(case["realism"] == value for case in cases)
                for value in sorted({case["realism"] for case in cases})
            },
            "information_counts": {
                value: sum(case["information"] == value for case in cases)
                for value in sorted({case["information"] for case in cases})
            },
            "capability_level_means": level_means,
            "capability_level_names": CAPABILITY_LEVELS,
        })
    return summaries


def main() -> None:
    DETAILS.mkdir(parents=True, exist_ok=True)
    markdown_paths = sorted(SOURCE.glob("case_*.md"))
    if markdown_paths:
        records = [parse_case(path) for path in markdown_paths]
    else:
        records = [json.loads(path.read_text(encoding="utf-8")) for path in sorted(DETAILS.glob("case_*.json"))]
    if not records:
        raise RuntimeError(f"No case source files or reviewed case JSON records found under {SOURCE} or {DETAILS}")
    summaries = []
    for record in records:
        summary = {key: record[key] for key in (
            "id", "scene_id", "realism", "information", "purpose", "assistant",
            "partner", "terminal", "assistant_turns", "composite", "persona", "objective"
        )}
        summary.update(case_metrics(record))
        summaries.append(summary)
    (DATA / "cases.json").write_text(json.dumps(summaries, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA / "models.json").write_text(
        json.dumps(model_summaries(records), ensure_ascii=False, indent=2), encoding="utf-8"
    )
    for record in records:
        (DETAILS / f"{record['id']}.json").write_text(
            json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    print(f"Built {len(records)} fixed case records in {DATA}")


if __name__ == "__main__":
    main()
