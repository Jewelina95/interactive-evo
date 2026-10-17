#!/usr/bin/env python3
"""Build a browser-readable data bundle for direct file:// previews."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"


def load(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def main() -> None:
    case_files = sorted((DATA / "cases").glob("case_*.json"))
    payload = {
        "summaries": load(DATA / "cases.json"),
        "models": load(DATA / "models.json"),
        "cases": {path.stem: load(path) for path in case_files},
    }
    output = "window.INTERACTIVE_EVO_DATA=" + json.dumps(
        payload, ensure_ascii=False, separators=(",", ":")
    ) + ";\n"
    (ROOT / "data.js").write_text(output, encoding="utf-8")
    print(f"Wrote data.js with {len(case_files)} detailed cases")


if __name__ == "__main__":
    main()
