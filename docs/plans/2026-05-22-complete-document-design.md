# Design — The "Complete" document (single maximum-value base doc)

**Date:** 2026-05-22
**Status:** Validated (operator brainstorm sign-off) → building sample
**Context:** Earlier work produced 4 audience-bounded document variants (auditor/analyst/executive/engineer) + the master section catalogue (`docs/documents-section-catalogue.md`). The operator now wants **one canonical document** that carries the full data scope and delivers maximum value — not bounded by audience. Audience variants become optional *lenses* over this base.

## Decisions (from brainstorm)

1. **Shape:** Everything + progressive depth — all sections present, but layered (decision-useful lead → briefing body → exhaustive appendix). *Not* a flat dump, *not* a curated subset.
2. **Opening layer:** a fused **cover scorecard** — identity + health + ownership in one page (the 30-second answer).
3. **Two-layer data fusion is the value** — automated (Fabric API) + manual (LayerPulse input) in one artifact, clearly distinguished.

## Structure — three tiers

### Tier 1 — Cover scorecard (1 page)
Fused: model identity (name · workspace · domain · purpose) · **certification stamp** · a **KEEP / OPTIMIZE / RETIRE verdict band** (deterministic RAG over adoption/cost/quality/refresh — mirrors LP's T1.18 "Model Scorecard"; KEEP unless adoption is red → RETIRE, or any red / ≥2 amber → OPTIMIZE) · health score + 6 quality dimensions (mini-bars) · 4 headline KPIs · **Owner / SME / Stewards / Domain** · **completeness meter** (manual layer: owner ✓ · glossary N terms · processes ✓/✗) · last-scan + scope-and-method · a **source legend** (Automated = Fabric API · Manual = LayerPulse).

> **Verdict band added 2026-05-24** to stay in sync with LP's T1.18 (the Perfect Document = Model Scorecard + Technical Reference). The Complete cover now leads with the same KEEP/OPTIMIZE/RETIRE action verdict.

### Tier 2 — Body (briefing depth, top-to-bottom)
Grouped, each group introduced by a **group-lead banner** carrying a source chip (Automated / Manual / Derived):
1. Executive summary + owner's note *(auto + manual)*
2. Trust & health — maturity, refresh + incremental policy, governance findings *(auto)*
3. Schema — tables (glossary descriptions), relationships, ER diagram, hierarchies *(auto + glossary)*
4. Logic — measures with glossary-driven KPI/metric descriptions, calc groups *(auto + glossary)*
5. Governance & security — RLS, OLS, sensitivity labels, access × RLS scope *(auto)*
6. Lineage & usage — up/downstream, adoption, storage, cost attribution *(auto)*
7. Business context — glossary (full, grouped), processes, change log *(manual)*
8. Ownership & sign-off *(manual)*

### Tier 3 — Appendices (exhaustive reference, clearly marked)
- A: full column inventory (every table × column × type × role)
- B: full DAX expressions
- C: Power Query (M) per table
- D: measure usage / dormancy + calculated columns

## Data fusion rules (locked principles)

- **Source tagging** — every group-lead banner states whether the data is Automated (Fabric Scanner / Admin API / Metrics App) or Manual (LayerPulse). A trust feature + the value story.
- **Glossary-driven descriptions** — measure/column/table descriptions come ONLY from attached glossary terms; none attached → blank (never fabricated).
- **Ownership → cover + sign-off** — Owner/SME/Stewards/Domain from `/ownership`.
- **Degradation, never fabrication** — automated sections always render; manual sections render explicit empty-states ("No stewards assigned — add via /ownership").
- **Completeness meter** — surfaces how complete the human layer is + what to populate next.

## Relationship to audience variants

The Complete document is the **canonical base** and the modal default. The 4 audience presets (auditor/analyst/executive/engineer) remain selectable as *lenses* (subset views), not separate documents.

## Implementation

- `completePages(ctx)` + `CompleteCover(ctx)` + `GroupLead` banner in `src/NewPages.jsx`, reusing every existing section component.
- `AUDIENCE_LABELS.complete` added; `buildDocPages` dispatches `complete`; modal seg-tabs gain a leading **Complete** tab and default to it.
- Sample renders for the Sales Analytics fixture (`DATA.documents.sample`).
