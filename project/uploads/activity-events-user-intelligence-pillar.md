# PRD: Activity Events — User Intelligence Pillar

**Level:** 4 (multi-phase pillar)
**Date:** 2026-05-11
**Status:** draft / queued
**Scope:** product + infra
**Origin:** discovered organically during 2026-05-10 metrics-app investigation while assessing Neon table sizes. `activity_events` is the largest table (190 MB / 130k rows for one customer) but currently surfaces zero customer-facing value. Microsoft retains only 30 days at source, so we have a closing window to harvest analytical signal that's permanently un-refreshable if missed.

## TL;DR

LayerPulse already collects every user interaction across customer Power BI tenants via `/admin/activityevents` (Microsoft Admin API). Today this drives nothing customer-visible — it shows as a generic "latest N events" list on the partner-side `/activity` page. The same data unlocks **cost-attribution by user**, **adoption analytics**, **sleeper-dataset detection**, **compliance audit logs**, and **Copilot adoption tracking** — most of which competitors can't answer without major BI engineering.

This PRD covers (a) the storage strategy to keep this data viable as LayerPulse scales, (b) a catalog of value surfaces to ship on top of it, and (c) phased implementation from "stop leaking storage" → "ship rollups" → "ship 2 customer-visible surfaces" → "decide on warehouse migration."

---

## Problem & Opportunity

**Current state:**
- `activity_events` table holds last ~3 days of raw events (post 2026-05-10 prune)
- ~54k events/day for SBM-class tenants
- Single customer = 190 MB. Free Neon tier (500 MB) saturates at ~3 customers.
- Microsoft Admin API only exposes 30 days of history — events older than that are gone forever from the source.
- Zero customer-visible analytics surface today

**Opportunity:**
- The data shape is the highest-signal feed in the Power BI / Fabric ecosystem: who-did-what-when-where, every operation typed and tagged
- Competitors (Microsoft's own Capacity Metrics App, FUAM template app) do not surface per-user cost attribution or sleeper-dataset detection
- LayerPulse's existing positioning (FinOps + Semantic Model Quality) lines up: activity events is the join key that translates "which capacity costs $X" into "which user/team drives $X"

**Why this is competitively defensible:** activity events is admin-API-gated. Microsoft's own first-party tools intentionally don't surface user-level cost because of internal political reasons (Microsoft sells per-user licensing; revealing per-user CU consumption complicates that story). Third-party tools that do this analysis well are rare and expensive (think Stratus AI, Power BI Sentinel).

---

## Surfaces catalog (value pulls)

### FinOps angles (closest fit to current positioning)

#### S1 — Cost-by-user
**As a** customer's data manager, **I want** to see which 10 users consumed the most CU last month, **so that** I can route conversations about over-consumption to specific people rather than playing whack-a-mole with datasets.
- Acceptance: per-user CU consumption ranked + cost translation via `capacity_pricing`, drillable to which datasets/reports each user hit
- Data: `activity_events.userId` × per-event CU lookup from `item_metrics_hourly` (or estimated weighting)

#### S2 — Cost-by-department / org unit
**As a** customer's finance lead, **I want** to break down Fabric spend by org unit (engineering, finance, ops), **so that** I can do internal chargeback.
- Acceptance: configurable user→department mapping (CSV upload OR pulled from Entra group memberships), monthly spend table, exportable CSV
- Depends on: S1

#### S3 — Sleeper-dataset detector
**As a** customer's data engineer, **I want** to see datasets with zero queries in the last 60 days, **so that** I can archive/delete dead assets that still drain capacity for refreshes.
- Acceptance: list of datasets with `last_queried_at` + refresh-spend per month + "archive candidate" badge
- Data: `MAX(activity_events.timestamp) WHERE operation='ViewReport' OR similar` per `dataset_id`, joined to `item_metrics_hourly` for refresh cost

### Adoption / governance angles

#### S4 — DAU/WAU/MAU per env
**As a** customer's BI lead, **I want** a basic adoption health dashboard, **so that** I can show my CIO usage is up/down quarter-over-quarter.
- Acceptance: daily/weekly/monthly active user counts + sparkline trend, 90-day history
- Simple but stand-alone valuable

#### S5 — Onboarding funnel
**As a** customer's Center of Excellence lead, **I want** to see new-user adoption stages (first query → first refresh → repeat visitor → power user), **so that** I can identify where users drop off.
- Acceptance: cohort funnel chart, configurable definition of each stage, per-month cohort

#### S6 — Power user identification
**As a** customer's account manager, **I want** to know who the top 5% of users are by consumption, **so that** I prioritize their support tickets and stability concerns.
- Acceptance: top-N user list with consumption + query frequency + departments

#### S7 — Off-hours usage patterns
**As a** customer's compliance officer, **I want** to flag unusual after-hours data access, **so that** I can audit potential data exfiltration or unusual behavior.
- Acceptance: configurable "off hours" window (UTC offset + day-of-week), heatmap of access, alerting hook
- Compliance value, possibly required for SOC 2 / HIPAA customers

#### S8 — Copilot adoption tracking
**As a** customer's analytics architect, **I want** to see how much Copilot for Fabric is actually being used, **so that** I justify (or kill) the Copilot license spend.
- Acceptance: counts of Copilot-tagged events per user/dataset/week, trend chart
- Timing-sensitive: Microsoft is shipping Copilot hard; usage data is novel right now

### Quality / reliability angles

#### S9 — Refresh-to-first-query latency
**As a** customer's data engineer, **I want** to see how long after a refresh new data is consumed, **so that** I can right-size refresh schedules (don't refresh hourly if no one looks until next morning).
- Acceptance: per-dataset distribution of (refresh_completed_at → next_query_at), recommendation badge for over-scheduled refreshes
- Direct FinOps wins (reduces refresh CU spend)

