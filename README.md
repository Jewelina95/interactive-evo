# interacteval

Model comparisons and research notes on cognition and interaction.

- Website: https://jewelina95.github.io/interactive-evo/
- Research: https://jewelina95.github.io/interactive-evo/research.html

## Contents

The static site includes model comparisons, six capability dimensions, scenario filters,
case-level conversations, and a research journal. The current MarioEval English V3 casebook
contains 76 conversations across 10 models, 898 evaluated assistant turns, and 1,796 transcript
messages. All 76 cases have complete capability and interest-change pairs. The current
terminal labels are 48 successful closures and 28 cases of interest exhaustion. Five cases
include recorded red lines. Multimodal results are pending.

Homepage summaries use the full casebook. Filters in the Evaluations section apply to that
section. Model assignments are unbalanced; counts accompany the displayed summaries.

## Local preview

Run `python -m http.server 8787` in this directory, then open http://127.0.0.1:8787/.
No server-side application or build step is required.

## Current dataset

`data/cases/` contains the complete English V3 source records from `MarioEval_cases_en.zip`.
The previous dataset was replaced. `data/cases.json` and `data/models.json` are derived
exclusively from that archive. `data/manifest.json` records its SHA-256, schema version,
counts, scoring fields, and a checksum for each source case.

To replace the casebook with another archive in the same schema, run:

```bash
python scripts/import_cases.py /path/to/MarioEval_cases_en.zip
```

The importer reads and summarizes the incoming archive before replacing the repository's
`data/` directory. Published scores come from `outcome.composite` and `outcome.level_means`,
which retain the current scoring cascade. `original_scores` is preserved in the source JSON
and is not used for rankings. Endings come from `outcome.ending`.

Interest change is the last evaluated-turn interest minus the first. State movement is the
within-case share of boolean `present_moved` values marked true; displayed model rates average
those case rates. Red-line turn rate divides `outcome.red_line_turns` by evaluated turns,
then averages cases. A case with red lines can have either terminal outcome.

The source facet values `science-fictional` and `nonfunctional` are mapped to the interface
keys `sci_fi` and `non_functional` in the compact index. Complete source records stay unchanged.

## GitHub Pages

The site is published from the `main` branch, repository root. `.nojekyll` serves the static
files directly. Relative URLs support deployment under the repository subpath.

## Sources

Based on [Interactive Evo](https://github.com/Jewelina95/interactive-evo).
The existing MIT license is retained. Provider asset sources are recorded in
[assets/providers/sources.json](assets/providers/sources.json).
