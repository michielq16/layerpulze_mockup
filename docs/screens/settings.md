# Screen: Settings — Connection · Ingestion · Pricing

**Pillar:** Cross-cutting platform (governance · FinOps · cron operations)
**Persona:** Direct-customer admin + partner-of-record operator (configures the tenant + the LP-side pricing inputs)
**Value-loop quadrant:** Ingest (the tab that *controls* the loop) + the cost inputs that price every other surface
**Decision the user makes:** "Can we connect? Are we collecting? What does our Fabric capacity + licensing actually cost?"
**Data joins required:** None upstream — Settings *configures* the joins (SP creds, Metrics App workspace+dataset IDs, cron cadence) + carries the pricing inputs (capacity €, license €) that feed cost attribution across the product.
**Sample data:** `DATA.documents.sample`'s capacity counters + `INGEST_ARMS` (6 collector arms) + `CAPACITY_PRICING_SEED` + `LICENSE_PRICING_SEED` in `src/Pages.jsx`.

## Why this exists

Three different jobs that all want to live "in settings" — kept on one page but split by tab so each has a clean home:

- **Connection** — SP credentials + Capacity Metrics App workspace/dataset IDs + the Danger zone (delete environment). This is where the tenant *attaches*.
- **Ingestion** — the cron control surface. Toggle sync, set schedule + timezone, see the overall last-30-runs completion, drill into per-arm health.
- **Pricing** — the customer-entered actuals for Fabric **capacity €/mo** (per-SKU) and Microsoft **licenses €/user/mo** (Free / Pro / PPU / E5 / SP). Truth of record for share-of-bill math across the product.

The three sit on one page because they're all "things only an admin touches" and admins prefer one config surface to three.

## V2 — what changed (2026-05-26)

- **Status visualization → dots, not squares.** The 30-run completion grid + per-arm grids render as circular dots (matching the rest of the product's status-dot vocabulary; squares felt like a mini-heatmap when they're really 1-bit health signals).
- **Removed the "Planned ingestion axes" card** (was a 6-row roadmap teaser). Some entries were already shipped (Reports & Apps); the card was drifting and added clutter that didn't help the admin do their job.
- **Re-audited cron arms against the LayerPulse repo** (`../layerpulse/src/app/api/cron/collect/route.ts`, `Promise.allSettled` at `:694`). Findings + fixes:
  - The mockup said "Five canonical arms" — LP actually runs **six** active arms (introspection runs as the prerequisite + 5 collectors in the allSettled batch).
  - **`Reports & Apps`** is now an active collector (`collectReportsApps` at `:719`) — added to the arm list. It had been on the *planned* card, which was stale.
  - **FUAM** correctly omitted (deprecated; only runs when `env.fuamEndpoint` is set, which is no longer recommended).
  - Updated each arm's meta line to match the actual code paths (e.g. Tenant settings notes the "latest-wins snapshots" pattern; Reports & Apps notes the "sticky-cursor fan-out"; Metrics App notes the canonical capacity tables).

## Happy path

1. New environment → user opens Settings → **Connection** tab, lands on the SP-credentials form. Saves → "✓ saved". Tests connection → green badge.
2. Connects the **Capacity Metrics App** (workspace ID + dataset ID; help disclosure lists exact steps).
3. Switches to **Ingestion** → toggles Sync enabled (on), picks Daily schedule, picks timezone. Sees the overall 30-run completion grid (mostly green dots), drills into per-arm health if anything is amber/red.
4. Switches to **Pricing** → enters capacity €/mo per capacity (truth-of-record for share-of-bill); enters license €/user/mo per SKU.
5. Done — every downstream surface (Capacity Pulse, Cost Attribution, Workload Mix, Documents cost section) now reads correct €.

## Edge states

- **No SP credentials yet** — Connection hero shows ✗ not connected, all other tabs still navigable but warn "Connect first" in their sub-text.
- **Failed runs** — Ingestion header badge flips to `N failed runs` (rose); the per-arm grid shows the exact arm whose dots are red.
- **Missing capacity price** — Pricing row tinted rose with an inline "Add price" affordance; share-of-bill math elsewhere falls back to F-SKU list price + a footnote.
- **Custom cron expression** — Schedule "Custom" reveals a `0 2 * * *`-style input + a 5-field POSIX hint.
- **Danger zone delete** — confirm-required (two-step); not auto-triggered.

## Components used

- `model-tabs` — top tab bar (Connection / Ingestion / Pricing)
- `lp-card`, `lp-card-header`, `lp-card-sub` — section cards
- `settings-status` — connection hero (capacity / workspace / model / report counts)
- `form-grid` — credential + IDs forms
- `settings-row` — labeled toggle / select / button rows
- `doc-toggle` — the sync-enabled switch
- `ing-overall-grid` + `ing-arms` — 30-run dot strips (now circular)
- `ing-legend` — dot-color legend
- `settings-danger` — danger-zone card

## Tabs at a glance

| Tab | Purpose | Key controls |
|---|---|---|
| **Connection** | Attach the tenant | SP creds form · Capacity Metrics App workspace/dataset · Danger zone (delete env) |
| **Ingestion** | Operate the cron | Sync toggle · Schedule (Daily / Weekly / Custom cron) · Timezone · 30-run overall + per-arm health (dots) · Sync now |
| **Pricing** | Money truth-of-record | Capacity €/mo per SKU · License €/user/mo per Microsoft plan · Save / Edit |

## Notes for LP-side PRD authoring

- Source-of-truth for cron arms = `src/app/api/cron/collect/route.ts` (Promise.allSettled order). Keep the arm list audited at every Settings change.
- "Planned axes" is **not** the Settings page's job — that's the BACKLOG.md role (autogen + Tier rows). Don't reintroduce it here.
- Capacity + license € entered here power `H1.3 capacity_pricing` + `license_inventory` joins.
- Connection hero counts (capacities/workspaces/models/reports) come from the live inventory tables after introspection, not from the SP form.