#### S10 — Query failure rate per dataset
**As a** customer's BI lead, **I want** to see datasets with >5% query failure rates, **so that** I fix them before customers complain.
- Acceptance: per-dataset success rate, sortable by failures, drillable to specific failed events

#### S11 — Refresh cadence vs actual usage
**As a** customer's finance lead, **I want** to see datasets refreshing more often than they're queried, **so that** I can identify pure waste.
- Acceptance: per-dataset refresh count × query count ratio, "over-refreshing" tag

### Compliance / security angles

#### S12 — Export audit log
**As a** customer's compliance officer, **I want** a searchable audit log of all data exports (Excel/CSV/PDF), **so that** I can answer auditor "who exported what" questions.
- Acceptance: searchable table, retention 1+ year (requires warehouse tier per below), exportable as CSV

#### S13 — RLS rule evaluation log
**As a** customer's data architect, **I want** to see which row-level-security rules actually fired in practice, **so that** I can spot rules that never apply (and are likely misconfigured).
- Acceptance: per-rule firing frequency, "never fires" warning

---

## Storage strategy

| Tier | Cost | Detail kept | Suits | Notes |
|---|---|---|---|---|
| **0 — Current** (Neon free, 3-day raw) | $0 | 3 days raw | Demo only | Today's state post 2026-05-10 prune; saturates at ~3 customers |
| **1 — TTL only** (Neon free, 30-day raw) | $0 | 30 days raw | 1 large customer OR a couple small | Matches Microsoft's source retention; no historical analytics |
| **2 — Neon Pro 10GB + 30d raw + indefinite rollups** | $25/mo | 30 days raw, daily aggregates forever | First 5-10 paying customers | Recommended starting point — small infra commitment, unlocks most surfaces |
| **3 — Warehouse pipeline (BigQuery/Snowflake/Lakehouse)** | $50-200/mo at scale | Everything forever, fast queries | 20+ customers or compliance-heavy customers | Defer until product-market fit proven |

The right move is to **build for Tier 2 from the start** — meaning the rollup table schema works whether raw events are kept 3 days or 30. Rollups are forever-retained either way, so analytics keep working even if raw events trim aggressively.

---

## Implementation phases

### Phase 1 — TTL cleanup arm (next maintenance hotfix, ~1h)

**Goal:** stop the disk-leak problem cleanly. Bound steady-state storage.

Tasks:
- Add `cleanup_old_activity_events(retentionDays)` to the daily cron at `runCollectionForEnv`
- Default 30 days (matches Microsoft source retention)
- Configurable per-env (some compliance customers may want shorter retention)
- Sentry breadcrumb on each cleanup pass (rows deleted, before/after sizes)

