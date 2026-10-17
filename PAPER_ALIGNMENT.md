# Paper–site alignment

Source checked: `Qwen_InteractEval (3).pdf`, 59 pages, manuscript title **InteractEval: Measuring Interactive Intelligence**.

## Boundary between manuscript and website

- The manuscript defines a balanced 27-cell scenario space from realism × information sufficiency × interaction purpose, with 30 cases per cell (`N=810`).
- The website exposes a fixed 76-case demonstrator across ten assistants. It is an unbalanced descriptive snapshot, not the manuscript's full experimental corpus and not a provider-wide ranking.
- Website-only engineering previews and aggregate charts are labeled as interface or descriptive readout. They are not presented as claims from the paper.

## Terminology checked against the manuscript

| Website concept | Manuscript-aligned wording |
| --- | --- |
| Four layers | Data, Interaction, Mechanism, Normative |
| Mechanism output | `W_t = (S_t, Ψ_t, E_t)` |
| Normative output | `(J_t, V_t, h_t) = ϕᴺ(W_t, D_t)` |
| L1 | Goal preservation |
| L2 | Information uptake |
| L3 | State progression |
| L4 | Contextual expression |
| L5 | Proactive agency |
| L6 | Long-horizon coherence |
| Event-path labels | Advance, Maintain, Degrade, Collapse |
| Scenario facets | Realism, information sufficiency, interaction purpose |

The mechanism layer reconstructs the operational world and does not assign L1–L6 grades. The normative layer assigns capability judgments, the violation/red-line decision, and the termination decision. Future event paths are conditional projections and are not realized-event evidence.

## Chart design decisions

### Figure 01: six-lens model profile

Chosen: parallel coordinates with one highlighted assistant, subdued comparison lines, fixed 0–1 axes, and a separate model index that always prints every model name and sample size.

Rejected alternatives:

1. A radar chart: area dominates perception and makes ten overlapping systems unreadable.
2. Ten categorical colors: color would encode model identity without enough discriminable hues and would compete with outcome colors.
3. Direct labels at every curve endpoint: labels collide at L6 and make the chart look like a ranked endpoint plot rather than a six-dimensional profile.

The optional 3D waterfall uses the same six 0–1 display dimensions and the same filtered assistant cohort. It is labeled as an exploratory perspective because projection and occlusion make it less reliable for exact comparison; the 2D view and exact table remain the analytical references. The 3D geometry introduces no additional metric or manuscript claim.

### Figure 05: pairwise comparison support

Chosen: exact shared-scene count matrix. It exposes whether a pairwise comparison has common scene support.

Rejected alternatives:

1. Outcome-versus-turn scatter: it combines two measures but does not answer whether assistants saw comparable cases.
2. Decorative network: edge density obscures exact counts and makes isolated low-overlap pairs hard to audit.
3. A second leaderboard: it repeats ranking without adding comparability evidence.

### Figure 06: case-level evidence

Chosen: linked rows for the selected assistant, with case ID, scene, composite, terminal outcome, and turns. Selecting a row opens the source case.

Rejected alternatives:

1. Animated bars: motion adds no new data relation at this level.
2. A distribution-only violin plot: the sample is small and it would hide case identity and terminal outcome.
3. A thumbnail gallery: visual weight would rise while the exact audit fields become harder to compare.
