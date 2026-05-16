# LayerPulse data-inventory survey & gap analysis

> **Generated:** 2026-05-15  
> **Scope:** every Fabric / Power BI / DAX endpoint LayerPulse calls today, every Postgres table that stores the result, every retention or window filter that bounds what we keep, and a 6-axis gap analysis (Reports · Dataflows · Fabric artifacts · Users · Security groups · Apps) with a closing value-prop synthesis.  
> **Audience:** milestone planning. Accuracy outranks brevity — every claim is anchored to a file:line citation.

## Table of contents

1. [Current data surface](#1-current-data-surface) — every API + every target table  
   1.1 [Power BI REST](#11-power-bi-rest-uses-power-bi-token)  
   1.2 [Power BI Admin REST](#12-power-bi-admin-rest-uses-power-bi-token-with-sp-admin-scope)  
   1.3 [Fabric REST](#13-fabric-rest-uses-fabric-token)  
   1.4 [Capacity Metrics App (DAX over executeQueries)](#14-capacity-metrics-app-dax-over-executequeries)  
   1.5 [FUAM Lakehouse (deprecated)](#15-fuam-lakehouse-deprecated--scheduled-for-removal-in-h4)  
   1.6 [Validation-only endpoints (not productionised)](#16-validation-only-endpoints-not-in-cron)  
   1.7 [Canonical table inventory](#17-canonical-table-inventory-srclibdbschemats)
2. [Restriction / retention audit](#2-restriction--retention-audit)  
   2.1 [Time-window filters on ingest](#21-time-window-filters-on-ingest)  
   2.2 [Retention DELETEs](#22-retention-deletes)  
   2.3 [Top-N caps that silently drop rows](#23-top-n-caps-that-silently-drop-rows)  
   2.4 [Page-size / batch caps that prevent backfill](#24-page-size--batch-caps-that-prevent-backfill)  
   2.5 ["Recent activity only" assumptions baked into upserts / filters](#25-recent-only-assumptions-baked-into-upserts--reads)
3. [Gap analysis — six axes the user wants to capture](#3-gap-analysis--six-axes-the-user-wants-to-capture)  
   3.1 [All reports (PBI / paginated / Fabric Eventstreams etc.)](#31-all-reports)  
   3.2 [All dataflows (Gen1 + Gen2)](#32-all-dataflows-gen1--gen2)  
   3.3 [All Fabric artifacts (Lakehouse / Warehouse / Notebook / ML / RTI / …)](#33-all-fabric-artifacts-the-full-workloadtype-catalog)  
   3.4 [All users (UPN · license · MFA · usage)](#34-all-users)  
   3.5 [All security groups (AAD groups + role assignments)](#35-all-security-groups)  
   3.6 [All apps (PBI apps + Fabric apps)](#36-all-apps)
4. [Value-proposition synthesis](#4-value-proposition-synthesis)
5. [Final tally](#5-final-tally)

---

## 1. Current data surface

All sources LayerPulse actually reads in production today. Authentication is captured per row; `SP` means a service-principal token from `SpIdentityProvider`, `User` means the user-delegated refresh-token path (`UserDelegatedIdentityProvider`), `Either` means `pickIdentityProvider(...)` in `src/lib/fabric/auth.ts` resolves to whichever the env has.

### 1.1 Power BI REST (uses Power BI token)

| API endpoint | Auth | Cadence | Target table(s) | What it captures | Retention | Restrictions / filters | Source |
|---|---|---|---|---|---|---|---|
| `GET /v1.0/myorg/groups` | Either | onboarding + Fabric-validate connection | `workspaces` (indirect, via introspection) | Shared workspaces visible to caller — `id, name, type, state, capacityId, isOnDedicatedCapacity` | none (full overwrite via introspection batch upsert) | NONE | `src/lib/fabric/api.ts:203-208` (`listWorkspaces`) |
| `GET /v1.0/myorg/groups/{ws}/datasets` | Either | Bronze-fidelity discovery only (when Admin API unavailable) | `semantic_models` | Per-workspace datasets — `id, name, configuredBy, description, isRefreshable, isOnPremGatewayRequired` | full overwrite | `isOnPremGatewayRequired` rows are dropped at the helper level | `src/lib/fabric/api.ts:210-215` + `introspection.ts:331-342` |
| `GET /v1.0/myorg/groups/{ws}/datasets/{ds}/tables` | Either | per-model scan (user-clicked) | not persisted — used as fallback when DMV fails | Table list w/ columns + measures from the dataset | n/a | wrapped in try/catch returning `[]` on 400/404 | `src/lib/fabric/api.ts:217-232` |
| `POST /v1.0/myorg/groups/{ws}/datasets/{ds}/executeQueries` (DAX `INFO.VIEW.TABLES`) | Either | per-model scan | `tables` | All tables in a semantic model | overwrite on re-scan (children deleted first, see `introspection.ts:571-573`) | filters system tables `LocalDateTable_*` / `DateTableTemplate_*` in helper | `introspection.ts:31-36, 575-596` |
| `POST … executeQueries (DAX INFO.VIEW.COLUMNS)` | Either | per-model scan | `columns` | All columns | overwrite (Scanner-primary, INFO.VIEW fallback per table) | filtered by user-table list (system tables already excluded) | `introspection.ts:598-669` |
| `POST … executeQueries (DAX INFO.VIEW.MEASURES)` | Either | per-model scan | `measures` | Measure DAX expressions, dependency depths | overwrite | `Expression` is null over REST — TMDL / Scanner are merged via `TMDL > Scanner > INFO.VIEW` priority | `introspection.ts:671-732` |
| `POST … executeQueries (DAX INFO.VIEW.RELATIONSHIPS)` | Either | per-model scan | `relationships` | From/To tables + columns, cardinality, cross-filter direction | overwrite | `FromTable` / `ToTable` must both resolve to inserted tables — orphans dropped | `introspection.ts:734-757` |

### 1.2 Power BI Admin REST (uses Power BI token, with SP admin scope)

| API endpoint | Auth | Cadence | Target table(s) | What it captures | Retention | Restrictions / filters | Source |
|---|---|---|---|---|---|---|---|
| `GET /v1.0/myorg/admin/groups?$top=5000` | SP (Silver+) | every cron tick (introspection) | `workspaces` (auto-inserts new shared workspaces) | All shared groups in tenant — `id, name, type, state, capacityId, isOnDedicatedCapacity` | full overwrite each tick | Filtered to `type === "Workspace"` (drops `PersonalGroup`); silently drops anything Admin API doesn't return (stale-cleanup) | `src/lib/fabric/api.ts:236-241`, `introspection.ts:135-169` |
| `GET /v1.0/myorg/admin/datasets?$top=5000` | SP (Silver+) | every cron tick | `semantic_models` (batched upsert + stale-cleanup) | All tenant datasets — `id, name, configuredBy, description, isRefreshable, isOnPremGatewayRequired, workspaceId` | full overwrite | Filters out `isOnPremGatewayRequired` rows + datasets whose `workspaceId` isn't in `wsLookup` | `src/lib/fabric/api.ts:243-248`, `introspection.ts:181-204` |
| `POST /v1.0/myorg/admin/workspaces/getInfo?datasetExpressions=true&datasetSchema=true&getArtifactUsers=false` → poll `scanStatus/{id}` → `scanResult/{id}` | SP (Silver, tenant flag) | per-model scan (LRO, ~30s init + 60s poll deadline) | `columns` (primary) + `measures` (expression source) | Schema + DAX expressions + M source per dataset; **discards**: `lineage`, `datasources`, `dashboards`, `reports`, `dataflows`, `getArtifactUsers` (explicitly turned off) | n/a — read in flight | gated by tenant flag `AdminApisIncludeDetailedMetadata` (schema) + `AdminApisIncludeExpressions` (DAX); SP must be in "Service principals can access read-only admin APIs" group | `src/lib/fabric/api.ts:494-626` |
| `GET /v1.0/myorg/admin/activityevents?startDateTime={s}&endDateTime={e}` (paginated via `continuationUri`) | SP | daily cron, **24 × 1-hour windows in parallel @ concurrency=6** | `activity_events` | Audit events — `Id, Operation, UserId (UPN!), Activity, ItemName, WorkspaceName, DatasetName, CreationTime` + full JSON in `details` | NONE today (kept forever) | **Admin API caps each request at 1-hour windows** + same-UTC-day; collector only loops the last 24h; UPN is stored verbatim (see PRD `users-page-pillar.md`) | `src/lib/fabric/api.ts:270-291`, `activity-events.ts:25-56` |
| `GET /v1.0/myorg/admin/capacities/refreshables?$expand=capacity,group&$top=1000&$skip=N` | SP (Power BI Service Admin) | every cron tick | `refreshables` (per-`(env, dataset, takenAt)` UPSERT) | Per-dataset refresh-quality snapshot — `refreshCount, averageDuration, medianDuration, lastRefresh.{startTime,endTime,status,refreshType}, refreshSchedule, capacity, group, considered{Start,End}Time` | NONE explicit (each `takenAt` becomes a new row — 1 row per env per dataset per cron tick) | hard-cap `MAX_PAGES=50` → 50 k datasets ceiling; `$top=1000` page size; `'0001-01-01T00:00:00Z'` .NET sentinels coerced to null | `src/lib/fabric/api.ts:260-268`, `admin-refreshables.ts:35-104` |
| `GET /v1.0/myorg/admin/workspaces/modified?excludePersonalWorkspaces=true&excludeInActiveWorkspaces=true&modifiedSince={iso}` | SP | every cron tick (when `lastScannerRunAt < 30d` old) | not persisted — drives **incremental scanner gating** | List of workspace UUIDs touched since timestamp; unchanged workspaces are skipped by introspection | n/a | **Microsoft caps `modifiedSince` at 30 days**; we use 29.5 d for clock skew; falls back to full scan on > 30 d or null | `workspaces-modified.ts:32, 80-91, 113-168` |

### 1.3 Fabric REST (uses Fabric token)

| API endpoint | Auth | Cadence | Target table(s) | What it captures | Retention | Restrictions / filters | Source |
|---|---|---|---|---|---|---|---|
| `GET /v1/capacities` | Either | onboarding (`validateConnection`) | `capacities` (indirect — populated lazily from FUAM today, see § 1.5) | Capacity inventory — `id, displayName, sku, region, state` | overwrite | NONE | `src/lib/fabric/api.ts:190-195` |
| `POST /v1/workspaces/{ws}/semanticModels/{ds}/getDefinition?format=TMDL` → LRO poll | Either | per-model scan (best-effort enrichment) | `measures.expression` (priority winner over Scanner + INFO.VIEW) | TMDL parts for a semantic model — definition.tmdl, expressions.tmdl, etc. | wrapped in `Promise.allSettled` — failures become warnings | LRO 45 s deadline; 30 s request timeout; SP must have workspace `Contributor`+ membership | `src/lib/fabric/api.ts:412-492`, `introspection.ts:514-519` |

### 1.4 Capacity Metrics App (DAX over executeQueries)

All five queries below are sent **via Power BI's executeQueries to the customer-installed Metrics App workspace + dataset** (`metrics_app_workspace_id` + `metrics_app_dataset_id` on the env). They're DAX, but transport is `POST /v1.0/myorg/groups/{ws}/datasets/{ds}/executeQueries`. Per the `mparameter.ts` probe, queries are wrapped with `MPARAMETER 'CapacityID' = "<guid>"` (v40) or `MPARAMETER 'CapacitiesList' = { "<guid>" }` (v53) and iterated per-capacity. Auth: SP (probe persists the IDs).

| Query | Cadence | Target table(s) | What it captures | Retention | Restrictions / filters | Source |
|---|---|---|---|---|---|---|
| `DAX_PROBE_CAPACITIES` — `EVALUATE TOPN(50, 'Capacities')` | onboarding ("Connect & Test") | not persisted (probe only) | Verifies Build perm + tenant flag + that the dataset is a real Metrics App | n/a | **`TOPN(50, ...)` — hard cap on tenants with >50 Metrics-App-tracked capacities** | `dax-queries.ts:37`, `route.ts: api/customers/[id]/probe-metrics-app/route.ts` |
| `DAX_INFO_TABLES` — `EVALUATE INFO.VIEW.TABLES()` | every cron tick + canary | not persisted as rows, but feeds `selectAdapter` + canary baseline | Metrics App schema fingerprint (table names) | `metrics_canary_baseline` keeps **last known-good signature only** (1 row per rebaseline) | n/a | `dax-queries.ts:40`, `collect.ts:179`, `canary.ts` |
| `DAX_INFO_MEASURES` — `EVALUATE INFO.VIEW.MEASURES()` | canary only | not persisted | Measure names for drift detection | n/a | `Expression` is null over REST (project gotcha) | `dax-queries.ts:43`, canary baseline |
| `DAX_CAPACITIES` — `SELECTCOLUMNS('Capacities', …)` | every cron tick (after INFO.VIEW.TABLES) | `capacity_snapshots` (UPSERT keyed on `(env, capacity, takenAt)`) | Per-capacity inventory — `CapacityId, CapacityName, Sku, CapacityPlan, Region, VCores, MemoryGB, State` | NONE — every cron tick writes a fresh `takenAt` row | F-SKU+ only (Microsoft's classifier filters trial-tier) | `dax-queries.ts:48-61`, `collect.ts:187-191`, `adapter-v1.ts:27` |
| `DAX_ITEMS_RECENT` — `SELECTCOLUMNS(FILTER('Items', [Timestamp] >= UTCNOW() - 14), …)` | every cron tick | `item_metadata` (UPSERT keyed on `(env, capacity, item)`) | Per-Fabric-item current state — `CapacityId, ItemId, ItemKind, ItemName, WorkspaceId, WorkspaceName, BillableType, LastSeenAt` | overwrite per-item; stale items linger until they leave the 14d window | **`>= UTCNOW() - 14` filter — anything older than 14 d disappears** | `dax-queries.ts:68-84`, `collect.ts:195-199` |
| `DAX_ITEM_METRICS_HOURLY` — `SUMMARIZECOLUMNS(MetricsByItemandHour[PremiumCapacityId], [ItemId], [DateTime], …)` `WHERE [DateTime] >= UTCNOW() - 1` | every cron tick **per-capacity (MPARAMETER loop)** | `item_metrics_hourly` (PK `(env, capacity, item, hour)`) + derives `time_points` via `aggregateItemMetricsToTimePoints` | Per-item, per-hour CU rollup — `CU_seconds, Duration_seconds, OperationCount` | NONE explicit | **`>= UTCNOW() - 1` — only last 24 h** | `dax-queries.ts:208-229`, `collect.ts:261-296` |
| `DAX_WORKLOAD_30D` — `SUMMARIZECOLUMNS(MetricsByItemandOperationandHour, …)` `WHERE [DateTime] >= UTCNOW() - 30` | every cron tick (after metrics-app `ok`, MPARAMETER per-capacity) | `workload_metrics` (PK `(env, cap, bucket, grain, workload)`, **`day` + `hour` grains in same pass**) | Workload-class CU rollup (`Power BI / Dataflow / Pipeline / Spark / Dataset / Other`) per `(capacity, hour, operation)`, classified via `workload-classification.ts` | **explicit `DELETE … bucket_starts_at < NOW() - INTERVAL '31 days'`** before upsert | **`>= UTCNOW() - 30`**; classifier `Other`-bucket cases emit Sentry breadcrumb to grow the lookup table | `dax-queries.ts:249-270`, `collect-workloads.ts:218-298` |

### 1.5 FUAM Lakehouse (deprecated — scheduled for removal in H4)

| API endpoint | Auth | Cadence | Target table(s) | What it captures | Retention | Restrictions / filters | Source |
|---|---|---|---|---|---|---|---|
| `mssql` connection to `<fuam_endpoint>` (FUAM_Lakehouse SQL analytics endpoint, ActiveDirectoryServicePrincipal auth) → `SELECT TOP 5000 … FROM capacity_metrics_by_timepoint WHERE TimePoint >= DATEADD(day,-1,GETDATE())` | SP | every cron tick (when `fuam_endpoint` set + SP creds) | `capacity_metrics` (DELETE-then-insert window) | Per-capacity TimePoint metrics — `TimePoint, CapacityId, TotalCUs, TotalCUUsagePercentage, InteractiveDelayPercentage, InteractiveRejectionPercentage` | **DELETE rows with `timestamp >= now-24h` before re-insert** | **`TOP 5000`** + **`>= DATEADD(day,-1,GETDATE())`** — last 24 h cap | `fuam.ts:184-232` |
| `SELECT TOP 5000 … FROM capacity_metrics_by_item_by_operation_by_day WHERE Date >= DATEADD(day,-1,GETDATE())` | SP | every cron tick | `cost_observations` (DELETE-then-insert) | Per-item-per-operation CU — `ItemId, ItemKind, OperationName, TotalCUs, WorkspaceId` | **DELETE rows with `timestamp >= now-24h`** | **`TOP 5000`** + **last 24 h** | `fuam.ts:240-280` |
| `SELECT TOP 100 [CapacityId], [displayName] FROM capacities` | SP | every cron tick | `capacities` (auto-insert missing) | FUAM capacity directory used for the FUAM-CapacityId → DB-UUID mapping | n/a | **`TOP 100`** — > 100 capacities silently truncated | `fuam.ts:126-128` |

### 1.6 Validation-only endpoints (NOT in cron)

These run via `pnpm validate:fabric` / `validate:fidelity` / `validate:governance` and write to `validation-reports/` only — none of them currently persist to the DB. Worth knowing because each is a candidate for productionisation.

| Endpoint | Source | Persisted? |
|---|---|---|
| `GET /v1.0/myorg/admin/tenantsettings` (Fabric audience host — `api.fabric.microsoft.com/v1/admin/tenantsettings`) | `validate-governance/index.ts:523-529` | No — Excel + JSON dumps. **The governance PRD (`docs/prd/governance-pillar.md`) plans to persist this.** |
| `GET /v1.0/myorg/admin/capacities` (admin view with `capacityUserAccessRight`) | `validate-governance/index.ts:524` | No — Excel only. |
| `GET /v1.0/myorg/admin/groups/{ws}/users` | `validate-governance/index.ts:539` | No — but the audit confirms SP can read workspace roles. |
| `GET /v1.0/myorg/groups/{ws}/datasets/{ds}/refreshes?$top=10` | `validate-fidelity/endpoints.ts:179-186` | No — `refresh_events` table exists but is currently empty for new envs (FUAM's `refresh_events` ingest was never wired up). |
| `GET /v1.0/myorg/groups/{ws}/datasets/{ds}/datasources` | `validate-fidelity/endpoints.ts:187-195` | No. |
| `GET /v1.0/myorg/groups/{ws}/reports` | `validate-fidelity/endpoints.ts:196-204` | No — **this is the headline gap §3.1**. |
| `POST /v1/workspaces/{ws}/reports/{report}/getDefinition` LRO | `validate-fidelity/endpoints-async.ts:328-336` | No. |
| `POST … executeQueries (DAX INFO.VIEW.ROLES)` — for RLS extraction | `validate-fidelity/endpoints.ts:156-177` | No — and 400s on REST anyway; Scanner is the only route to RLS code. |

### 1.7 Canonical table inventory (`src/lib/db/schema.ts`)

Counted directly from `pgTable(...)` declarations:

| # | Table | Pillar | Indices of note | Provenance |
|---|---|---|---|---|
| 1 | `partners` | Platform | unique `clerk_org_id` | Clerk → DB at promote-partner time |
| 2 | `customer_environments` | Platform | `idx_customer_env_org`, `idx_customer_env_partner` | Onboarding form + cron orchestrator (status state machine) |
| 3 | `capacities` | Fabric | unique `(env, fabricCapacityId)` | FUAM mapping (fuam.ts) + introspection |
| 4 | `workspaces` | Fabric | unique `(env, fabricWorkspaceId)`, `idx_workspaces_starred_env` | Admin API `/groups` |
| 5 | `semantic_models` | Fabric | unique `(env, fabricDatasetId)` | Admin API `/admin/datasets` |
| 6 | `tables` | Semantic model | `idx_tables_model` | DAX `INFO.VIEW.TABLES` |
| 7 | `columns` | Semantic model | `idx_columns_table` | Scanner (primary) + DAX `INFO.VIEW.COLUMNS` (fallback) |
| 8 | `measures` | Semantic model | `idx_measures_model` | TMDL > Scanner > `INFO.VIEW.MEASURES` |
| 9 | `relationships` | Semantic model | `idx_relationships_model` | DAX `INFO.VIEW.RELATIONSHIPS` |
| 10 | `capacity_metrics` | Time-series | `idx_cap_metrics_org_cap_time` | FUAM `capacity_metrics_by_timepoint` |
| 11 | `cost_observations` | Time-series | `idx_cost_obs_org_time` | FUAM `capacity_metrics_by_item_by_operation_by_day` |
| 12 | `activity_events` | Time-series | `activity_events_natural_key_uniq` (NULLS NOT DISTINCT), `idx_activity_org_time` | Admin API `/activityevents` |
| 13 | `refresh_events` | Time-series | `idx_refresh_env` | **NOT CURRENTLY POPULATED** — table exists, no ingestor wired in |
| 14 | `refreshables` | Time-series | unique `(env, dataset, takenAt)` | Admin API `/admin/capacities/refreshables` |
| 15 | `health_scores` | Intelligence | `idx_health_env_time` | Computed post-collection |
| 16 | `recommendations` | Intelligence | `idx_rec_env`, `idx_rec_status` | Rule engine (`evidence/recommendations.ts`) |
| 17 | `documentation_assets` | Intelligence | `idx_doc_env` | Manual / future C2d pillar |
| 18 | `alert_configs` | Intelligence | `idx_alert_config_env` | Customer-entered |
| 19 | `alert_events` | Intelligence | `idx_alert_event_config` | `alerts/evaluate.ts` post-collection |
| 20 | `user_preferences` | Intelligence | PK `(clerk_user_id, clerk_org_id)` | Unsubscribe flow + future per-user prefs |
| 21 | `cron_run_snapshots` | Operations | `idx_cron_snap_env_time` | Drift detector (drift/evaluate.ts) |
| 22 | `subscriptions` | Billing | unique `polar_subscription_id` | Polar webhook |
| 23 | `invitations` | F-2 | `idx_invitations_partner`, `idx_invitations_email` | Partner POST /api/invitations |
| 24 | `capacity_snapshots` | Metrics App | unique `(env, capacity, takenAt)` | DAX `Capacities` |
| 25 | `item_metadata` | Metrics App | unique `(env, cap, item)`, `idx_item_meta_org_kind` | DAX `Items` (14d window) |
| 26 | `time_points` | Metrics App | PK `(env, cap, timePoint)` | Derived from item-metrics rollup |
| 27 | `item_metrics_hourly` | Metrics App | PK `(env, cap, item, hour)` | DAX `MetricsByItemandHour` (24h window) |
| 28 | `capacity_pricing` | Metrics App | `idx_cap_price_env_cap_validity` | Customer-entered actuals |
| 29 | `fabric_sku_pricing` | Metrics App | PK `sku` | Static vendor list-price seed |
| 30 | `metrics_dax_snapshots` | Metrics App | `idx_dax_snap_env_time` | Raw DAX retention (debug only; **7d cron-task TTL not yet implemented**) |
| 31 | `metrics_canary_baseline` | Metrics App | — | Last known-good schema signature |
| 32 | `metrics_canary_runs` | Metrics App | — | Canary execution log (ok/drift/error) |
| 33 | `workload_metrics` | Metrics App | PK `(env, cap, bucket, grain, workload)`, `idx_wm_env_cap_grain_time` | DAX `MetricsByItemandOperationandHour` |

**Total: 33 tables**, of which `refresh_events` is declared but unused, `documentation_assets` is declared but not yet populated, and `metrics_dax_snapshots` was supposed to have a 7d TTL job that was never built.

---

## 2. Restriction / retention audit

The user's directive is explicit: **no retention windows are wanted anymore — Azure Postgres Flex Server has abundant storage**. Below is every filter I found, ordered by blast radius.

### 2.1 Time-window filters on ingest

These are the silent killers — data Microsoft *has* but LayerPulse drops before persistence.

| Source | Filter | What it drops | If removed | Blast radius |
|---|---|---|---|---|
| `activity-events.ts:25-26` | `twentyFourHoursAgo = now - 24 h` → loops 24 × 1-hour windows | **Anything > 24h old never makes it in.** Power BI Admin `/activityevents` retains **30 days** by Microsoft policy; we read 24 h of it. | Replace 24h with 30 d (= 720 × 1h windows) ⇒ ~30× current row volume per env. For SBM Offshore: ~117 k rows / 24 h × 30 = **~3.5 M rows / env first backfill, ~117 k / day steady state**. Onboarding backfill could be a separate one-shot 30-day fetch. | One-time backfill: ~30× ingest cost on first cron tick after change; steady-state unchanged (already daily). DB size growth: ~150 MB / env / mo at SBM scale. |
| `dax-queries.ts:73` | `FILTER('Items', [Timestamp] >= UTCNOW() - 14)` in `DAX_ITEMS_RECENT` | **Any Fabric item idle > 14 days disappears from `item_metadata`.** | Drop the `FILTER` ⇒ full tenant-item census (= Microsoft's full Items dim, capped at the Metrics App's own retention which is typically 30-60 d but tenant-specific). | item_metadata grows ~3–4× at SBM scale (~5 k → ~20 k rows / env). Wasted-spend attribution would correctly classify long-idle Lakehouses currently invisible. |
| `dax-queries.ts:154` | `'MetricsByItemandHour'[DateTime] >= UTCNOW() - 1` in `DAX_TIMEPOINTS_24H` (DEPRECATED — replaced by aggregator in collect.ts as of hotfix #220, but the DAX comment block is the live spec) | Last 24 h only. Microsoft retains ~14 d in `MetricsByItemandHour`. | Widen to 14 d ⇒ ~14× per-cron-tick DAX cost. Better strategy: keep 24 h window on cron path, run a separate **first-run backfill** that pulls 14 d once. | item_metrics_hourly grows ~14× per env. SBM ~7500 rows/24h × 14 = ~105 k rows / first backfill. |
| `dax-queries.ts:220` | `'MetricsByItemandHour'[DateTime] >= UTCNOW() - 1` in `DAX_ITEM_METRICS_HOURLY` (active query) | Last 24 h only — same window as above. | Same fix. | Same shape. |
| `dax-queries.ts:261` | `'MetricsByItemandOperationandHour'[DateTime] >= UTCNOW() - 30` in `DAX_WORKLOAD_30D` | 30 d window — matches Microsoft's typical Metrics App retention; this one is **at the max already**. | None. | n/a |
| `fuam.ts:190, 245` | `WHERE TimePoint >= DATEADD(day,-1,GETDATE())` + `TOP 5000` | Last 24 h cap **and** 5000-row cap on FUAM lakehouse queries | FUAM is being removed in H4 — leave as-is. | n/a |
| `workspaces-modified.ts:32` | `MODIFIED_SINCE_MAX_WINDOW_MS = 29.5 d` (Microsoft hard cap) | If `last_scanner_run_at > 30 d` ago, falls back to full scan — that's the right behavior. | n/a — Microsoft's cap, not ours. | n/a |
| `overview-tenant-inventory.ts:37, 64` | `USERS_WINDOW_DAYS = 30` | DISTINCT-users count is "last 30 d active" by spec. | This is product behavior, not ingest. The data is all there — this filter is on the read side. | none |
| `evidence/snapshot.ts:223-235` | `gte(activityEvents.timestamp, twentyFourHoursAgo)` for "Throttling events 24h" | Read-side scoping for the throttling KPI. | Product behavior — leave. | none |
| `db/partner-portfolio.ts:124` | `gte(costObservations.timestamp, sql\`now() - interval '30 days'\`)` | Read-side 30 d CU sum for partner dashboard. | Product behavior. | none |
| `db/capacity-pulse.ts:131, 181` | `windowDays = 7` default in Capacity Pulse | Read-side. | Product behavior. | none |
| `db/cost-attribution.ts:133, 374` | `windowDays = 30` default in Cost Attribution | Read-side. | Product behavior. | none |
| `db/overview-cost-series.ts:137` | `windowDays = 30` default | Read-side. | Product behavior. | none |
| `evidence/artifact-cost.ts:231` | `${activityEvents.timestamp} >= ${cutoff}` (30 d for unique-users join) | Read-side. | Product behavior. | none |

**Conclusion:** the only **ingest-side** retention windows we control are `activity-events.ts` (24 h), `DAX_ITEMS_RECENT` (14 d), and `DAX_ITEM_METRICS_HOURLY` / `DAX_TIMEPOINTS_24H` (24 h). The 30-day filters in `db/*.ts` and `evidence/*.ts` are query-shape choices and don't drop data on the way in.

### 2.2 Retention DELETEs

Hard-DELETE queries that purge previously-persisted rows. These directly contradict the user's "abundant storage" stance.

| Site | What | Why | Blast radius if removed |
|---|---|---|---|
| `drift/evaluate.ts:255-270` | `DELETE FROM cron_run_snapshots WHERE customer_env_id = ? AND clerk_org_id = ? AND taken_at < now() - interval '60 days'` (run per cron tick, in parallel with the INSERT) | "Keeps ~60 rows per env at daily cadence" — drift detector only needs the most recent prior row. | **Trivial.** Each row is a JSONB blob with 6 numbers. 365 rows/yr × ~100 B = 36 KB/env/yr. Safe to remove. |
| `collect-workloads.ts:274-276` | `DELETE FROM workload_metrics WHERE customer_env_id = ? AND bucket_starts_at < NOW() - INTERVAL '31 days'` (every workload-collector run) | "Keeps the 30 d window bounded" — buckets that drop out of the DAX query's 30 d window would otherwise linger. | **High signal loss.** Removing this means we keep workload-mix history forever as the DAX query rolls forward — exactly what the user wants. Side-effect: stale rows can't be refreshed by upsert (they're now outside the source window), but that's a feature, not a bug. |
| `fuam.ts:215-223` | `DELETE FROM capacity_metrics WHERE capacity_id = ? AND clerk_org_id = ? AND timestamp >= twentyFourHoursAgo` (before re-insert) | Idempotent re-ingestion of the FUAM 24 h window. | FUAM is being removed in H4 — moot. |
| `fuam.ts:262-272` | `DELETE FROM cost_observations WHERE customer_env_id = ? AND clerk_org_id = ? AND timestamp >= twentyFourHoursAgo` | Same. | Same. |
| `introspection.ts:571-573` (delete-then-insert on per-model scan) | `DELETE FROM relationships / measures / tables WHERE semanticModelId = ? AND clerkOrgId = ?` | Semantic model is overwritten in full on every scan — children must be deleted before re-insert (FK violations otherwise). | This is **structural**, not retention. Don't remove. |
| `introspection.ts:284-295` (stale-model cleanup) | `DELETE FROM semantic_models WHERE customer_env_id = ? AND clerk_org_id = ? AND fabric_dataset_id NOT IN (...)` | Drop models Admin API no longer returns. | Currently destructive — a deleted model loses all child rows. A "soft delete" approach (tombstone) would preserve history. Out of scope here but worth flagging. |
| `metrics_dax_snapshots` 7d TTL | **Not implemented** — schema.ts line 794 comments "7-day retention via cron task (deferred to H1.2)" but no cron task exists. | n/a | n/a — already non-deleting. |

### 2.3 Top-N caps that silently drop rows

| Site | Cap | What's dropped | Recommended fix |
|---|---|---|---|
| `dax-queries.ts:37` (`DAX_PROBE_CAPACITIES`) | `TOPN(50, 'Capacities')` | > 50 Metrics-App-tracked capacities | Probe doesn't drive persistence — leave for now, but document that the `capacityCount` returned is `min(N, 50)`. |
| `fuam.ts:127` | `SELECT TOP 100 [CapacityId], [displayName] FROM capacities` | > 100 FUAM capacities | FUAM removal in H4 — moot. |
| `fuam.ts:185-192` | `SELECT TOP 5000 … FROM capacity_metrics_by_timepoint` | Beyond 5000 rows of FUAM TimePoint data | FUAM removal — moot. |
| `fuam.ts:241-246` | `SELECT TOP 5000 … FROM capacity_metrics_by_item_by_operation_by_day` | > 5000 daily item-operation rows | FUAM removal — moot. |
| `artifact-cost.ts:260` | `.limit(500)` on the per-artifact CU query | Tenants with > 500 active items per env see truncated cost attribution | Bump to e.g. 5000 or remove entirely — the query is already grouped, row count is bounded by `count(DISTINCT items)`. |
| `api.ts:238, 246` | `$top=5000` on `/admin/groups` and `/admin/datasets` | Tenants with > 5000 workspaces / datasets | Microsoft caps these endpoints at 5000 per page. We don't paginate today — **a real risk on enterprise tenants**. Switch to `continuationUri` pagination (same pattern as `/activityevents`). |
| `admin-refreshables.ts:36` | `MAX_PAGES = 50` (× `PAGE_SIZE=1000` = 50 k datasets) | > 50 k datasets / tenant | Bump to 500 or remove the safety cap entirely. |

### 2.4 Page-size / batch caps that prevent backfill

| Site | Cap | Notes |
|---|---|---|
| `activity-events.ts:5` | `BATCH_SIZE = 500` for upsert chunks | DB-side — keeps Drizzle batch INSERTs small. Not a retention issue. Postgres-js (post-Neon migration) can handle larger; bump to ~5000 for speed if desired. |
| `collect.ts:465` | `PERSIST_BATCH_SIZE = 500` for metrics-app upserts | Was a Neon HTTP cap; postgres-js doesn't have it. Bump-candidate. |
| `admin-refreshables.ts:46` | `PERSIST_BATCH_SIZE = 500` | Same. |
| `introspection.ts:148, 213` | `BATCH = 50` for workspace + model upserts | Conservative. Safe to bump. |
| `fuam.ts:23` | `BATCH_SIZE = 10` | Neon HTTP era — extremely conservative. FUAM removal moots it. |
| `collect-workloads.ts:32` | `CHUNK_SIZE = 500` | Same Neon-HTTP-era cap. |

### 2.5 Recent-only assumptions baked into upserts / reads

- `activity-events.ts:113-126` uses `onConflictDoNothing` on `(env, timestamp, operation, user_id, item_id)` natural-key — so a 30-day backfill is **safe to re-run** without duplicates. Atomic ingestion design (PR `activity-events-atomic-ingestion`).
- `dax-queries.ts:73` `DAX_ITEMS_RECENT` 14-day window is **the** assumption that prevents a "full tenant artifact census" — see §3.3.
- `dax-queries.ts:154, 220` 24-hour windows on item-metrics: the cron path is daily, so a sparse 24h-window approach has zero overlap protection — a missed cron run means **permanent data loss for that hour-range**, which is exactly the bug `activity-events-atomic-ingestion` solved. The item-metrics path doesn't have the same atomic protection because its window is non-overlapping by design.

---

## 3. Gap analysis — six axes the user wants to capture

For each axis: upstream API path → auth → required permission → proposed table → mid-size-tenant row estimate → unlocked insight.

### 3.1 All reports

**Upstream surfaces:**
1. `GET /v1.0/myorg/groups/{ws}/reports` (Power BI REST, **per-workspace**, SP-readable) — `id, name, webUrl, embedUrl, datasetId, reportType` (PowerBI / Paginated). Already wired in the fidelity audit at `validate-fidelity/endpoints.ts:196-204`.
2. `GET /v1.0/myorg/admin/reports?$top=5000` (Power BI Admin, **tenant-wide**, SP+Admin). Not in the codebase today but Microsoft documents it. Adds `users, subscriptions, createdBy, modifiedBy` fields beyond the user-facing endpoint.
3. **Scanner API** already returns reports nested under each workspace's response when `lineage=true` — we're throwing them away (`scanner-helpers.ts` only extracts `expressions` and `columnsByTable`).
4. `POST /v1/workspaces/{ws}/reports/{report}/getDefinition` LRO (Fabric REST) — returns the report's PBIR/JSON definition. Wired in fidelity audit at `endpoints-async.ts:328-336` but never persisted.
5. **Fabric Eventstreams / Dashboards / Real-Time Dashboards** are exposed through `GET /v1/workspaces/{ws}/eventstreams`, `/dashboards`, `/kqlDashboards` — and crucially **also appear in `item_metadata.itemKind`** when they incur CU on the Metrics App. So we *partially* have them already.

**Persistence today:** `item_metadata` already stores rows where `itemKind = 'Report' | 'Dashboard'` etc. for items active in the last 14 d. The tenant-inventory card uses this (`overview-tenant-inventory.ts:74-81`). **What's missing: a durable per-report table with name, owner, dataset link, last-modified, definition pointer.**

**Proposed table:**

```sql
fabric_reports (
  id uuid PRIMARY KEY,
  customer_env_id uuid REFERENCES customer_environments(id) ON DELETE CASCADE,
  clerk_org_id text NOT NULL,
  workspace_id uuid REFERENCES workspaces(id),
  fabric_report_id text NOT NULL,
  semantic_model_id uuid REFERENCES semantic_models(id),  -- via report.datasetId
  name text NOT NULL,
  report_type text,                          -- PowerBI | PaginatedReport | etc.
  web_url text,
  created_by text,
  modified_by text,
  modified_at timestamp,
  is_owned_by_me boolean,
  has_definition_pointer boolean default false,  -- truthy when we've persisted PBIR via getDefinition
  ...timestamps,
  UNIQUE (customer_env_id, fabric_report_id)
);
```

A sibling `fabric_report_definitions` (JSONB / TOAST) can hold the actual PBIR for code-search across reports — value to Impact Analyst agent.

**Mid-size tenant estimate:** ~500–5000 reports. SBM has ~1100 datasets, so ~3× reports → ~3300.

**Insight unlock:**
- "Orphaned report" recommendation (report references a deleted/stale dataset).
- "Report has N viewers but no scheduled refresh on its dataset" — pairs with `refreshables`.
- Report-level cost attribution (report ↔ dataset ↔ capacity ↔ €).
- Cross-report measure usage (which reports reference measure X) — needed for Impact Analyst agent.

### 3.2 All dataflows (Gen1 + Gen2)

**Upstream surfaces:**
1. `GET /v1.0/myorg/groups/{ws}/dataflows` (Power BI REST, per-workspace).
2. `GET /v1.0/myorg/admin/dataflows?$top=5000` (tenant-wide).
3. `GET /v1/workspaces/{ws}/dataflows` (Fabric REST — covers Gen2).
4. Scanner also returns dataflows when `lineage=true` (currently discarded).
5. `item_metadata.itemKind = 'Dataflow'` already gives us active-dataflow CU (used by `overview-tenant-inventory.ts:83-91`).

**Proposed table:**

```sql
fabric_dataflows (
  id uuid PRIMARY KEY,
  customer_env_id uuid REFERENCES customer_environments(id) ON DELETE CASCADE,
  clerk_org_id text NOT NULL,
  workspace_id uuid REFERENCES workspaces(id),
  fabric_dataflow_id text NOT NULL,
  generation text,                  -- 'gen1' | 'gen2'
  name text NOT NULL,
  description text,
  configured_by text,
  modified_at timestamp,
  ...timestamps,
  UNIQUE (customer_env_id, fabric_dataflow_id)
);
```

`refreshables` already covers refresh-quality for dataflows because Microsoft includes both datasets and dataflows in `/admin/capacities/refreshables` — so refresh history comes for free once the dataflow inventory is persisted.

**Mid-size tenant estimate:** 50–500 dataflows.

**Insight unlock:** "Dataflow refresh failure rate > 20 %", "Dataflow takes > N h but downstream dataset doesn't depend on it", lineage health.

### 3.3 All Fabric artifacts (the full workloadType catalog)

The Metrics App's `Items` table is already tenant-comprehensive — see `item_metadata.itemKind`. Known item-kinds (from `cost-attribution.ts` + adapter contract): `Report, Dashboard, Dataset, Dataflow, Lakehouse, Warehouse, Notebook, Pipeline, KQLDatabase, KQLQueryset, MLModel, MLExperiment, Eventstream, Environment, SparkJobDefinition, Reflex (Activator)`.

**The blocker today is `dax-queries.ts:73` — `[Timestamp] >= UTCNOW() - 14` drops anything idle > 14 d.** That's the §2.1 finding — removing the FILTER instantly gives us the full census.

**Upstream alternatives** that would give us the tenant-wide census *without* depending on Metrics App at all:
- `GET /v1/workspaces/{ws}/items` (Fabric REST, per-workspace) — `id, displayName, type, description, workspaceId`.
- Scanner API `lineage=true` (we already poll it for semantic models — same response is item-typed for the entire workspace; we're filtering it down to just the dataset slot in `scanner-helpers.ts`).

**Proposed table:**

```sql
fabric_items (
  id uuid PRIMARY KEY,
  customer_env_id uuid REFERENCES customer_environments(id) ON DELETE CASCADE,
  clerk_org_id text NOT NULL,
  workspace_id uuid REFERENCES workspaces(id),
  fabric_item_id text NOT NULL,
  item_type text NOT NULL,            -- Lakehouse | Warehouse | Notebook | KQLDatabase | …
  display_name text NOT NULL,
  description text,
  configured_by text,
  created_at_source timestamp,        -- Fabric's createdDate
  modified_at_source timestamp,
  ...timestamps,
  UNIQUE (customer_env_id, fabric_item_id)
);
```

**Mid-size tenant estimate:** 1k–20k items.

**Insight unlock:**
- Lakehouse/Warehouse storage attribution (combined with H3 throttling-storage PRD).
- "Notebook ran successfully but its output Lakehouse hasn't been read in 90 d" — sleeper waste pattern.
- Per-workload-type adoption velocity for FinOps reporting.
- **Cross-workload lineage** — a Notebook writes to a Lakehouse that feeds a Warehouse that backs a Semantic Model that's behind a Report — Scanner returns enough fragments to reconstruct this.

### 3.4 All users

**Two upstream paths:**

1. **Power BI Admin `/activityevents`** — already populated, UPN is verbatim in `activity_events.user_id`. **This already gives us full active-user inventory.** See PRD `users-page-pillar.md`: UPN-first v1 ships without Graph.

2. **Microsoft Graph** for license + Entra metadata:
   - `GET https://graph.microsoft.com/v1.0/subscribedSkus` (`Organization.Read.All`) — tenant seat counts (Pro / PPU / Fabric / Standard).
   - `GET /v1.0/users?$select=id,userPrincipalName,displayName,department,jobTitle,accountEnabled` (`User.Read.All`) — Entra inventory.
   - `GET /v1.0/users/{id}/licenseDetails` (`User.Read.All` + `Organization.Read.All`) — per-user license assignment.
   - `GET /v1.0/users/{id}/authentication/methods` (`UserAuthenticationMethod.Read.All`) — MFA registration.

   **Auth:** Graph delegated *or* application — Microsoft Graph PRD (`docs/prd/microsoft-graph-integration.md`) extends the SP with Graph permissions. Already specced as Phase A.

**Proposed tables (already in the Graph PRD):**

```sql
license_inventory (id, customer_env_id, clerk_org_id, sku_part_number, sku_id, total_units, consumed_units, monthly_cost_usd, collected_at, ...);
microsoft_license_pricing (sku_part_number PK, display_name, list_price_usd_per_month, family, effective_date, notes);
entra_users (id, customer_env_id, clerk_org_id, entra_user_id, upn, display_name, department, job_title, account_enabled, mfa_registered, last_seen_via_graph, ...);
```

**Mid-size tenant estimate:** 100–10 000 users; 5–20 SKUs.

**Insight unlock:** sleeper-license detection ("Pro license held, zero activity in 30 d → reclaim €10/mo × N"), real per-user cost (`CU € + license €`), department-level rollups, MFA-coverage compliance row in the Governance pillar.

### 3.5 All security groups

**Upstream surfaces:**
1. `GET /v1.0/myorg/admin/groups/{ws}/users` — per-workspace **users + groups**, returns `displayName, emailAddress, identifier, groupUserAccessRight (Admin/Member/Contributor/Viewer), principalType (User/Group/App)`. Wired in `validate-governance/index.ts:539` but not persisted.
2. `GET /v1.0/admin/tenantsettings` (Fabric host) — returns each setting's `enabledSecurityGroups[]` / `excludedSecurityGroups[]` arrays (we read this in `validate-governance` for `is_critical_for_layerpulse` filtering, but the security-group references themselves are also discarded).
3. **Microsoft Graph** `GET /v1.0/groups` and `/v1.0/groups/{id}/members` — full AAD group inventory with names + member counts.
4. Scanner API `getArtifactUsers=true` (currently turned OFF in `api.ts:526`) — returns per-artifact ACLs including security groups.

**Proposed tables:**

```sql
aad_security_groups (id, customer_env_id, clerk_org_id, aad_group_id, display_name, description, member_count, …);
workspace_role_assignments (id, customer_env_id, clerk_org_id, workspace_id, principal_id, principal_type, role, last_seen_at, …);
tenant_setting_security_groups (id, customer_env_id, clerk_org_id, setting_name, kind, aad_group_id, …);  -- kind: 'enabled' | 'excluded'
```

**Mid-size tenant estimate:** 50–500 AAD groups, 100–5000 workspace-role assignments, 200–2000 tenant-setting × group rows.

**Insight unlock:** "Group X has Admin on workspace Y but hasn't been audited in 365 d" → SOC 2 row. "Tenant setting `AdminApisIncludeExpressions` excludes group Z which contains 15 service accounts" → orphaned-permission detection. **Closes the data side of the Governance pillar PRD's accept-as-risk workflow.**

### 3.6 All apps

**Upstream surfaces:**
1. `GET /v1.0/myorg/admin/apps?$top=5000` (Power BI Admin) — published apps; returns `id, displayName, workspaceId, lastUpdate, users`.
2. `GET /v1/workspaces/{ws}/apps` (newer Fabric REST equivalent for Fabric Apps).
3. `item_metadata.itemKind = 'App'` if the customer has installed apps consuming CU.

**Proposed table:**

```sql
fabric_apps (
  id uuid PRIMARY KEY,
  customer_env_id uuid REFERENCES customer_environments(id) ON DELETE CASCADE,
  clerk_org_id text NOT NULL,
  fabric_app_id text NOT NULL,
  workspace_id uuid REFERENCES workspaces(id),  -- the source workspace
  display_name text NOT NULL,
  last_update timestamp,
  audience_count integer,
  ...timestamps,
  UNIQUE (customer_env_id, fabric_app_id)
);

app_audience_assignments (
  id uuid PRIMARY KEY,
  app_id uuid REFERENCES fabric_apps(id) ON DELETE CASCADE,
  audience_name text,
  principal_id text,
  principal_type text,
  access_right text
);
```

**Mid-size tenant estimate:** 10–200 apps, 100–10 000 audience assignments.

**Insight unlock:** "App points at workspace whose semantic model has bronze fidelity", "App has 0 viewers in 30 d", consumption-side adoption metrics (apps are how end-users actually consume — semantic-model quality means nothing if the app behind it is broken).

---

## 4. Value-proposition synthesis

Microsoft's first-party tools — the **Fabric Admin portal**, the **Capacity Metrics App**, **Purview**, the **Workspace settings page** — each surface a slice of tenant telemetry. None of them join those slices. **FUAM**, the open-source kit LayerPulse originally rode on, persists the Metrics App but ignores semantic-model quality. **Third-party FinOps** (Stratus AI, Power BI Sentinel, FabricEye) wrap the same Metrics App and add cost dashboards, but they don't reach into TMDL, don't talk to AAD groups, and don't run rule-based governance audits. Pure data-quality tools (Tabular Editor, Best Practice Analyzer) inspect the model in isolation, with no idea what it costs to run or who actually consumes it.

LayerPulse is one short refactor away from being the only tool that joins **all of it** in one Postgres schema, queryable in one place: capacity € (`capacity_pricing` + `fabric_sku_pricing`) × per-item CU (`item_metrics_hourly`) × who used it (`activity_events.user_id`, full UPN) × what license that user holds (proposed `license_inventory` + `entra_users`) × what the report actually does (`measures.expression` + proposed `fabric_report_definitions` PBIR) × who has access to the workspace it lives in (proposed `workspace_role_assignments` × `aad_security_groups`) × what tenant setting governs all of the above (proposed `tenant_settings` + the existing critical-flag list in `validate-governance/index.ts:186-210`). The four already-shipped axes (cost · semantic model · activity · tenant flags via the validate-governance script) plus the six gap axes (reports · dataflows · all-Fabric-items · users · security groups · apps) form a **closed graph** — six edges I can already prove from today's data, and nine more that drop out once the proposed tables exist.

Concretely, today we can already answer "which dataset costs most" (`cost-attribution.ts` → `item_metrics_hourly` × `capacity_pricing`), "is my semantic model bronze or gold fidelity" (`fidelityLevel` on `customer_environments`), and "are my refresh runs healthy" (`refreshables`). What we **cannot** answer today, even with the data we already store: "who paid for this report's most expensive measure, was their license sized appropriately, and was the report covered by an SoC-2-compliant access policy?" — that's the four-axis question only LayerPulse can answer once items, users, groups, and tenant settings are joined to the cost graph already in `item_metrics_hourly`. The Impact Analyst agent (Milestone D) becomes feasible the moment `fabric_reports` exists — Cost-Aware Query Advisor needs `entra_users` + `license_inventory` to suggest "this Pro user could downgrade to free if you move them off real-time dashboards." Neither agent works against Microsoft's siloed tools because the join doesn't exist there. **The moat is the schema, not any individual surface.**

---

## 5. Final tally

- **APIs called today (production cron path + per-model scan):** 16 (Power BI REST: 4 · Power BI Admin REST: 6 · Fabric REST: 2 · Metrics App DAX: 7 (5 cron + 2 schema-only) · FUAM SQL: 3, counted as 1 source since SQL not REST). Headline: **9 distinct REST endpoints + 6 DAX queries = 15 unique upstream queries** running daily.
- **Tables in `schema.ts`:** **33** (including 1 dormant: `refresh_events`; 1 unimplemented-TTL: `metrics_dax_snapshots`).
- **Retention findings (§2 total):** **24** — broken down as 13 ingest-side windows, 7 retention DELETEs (3 in deprecated FUAM, 1 in active drift cleanup, 1 in active workload cleanup, 1 unimplemented), 7 top-N caps, 5 batch caps, plus 1 "no recent-overlap protection" architectural risk. Removing the ingest windows + the two retention DELETEs (drift + workload) gives the user the "keep everything" posture they asked for.
- **Proposed new tables (§3 total):** **9** — `fabric_reports`, `fabric_report_definitions`, `fabric_dataflows`, `fabric_items` (or relax the 14-d FILTER on `item_metadata` and rename for clarity), `license_inventory`, `microsoft_license_pricing`, `entra_users`, `aad_security_groups`, `workspace_role_assignments`, `tenant_setting_security_groups`, `fabric_apps`, `app_audience_assignments` — strictly 12 if every sub-table is counted, **9 logical entities**.

---

**Survey complete. Total APIs found: 15. Total tables found: 33. Total retention findings: 24. Total proposed new tables: 9 (12 if sub-tables counted separately).**