Acceptance criteria:
- [ ] Activity events older than 30d auto-deleted nightly
- [ ] DB size stays bounded at ~200 MB per Metrics-App-connected customer
- [ ] Cleanup is failure-isolated (cleanup failure doesn't break the cron)

### Phase 2 — Rollup table layer (1-2 days)

**Goal:** make analytics tractable on the data we have, regardless of raw retention.

Tasks:
- New tables:
  - `daily_user_metrics(env_id, day, user_id, query_count, unique_datasets_touched, refresh_count, export_count, cu_seconds_estimated, clerk_org_id)`
  - `daily_dataset_metrics(env_id, day, dataset_id, query_count, unique_users, refresh_count, last_query_at, refresh_success_rate, cu_seconds, clerk_org_id)`
  - `daily_workspace_metrics(env_id, day, workspace_id, query_count, unique_users, datasets_touched, cu_seconds, clerk_org_id)`
- Nightly aggregation job that reads `activity_events` + `item_metrics_hourly` and emits these rollups
- Backfill: process all available raw events on first run
- Indexes for the per-day × per-env query pattern

Acceptance criteria:
- [ ] Three rollup tables with daily granularity
- [ ] Aggregation job runs as a sibling cron arm
- [ ] Storage footprint: ~10-50 KB per env per day (vs 50 MB raw)
- [ ] Backward-compatible with raw events kept or trimmed

### Phase 3 — Ship 2 highest-impact surfaces (1-2 weeks)

**Goal:** ship the surfaces that drive the most pain pulls.

Candidates (pick 2 based on customer feedback at the time):
1. **S1 Cost-by-user** — pairs directly with H1.3 capacity pricing, immediate FinOps value
2. **S3 Sleeper-dataset detector** — immediate cost-savings angle, easy to demo, viral demo material
3. **S4 DAU/WAU/MAU** — broadest appeal, stand-alone usefulness

Recommended pair: **S1 + S3**. They share the rollup tables, are both FinOps-positioned (matches LayerPulse's current narrative), and demo dramatically ("here's the 10 people costing you $X" + "here's $Y of dead datasets").

Acceptance criteria:
- [ ] Two customer-visible pages with these analytics
- [ ] Drillable from rollup → raw events for verification (so customers can audit)
- [ ] Includes export-to-CSV for internal chargeback workflows

### Phase 4 — Decide on warehouse migration (deferred)

**Triggers to revisit:**
- More than 20 paying customers OR any compliance-required customer with >1y audit retention
- Rollup tables themselves exceeding 2-3 GB
- Customer asks for sub-second queries over full-history data
- Need for ML/AI features on activity data (anomaly detection, predictive consumption)

**Decision points:** which warehouse (BigQuery / Snowflake / Fabric Lakehouse / Postgres-with-TimescaleDB), pipeline tool (Fivetran / native / custom), cost model.

Not in scope today.

---

## Out of scope (deferred)

- ML / AI on activity data (anomaly detection, predictive cost): later, after rollups are populated for 60+ days
- Real-time streaming dashboards (events as they happen): batch is fine for our use cases
- Cross-customer benchmarking ("you're in the top 10% of customers by CU/user"): privacy-sensitive, defer until customer mass justifies anonymized aggregates
- Power BI Premium Per User license cost analysis: separate billing data source, not in activity events
- Refresh failure root-cause analysis from activity events: refresh failure detail lives in a separate Admin API (`/admin/datasets/{id}/refreshes`), not activity events

---

## Open questions (decide before kickoff)

1. **Retention default** — 30 days (matches MS source) or 7 days (more aggressive)? Customer config?
2. **Rollup granularity** — daily everywhere, or hourly for some metrics (e.g., DAU calc)?
3. **User identity stability** — `userId` in activity events is the Power BI principal ID. How do we resolve to human-readable name? Entra Graph API? Manual override?
4. **Department / org unit source** — manual CSV upload (customer-provided), Entra group sync (auto but needs additional permissions), or both?
5. **Surface ordering** — which 2 ship first in Phase 3? Worth a brief customer interview before commit.
6. **Pricing tier exposure** — are S1 and S3 available on the free tier or Pro-only? (LayerPulse currently has free / Pro / Enterprise per `subscriptions` table.)
7. **Multi-env aggregation** — do partners see cost-by-user across all their customers? Single-customer view only? Org-level chargeback?

---

## Related work + MEMORY references

- 2026-05-10 root-cause investigation that surfaced this: Neon at 49.5% capacity, `activity_events` is 190 MB of 253 MB. Without TTL, blows the free tier in ~3-4 weeks.
- Existing infrastructure already in place:
  - Daily cron at 02:00 UTC (`/api/cron/collect`) — can host the cleanup + rollup jobs
  - `activity_events` collector at `src/lib/fabric/activity-events.ts` — works, well-tested
  - Stuck-collecting recovery (PR #164) — protects the cron path
  - `capacity_pricing` (H1.3) — provides $/CU conversion for cost-attribution surfaces
- Adjacent PRDs that this complements:
  - `c2d-documents-pillar.md` — auto-generated docs could enrich with "most-queried datasets" from rollups
  - `h2-cost-attribution.md` — current cost view is by ITEM; activity events adds the by-USER dimension
  - `h2-2-workload-mix.md` (in flight) — workload classification (PowerBI/Dataflow/Pipeline/Spark/Dataset/Other) directly informs cost-by-user breakdowns
- Anti-rationalization:
  - Sometimes data feels "huge and intimidating" so the instinct is to delete it. Activity events is the opposite case — the data is the value, and the storage cost is the price of admission. Decision should be "how do we keep more" not "how do we keep less."
  - Microsoft's 30-day retention at source is the actual ceiling on raw-event analytics. Anything we want past 30d must be in rollups, period.

---

## Effort summary

| Phase | Effort | Cost impact | Risk |
|---|---|---|---|
| 1: TTL cleanup | 1h | $0 (stops leak) | Low |
| 2: Rollup tables | 1-2 days | $0-25/mo (Neon tier may need upgrade for raw + rollups) | Low |
| 3: 2 surfaces | 1-2 weeks | Same as Phase 2 | Medium (UX + customer feedback dependent) |
| 4: Warehouse migration | 1-2 months | $50-200/mo + ongoing | High (deferred until product-market fit) |

**Recommended sequencing:** Phase 1 → 2 quickly (this week or next) so the data has a sane retention story, then Phase 3 in a future milestone when product strategy calls for it. Phase 4 deferred indefinitely.
