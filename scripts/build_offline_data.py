#!/usr/bin/env python3
"""Build the small data bundle used when index.html is opened via file://."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEMO_CASES = ("case_006", "case_015", "case_055", "case_064", "case_070", "case_071")


def load(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


payload = {
    "cases": load(ROOT / "data" / "cases.json"),
    "models": load(ROOT / "data" / "models.json"),
    "records": {
        case_id: load(ROOT / "data" / "cases" / f"{case_id}.json")
        for case_id in DEMO_CASES
    },
}

target = ROOT / "data" / "offline-data.js"
target.write_text(
    "window.__INTERACTEVAL_OFFLINE__="
    + json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    + ";\n",
    encoding="utf-8",
)
print(f"wrote {target} ({target.stat().st_size:,} bytes)")
