# PRD: Milestone H2 — Cost Attribution + Workload Mix

**Level:** 3 (cross-domain, multi-PR, multi-session)
**Date:** 2026-05-07
**Status:** approved
**Scope:** user-visible (2 new customer pages: Cost Attribution + Workload Mix)
**Parent milestone:** H — Native Capacity Telemetry — see [`h1-native-capacity-telemetry.md`](h1-native-capacity-telemetry.md)
**Model reference:** [`../architecture/metrics-app-model.md`](../architecture/metrics-app-model.md) — designs in this PRD use the spike-validated catalog
**Estimate:** ~1.5 weeks (3-4 PRs: H2.1 treemap → H2.2 workload mix → H2.3 cost calc + schema → optional H2.4 polish)

## Why now

H1 shipped the **Capacity Pulse** page — answers *"is my capacity healthy right now?"*. Customers can see CU% trends and top consumers but cannot answer the next question every CFO will ask: *"who or what is costing me money, and is the spend justified?"*

The H2.0 deep-dive ([PR #125](https://github.com/michielq16/layerpulse/pull/125)) catalogued the model: 41 tables, 463 columns, 147 measures, 47 relationships. We now know exactly which measures are per-capacity-filterable (`[Billed (GB) %]`, `[Cumulative Utilization (GB) % by Workspace]`) and which are tenant-aggregate (`[Cumulative CU Usage % Preview]` and 3 throttling measures). H2 designs queries against this reference rather than guessing.

H2 unlocks the FinOps narrative: take a customer's actual invoice (already captured by the H1.3 Capacity Pricing card) and pin it to specific items. Once that lands, every other H milestone (throttling overages, storage trends) inherits the cost attribution — H3 and H4 build on top of H2's `cost_observations_v2` foundation.

## User Stories

### Story 1: Cost Attribution treemap (H2.1)

**As a** Fabric capacity owner, **I want** to see which items are consuming my capacity spend, **so that** I can identify the top cost drivers and decide what to optimize, decommission, or move to a smaller capacity.

Acceptance criteria:
- [ ] Display a treemap of items grouped by workspace, sized by 30-day share of bill, on `/(customer)/[id]/cost`
- [ ] Show top-10 most expensive items below the treemap as a sortable table (item name / workspace / CU% / $)
- [ ] Compute item $ as share-of-bill: `(item_CU / capacity_total_CU) × capacity_monthly_bill` per the H1.3 `shareOfBill` helper
- [ ] Display capacity selector when env has multiple capacities; default to the highest-spend one
- [ ] Show "no pricing configured" empty state with a CTA Link to Settings → Capacity Pricing card when `capacity_pricing` table has zero rows for the capacity
- [ ] Mark items in capacities without pricing with a "Pricing missing" badge; include them in CU% but exclude from $ totals
- [ ] Capture `cost_attribution_page_viewed` and `cost_drilldown_opened` PostHog events
- [ ] F-2 partner-of-record reads supported via `resolveCustomerEnv` (per project convention)

### Story 2: Workload Mix breakdown (H2.2)

**As a** Fabric capacity owner, **I want** to see how my CU is split across workload types (Power BI / Dataflow / Pipelines / Spark / Datasets), **so that** I understand which products drive my spend and can decide whether to consolidate or scale workloads independently.

Acceptance criteria:
- [ ] Display a 30-day stacked-area chart of daily CU by workload type on `/(customer)/[id]/workload-mix`
- [ ] Show a pie chart of total share by workload below the area chart
- [ ] Display a peak-hour heatmap (7d × 24h grid colored by CU%) for the current week so customers spot when each workload runs hot
- [ ] Display capacity selector when env has multiple capacities (matches treemap UX)
- [ ] Per-capacity CU values must be honest per capacity, NOT tenant-aggregate — depends on Story 5 landing first within H2.2
- [ ] Group unknown workload types into an "Other" bucket with a Sentry breadcrumb so we notice when Microsoft adds new types
- [ ] Capture `workload_mix_page_viewed` PostHog event

### Story 3: Currency-aware totals + period delta

**As a** customer with a contracted Fabric agreement, **I want** $ values shown in my contracted billing currency and trended vs. last period, **so that** I can match the numbers to my invoice and spot week-over-week shifts without manual math.

Acceptance criteria:
- [ ] Read currency per capacity from `capacity_pricing.currency`; surface env-level currency from `inferEnvCurrency` helper (already shipped H1.3)
- [ ] Format $1,234.56 for USD, €1.234,56 for EUR per the existing `formatMoney` helper — never auto-convert across currencies
- [ ] Show a "mixed currency" banner above the treemap when capacities under one env have different currencies; treemap groups by capacity in that case
- [ ] Display ▲/▼ percent delta on each KPI card vs the prior 30-day window
- [ ] Hide the delta when `|delta| < 0.5%` per existing Sparkline convention

### Story 4: Cost calc cron path (H2.3 — infrastructure-flavored but on a user-visible surface)

**As a** customer-facing cost surface, **I want** daily-grain cost rows precomputed by the cron path, **so that** the treemap renders in <500ms instead of recomputing 30 days × N items × M capacities at request time.

Acceptance criteria:
- [ ] Persist `cost_observations_v2` rows on each cron run with composite PK `(env_id, capacity_id, date, item_id)` — daily grain, not hourly (cost-per-hour is too volatile to be useful)
- [ ] Read input from `item_metrics_hourly` (already populated by H1.2) + `capacity_pricing` (H1.3) and write the share-of-bill row in one DB transaction per capacity
- [ ] Idempotent on conflict — rerunning the cron for the same day overwrites the row (handles late-arriving data + pricing changes mid-period)
- [ ] Skip capacities with no `capacity_pricing` row covering the date — emit a Sentry breadcrumb (not an error; this is expected for trial mode)
- [ ] Per-env time-budget: ≤15 s for the cost calc path within the 55 s cron envelope (alongside H1.4's metrics-app collect)

### Story 5: Per-capacity CU% correctness via fact-table queries (H2.2 prerequisite — also fixes Capacity Pulse retroactively)

**As a** multi-capacity tenant (e.g. SBM with PRD + SND on 2 P1 capacities), **I want** Capacity Pulse and Workload Mix to show distinct CU% values per capacity, **so that** I can compare PRD vs SND health and spend decisions without seeing identical numbers across the capacity selector.

**Background:** All `%` measures in the Metrics App semantic model (`[Cumulative CU Usage % Preview]`, `[xBackground %]`, `[xInteractive %]` + the 3 throttling measures) aggregate against the **tenant CU baseline** regardless of explicit `FILTER('Capacities', X)`. Side-by-side PRD vs SND queries return identical values (verified 2026-05-07; gotcha memory `gotcha_metrics_app_measures_tenant_aggregate.md`). Single-capacity customers (~90% of the landscape) see correct numbers — tenant aggregate equals per-capacity. Multi-capacity customers see misleading uniformity.

Microsoft's own report sidesteps this by reading the `TimePoint*Detail` fact tables directly, not via measures. Our `executeQueries` REST path can do the same — we just have to validate the H2.0 unresolved hypothesis that these tables return rows under a date-window predicate (raw `TOPN(5, 'TimePointCUDetail')` returned 0 rows on SBM during the spike).

Acceptance criteria:
- [x] **Validation spike (1-hour, before query-pack rewrite):** ran `EVALUATE FILTER('TimePointCUDetail', 'TimePointCUDetail'[WindowStartTime] >= UTCNOW() - 14)` against SBM via `scripts/spike-h2-fact-tables.ts` (2026-05-08).
  - PROBE A (`TimePointCUDetail`): **0 rows** even with 14d filter (DirectQuery + retention; unusable via REST).
  - PROBE B (`TimePointOverageDetail`): aborts at 90s timeout (DirectQuery materialization unsustainable via `executeQueries`).
  - **Both probes resolve to branch (b).** Path forward: `MetricsByItemandHour` SUMMARIZE-by-capacity (per-capacity-correct via `Items[capacityId]` join, hour grain).
- [x] Replaced `DAX_TIMEPOINTS_24H` with a `MetricsByItemandHour` SUMMARIZECOLUMNS that GROUPS BY `[PremiumCapacityId]` + `[DateTime]`, summing `[sum_CU]`. Adapter v1 parses the new `(capacityId, TimePoint, CU_seconds)` shape; cron computes per-capacity `cu_pct` in app code (`computePerCapacityCuPct` in `collect.ts`) using `vCores * 3600` baseline from `capacity_snapshots`, then writes per-capacity values to `time_points`.
- [x] Backfill is opt-in: existing `time_points` rows stay (mostly tenant aggregate from PR #124's first ship); new rows from this point forward are per-capacity. The discontinuity is surfaced via the page footer "data source" pill — *"Per-capacity CU from <date>; tenant aggregate before."* (rendered only when the active filter window straddles the cutover date defined in `src/lib/fabric/metrics-app/per-capacity-cutover.ts`).
- [ ] Capacity Pulse selector now shows distinct numbers per capacity. SBM PRD vs SND CU% values diverge in the chart. **Verified post-deploy via Gate 5 vs prod with screenshots.**
- [x] **Workload Mix (Story 2) inherits the fix automatically** — its per-workload CU values come from `MetricsByItemandHour` already (per-capacity-correct via `Items[capacityId]`), so the stacked-area chart per capacity works without additional work. The peak-hour heatmap CU% percentages need the same fact-table source as Capacity Pulse.
- [x] Updated `dax-queries.ts` comment block: removed "queued for H2" caveat, replaced with the spike-resolved Story 5 narrative + cross-link to the gotcha + PR.
- [x] Updated gotcha memory `gotcha_metrics_app_measures_tenant_aggregate.md` from "Carved as Story 5" to "Fixed in PR #X" with post-mortem.
- [x] Edge case #4 in this PRD updates below — see "Edge cases" section.
- [x] Contract test in `catalog-contract.test.ts` adds a `describe("H2.2 Story 5")` block pinning `MetricsByItemandHour` SUMMARIZE-by-capacity as the chosen path (branch b). `dax-queries.contract.test.ts` pins the new query shape (no `'TimePoints'`, no tenant-aggregate measures).

**Sequencing inside H2.2:** Story 5 ships as the FIRST PR of H2.2 (before the user-visible Workload Mix page), because:
- Workload Mix's stacked-area-by-capacity chart can't ship per-capacity-correct without it.
- Capacity Pulse picks up the fix retroactively the moment the new query lands — same `time_points` table, just sourced from the fact table.
- The validation spike is fast (~1 hour) and de-risks the rest of H2.2 (if branch (b) fires, we know early and can adjust H2.2 scope).

## Problem

Customers see CU% on the Capacity Pulse page but have no way to convert that to dollars-per-item. They cannot answer:
- "Of my $5K/month F16 spend, what's actually moving the needle?"
- "Should I move that 200 CU/hour Spark notebook to its own F4 capacity?"
- "Why did my bill jump 30% this month — was it Power BI or Dataflows?"

Microsoft's own Capacity Metrics App report shows CU% per item but **never converts to currency** — it can't, because it doesn't know your contracted price. We do (the H1.3 Capacity Pricing card collects it). H2 is where that asymmetry pays off: LayerPulse becomes the first product that answers the **dollar-attribution question** for Fabric.

## Target Users

- **Direct customer FinOps lead** — primary; needs the treemap and cost-per-item drill-down
- **Microsoft partner managing a customer portfolio** — secondary; consumes the same surfaces in F-2 cross-org-read mode to advise customers on optimization
- **Capacity admin (technical)** — tertiary; uses the Workload Mix peak-hour heatmap to schedule batch loads off-peak

## Non-Goals (Explicitly Out of Scope)

- **Cross-currency conversion.** If a tenant has USD + EUR capacities, we show two sections; we never sum. FX is a rabbit hole and customers care about invoice-match, not normalized totals.
- **Per-item *forecasting*.** "If trends continue, item X will cost $Y next month" is D-milestone agentic territory.
- **Throttling event attribution to specific items.** That's H3.
- **Storage cost.** That's H3.
- **Custom budget alerts** (e.g. "alert me when item X exceeds $200/month"). Goes in C2b alerts, not H2.
- **Power BI Premium per-user (PPU) cost.** Out of Fabric capacity scope.
- **Real-time updates.** Daily-grain only. The cron writes once per day.
- **Editing pricing inline from the Cost page.** Pricing edits stay in Settings → Capacity Pricing card (H1.3).

## Edge Cases

1. **Tenant has zero `capacity_pricing` rows.** Cost page shows the "no pricing configured" empty state with a CTA Link to Settings. Workload Mix still renders — CU% is independent of pricing.
2. **Tenant has pricing for some capacities, not others.** Treemap shows priced capacities normally; unpriced capacities are visible but each item is badged "Pricing missing". CU% works for both.
3. **Multi-capacity tenant with mixed SKUs (e.g. SBM PRD F8 + SND F2).** Treemap groups by capacity (separate sub-treemap per capacity); share-of-bill is computed *per capacity* using its own CU and pricing, then summed only when currencies match.
4. **`TimePointCUDetail` and friends return 0 rows even with date filter** (the H2.0 unresolved hypothesis). **Resolved 2026-05-08 in Story 5** — the validation spike (`scripts/spike-h2-fact-tables.ts` against SBM env `a869646a-433a-4b8f-a128-b86bdafefee0`) confirmed both `TimePointCUDetail` (0 rows under 14d filter) and `TimePointOverageDetail` (90s timeout) are unusable via REST `executeQueries`. Story 5 ships **branch (b)** — `MetricsByItemandHour` SUMMARIZE-by-capacity at hour grain (per-capacity-correct via `Items[capacityId]` join). Per-capacity `cu_pct` is computed in app code from `cu_seconds / (vCores × 3600) × 100` per capacity. The "data source" pill in the page footer surfaces the cutover date so multi-capacity tenants understand the pre/post discontinuity.
5. **Microsoft adds a new workload type.** Adapter routes to "Other" bucket; Sentry breadcrumb fires once per workload-type-per-day. We update the adapter mapping in next deploy. Customer-facing impact: small slice in the "Other" stack.
6. **Pricing changes mid-period** (customer renegotiates EA). Soft-replace pattern from H1.3 already handles this — cost rows for the new period use new pricing; old rows untouched. Treemap aggregation respects period boundaries.
7. **An item moves between workspaces** (rare but happens). Cost rows are keyed by `item_id` not `workspace_id`, so the cost trace stays correct; the treemap reflects the *current* workspace assignment.
8. **Idle / sandbox capacity with aggregate CU but zero per-item activity in the last 24h** (observed on SBM SND post-H1.4.3 — Capacity Pulse renders a real 7d aggregate chart while Top-5 CU consumers shows "No item activity in the last 24h"). The H2 treemap MUST handle this gracefully:
   - Show an empty-state card with copy like "This capacity had no per-item activity in the selected window. Background workloads may still be consuming CU — see [Workload Mix] for the breakdown" with a Link to Story 2's page.
   - DO NOT render an empty/zero-area treemap (visually broken).
   - DO NOT crash the page (the `cost_observations_v2` table will simply have no rows for that capacity-date pair).
   - The capacity selector should still allow the customer to switch to a busier capacity in the same env.

## Known issues to resolve before / during H2.1

Two bugs surfaced post-H1.4.3 that compound with H2 surfaces — investigate as part of H2.1 brainstorm or split out as hotfixes:

### KI-1: `metrics_app_status` persists as `error` even after a successful sync (visible 2026-05-07 evening)

**Symptom:** Settings → Capacity Metrics App card shows "Error — last sync failed" badge while a global "Sync complete — fresh data available" toast displays simultaneously. The Capacity Pulse page renders the data-collection-failed banner alongside *real* 7-day chart data ($31.98 daily cost, 45% CU%, populated Top 5 consumers).

**Root-cause hypothesis (needs verification before H2.1):** the per-collector arms of `runCollectionForEnv` use `Promise.allSettled`, so the FUAM arm can succeed (driving the green toast) while the metrics-app arm fails silently and flips `metrics_app_status='error'` (`src/lib/fabric/metrics-app/collect.ts:197`). The user-facing toast and the per-card badge consult different sources of truth; for the metrics-app card specifically, the success-path flip at `collect.ts:169` only fires when EVERY DAX query in the collect path succeeded for that run. Intermittent failure of one query (likely `DAX_TIMEPOINTS_24H` or `DAX_ITEM_METRICS_HOURLY` — both query the larger fact tables) keeps the status stuck.

**Why H2 cares:** if shipped as-is, the new Cost Attribution page will inherit the same staleness — customers will see a populated treemap rendered alongside an "Error" badge in Settings, eroding trust. H2.1 brainstorm decides between (a) a short hotfix that distinguishes "data collection failed entirely" from "one query in the pack failed but data partially landed" — likely a new `metrics_app_status='partial'` state — vs (b) a Sync-now path that collects per-arm error reasons and surfaces them inline on the card. Either path is small; the cost is doing it before vs after H2.1 ships and creates more dependents.

### KI-2: confirm the Promise.allSettled toast claim experimentally

**Hypothesis above is plausible but not proven.** Before H2.1 design starts, run a 1-hour spike: trigger Sync now against an env where metrics-app is configured, monitor Sentry breadcrumbs for the metrics-app arm, and confirm whether the failing query is reproducible vs flaky. If it's reproducible, that points at a new-data-shape regression we missed; if flaky (e.g. P99 timeout under DAX REST throttling), the fix is retry-with-backoff in the cron path, not a state-machine redesign.

## Success Metrics

- **`cost_attribution_page_viewed`** PostHog event — target ≥3 views/customer/week within 2 weeks of GA
- **`cost_drilldown_opened`** PostHog event (from top-N table → item detail or filter) — target ≥1 drilldown/customer/week within 2 weeks
- **`workload_mix_page_viewed`** PostHog event — target ≥1 view/customer/week within 2 weeks
- **Cost accuracy:** computed monthly $ for each capacity within **±5%** of the customer's actual invoice. Validated against SBM PRD + SND for at least one full month before GA.
- **Cron budget:** cost calc path completes in **≤15 s** per env (p95 across all envs), confirmed via Sentry duration breadcrumb.

## Rollback Criteria

- **`>2%` Sentry error rate on `/cost` or `/workload-mix`** within 15 min of deploy → roll back the page; keep the cron path so data continues to accumulate.
- **Cost values diverge `>20%`** from a sanity-check canary (`pricing_total / total_cu × item_cu` vs the persisted `cost_observations_v2` row) → roll back the cron writer; investigate adapter parsing.
- **Detail-table queries time out `>10%`** of cron runs → switch to the `MetricsByItemandHour` fallback path universally; reassess whether the date-filter-fixes-it hypothesis was wrong.
- **Customer reports invoice mismatch `>10%`** in beta period → halt H2 GA; document the gap; redesign the share-of-bill formula (likely missing a workload-specific multiplier).

## Coupling warning

Touches:
- **DB schema:** `cost_observations_v2` table (new, additive — no expand-contract concerns).
- **Cron path:** `runCollectionForEnv` adds a 4th `Promise.allSettled` arm (cost calc) alongside activity / FUAM / metrics-app. 55 s envelope already tight — measure before merging.
- **F-2 partner-of-record:** new pages must use `resolveCustomerEnv` consistent with all H1 surfaces.
- **Capacity selector pattern:** reuse the H1.4 `CapacitySelector` client component verbatim — pulling it into a shared component is a follow-up, not in H2 scope.
- **PostHog feature flag:** wrap the cost UI in `cost-attribution-h2` flag for staged rollout (10% → 50% → 100% over 7 days).

## Tests

**Unit (Vitest):**
- `capacity-cost.test.ts` — `shareOfBill` per-capacity correctness, multi-currency partition, missing-pricing fallback. (H1.3 already has a baseline.)
- `cost-observations-v2.test.ts` — write path, idempotent on-conflict, period boundary handling.
- `workload-mix-helpers.test.ts` — pure helper for stacked-area + heatmap data transforms.
- `metrics-app/__tests__/dax-queries.contract.test.ts` — extend with Story 5 cases pinning the per-capacity SUMMARIZE shape (`TimePointCUDetail` or `MetricsByItemandHour` fallback). Adapter parses per-capacity rows, not tenant-aggregate.

**Integration (Vitest):**
- `cron/collect/__tests__/cost-attribution-path.test.ts` — full cost calc arm with mocked metrics-app + DB.
- `api/customers/[id]/cost/route.test.ts` (if we expose an API route — possibly the page reads directly from DB).

**Contract (Vitest):**
- Extend `catalog-contract.test.ts` (H2.0 skeleton) — fill in the 3 `describe.todo` stubs:
  - Column shape on `MetricsByItemandHour` matches spike (already partially done by H1.4.3 hotfix).
  - Relationship path `Capacities → Items → MetricsByItemandHour` is intact.
  - Workload-mix aggregation columns exist on per-operation tables.

**E2E (Playwright):**
- New spec covering Cost Attribution: render → top-N opens drilldown → currency formatting matches → "no pricing" empty state path.
- New spec covering Workload Mix: render → heatmap interactive → workload type filter.
- Capture screenshots in `test-results/gallery/h2-cost-attribution/` and `.../h2-workload-mix/` per project convention.

## Open questions (resolve during H2.1 brainstorm)

- **Item identity stability.** Microsoft's `ItemId` is a UUID. Does it survive a workspace rename / item rename? If yes, our cost trace stays continuous. If no, we need a fallback identity (workspace + item-name + creation-time?). Spike before H2.1 design.
- **Detail-table 0-row hypothesis.** ~~Two paths:~~ **Resolved into Story 5.** The 1-hour validation spike is now the first acceptance criterion of Story 5 — branches (a) `TimePointCUDetail` validates and we use it natively, or (b) `MetricsByItemandHour` SUMMARIZE-by-capacity is the durable fallback. Either way Story 5 ships per-capacity-correct CU%.
- **Workload type taxonomy.** The spike confirmed `Workloads` and `WorkloadForStorage` dimensions exist but didn't enumerate the values. H2.1 brainstorm starts with `EVALUATE 'Workloads'` to get the canonical list.
- **Heatmap CU% color scale.** Microsoft's report uses a fixed 0-100% scale; on F2/F4 capacities that lives mostly in 0-20%. Consider per-capacity rescaling so colors are useful at any SKU.

## Forward-pointer to H3 / H4

- H3 inherits `cost_observations_v2` and adds a "throttling cost" column derived from `TimePointOverageDetail` (we'll know by then whether the detail tables work).
- H4 finally drops `fuam_*` columns and the `collectFuamMetrics` path; cost-attribution becomes the primary FinOps surface and the FUAM-Core PDF report is officially retired.
