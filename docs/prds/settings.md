# PRD — Settings (Connection · Ingestion · Pricing)

| | |
|---|---|
| **Status** | Draft · ready for operator review |
| **Author** | LayerPulse Mockup Designer (this codebase) |
| **Target release** | Q3 2026 (foundational admin surface; already partially shipped in LP, this PRD covers the V2 audited cron + dot-grid + Pricing inputs) |
| **Pillar** | Cross-cutting platform (Governance + FinOps + Cron ops) |
| **Persona** | Direct-customer admin + partner-of-record operator |
| **Mockup source** | `docs/screens/settings.md` · live at `/settings` |
| **Real-product surface** | `app.layerpulse.com/(customer)/[customerId]/settings` (existing route) |
| **Depends on** | SP encryption (`fabric/encryption.ts`) · cron route (`/api/cron/collect`) · `capacity_pricing` + `license_inventory` tables |
| **Blocks** | Cron failure visibility (Ingestion tab) · share-of-bill math (Pricing inputs) · environment delete (Danger zone) |

---

## 1. Problem

Three different admin jobs ("connect the tenant", "operate the cron", "enter the prices that power cost math") share one user (an admin) and live awkwardly in three different places in many products. LP keeps them on one page split by tab. The cron tab also needs to be **honest and current** — the underlying collector code evolves (Reports & Apps shipped in 2026-05), and the mockup must match the truth.

## 2. Goals · non-goals

### Goals (V2 — this PRD)
- **G1.** Three tabs: **Connection** (SP + Metrics App + Danger zone), **Ingestion** (sync toggle + schedule + per-arm health), **Pricing** (capacity + license €).
- **G2.** **Cron arms accurately reflect LP code** — six active arms (`Activity events · Metrics App DAX · Refreshables · Tenant settings · Reports & Apps · Model introspection`); audit on every Settings change.
- **G3.** **30-run completion + per-arm completion** with circular dots (green / amber / red / pending grey); legend + exact-cell tooltips.
- **G4.** Pricing inputs are the **truth-of-record** for share-of-bill math elsewhere (Capacity Pulse, Cost Attribution, Workload Mix, Documents cost section).
- **G5.** Danger zone (delete environment) is a two-step destructive op, never auto-triggered.

### Non-goals
- **NG1.** "Planned axes" roadmap on this page — that's BACKLOG.md's job. Removed (2026-05-26).
- **NG2.** Subscription/billing for the LP product itself — lives at `/billing`, linked from Settings sub-copy.
- **NG3.** RBAC / user management — orthogonal page (or `/team` on the partner side).
- **NG4.** Schema management for the inventory tables.

## 3. Users · jobs-to-be-done

| Persona | Job |
|---|---|
| **New-customer admin** | "Connect our tenant and start collecting." → Connection tab → SP form → Test → save. |
| **Existing-customer admin** | "Why didn't our nightly run finish?" → Ingestion tab → per-arm grid (find the red dots). |
| **Finance/FinOps** | "Get the math right — our capacity is $5,000/mo, our licenses are €10 + €57." → Pricing tab. |
| **Partner ops** | "Spin up a customer env." → Connection tab end-to-end. |

## 4. 5-gate scorecard

| Gate | Answer |
|---|---|
| **G1 · Pillar** | Cross-cutting platform — the configuration that *enables* every other surface |
| **G2 · JOIN** | Settings *feeds* the joins: SP creds × cron arms × capacity_pricing × license_inventory |
| **G3 · Persona** | Admin's primary daily-ish surface for "is the data we're showing trustworthy and complete?" |
| **G4 · Differentiator** | Honest cron-arm health visibility against the customer's real Fabric ingest pipeline + customer-entered prices that make cost math truthful |
| **G5 · Decision** | "Are we connected? Are we collecting? Is the cost math right?" — answered in one tab each |

## 5. Information architecture

```
/settings  (single page, 3 tabs)

├── [Connection]
│   ├── Connection-status hero (capacities · workspaces · models · reports · last sync · fidelity)
│   ├── Service principal (tenant + client + secret)
│   ├── Capacity Metrics App (workspace id + dataset id + how-to disclosure)
│   └── Danger zone (delete environment — destructive, confirm-required)
│
├── [Ingestion]
│   ├── Sync toggle · Schedule (Daily / Weekly-DOW / Custom cron) · Timezone
│   ├── 30-run overall completion (dot grid · % completion · ok/partial/failed counts)
│   ├── Per-arm health (6 arms × 30 runs · completion %) — each arm with dot grid + meta
│   └── Last sync + Sync now
│
└── [Pricing]
    ├── Capacity pricing (per capacity: SKU · region · €/mo · effective date)
    └── License pricing (per Microsoft plan: Free / Pro / PPU / M365 E5 / SP)
```

## 6. Functional requirements

### 6.1 Connection
- **FR-CN-1** Connection-status hero: live counters (capacities · workspaces · models · reports) + last-sync relative time + fidelity badge.
- **FR-CN-2** SP credentials form (tenant ID · client ID · client secret); secret is `type="password"`; "Test connection" verifies before Save.
- **FR-CN-3** Capacity Metrics App form (workspace ID · dataset ID) + collapsible "how to find these IDs" walkthrough.
- **FR-CN-4** Danger zone: delete-environment with a two-step (export-first nudge → confirm). Never auto-trigger.

### 6.2 Ingestion (cron control)
- **FR-IN-1** Sync toggle (pauses without removing credentials).
- **FR-IN-2** Schedule selector: Daily / Weekly-{Mon..Sun} / Custom cron (POSIX 5-field input with hint).
- **FR-IN-3** Timezone selector (grouped by region; affects off-hours bucketing + audit timestamps in local view; auditor surfaces still render UTC).
- **FR-IN-4** 30-run overall completion: **circular dots** colored by outcome (green ok / amber partial / red fail / grey pending); show % completion + ok/partial/fail counts.
- **FR-IN-5** Per-arm health table (6 rows × 30 dots each): arm name (with status dot), 30-run dot grid, completion %, meta line describing the API call / pathway.
- **FR-IN-6** "Sync now" button — on-demand trigger.
- **FR-IN-7** Cron arms list must match the LP code source of truth (`src/app/api/cron/collect/route.ts`). Audit each release.

### 6.3 Pricing (€ truth-of-record)
- **FR-PR-1** Capacity pricing table: row per capacity (name · SKU · region · €/mo · effective date · currency).
- **FR-PR-2** License pricing table: row per Microsoft plan (Free / Pro / PPU / M365 E5 / SP) — €/user/mo + user count + note.
- **FR-PR-3** Missing capacity price renders a rose row + "Add price" CTA; falls back to F-SKU list elsewhere with a footnote.
- **FR-PR-4** Effective-date tracking: history-aware (revisions). The current row is the truth; older rows feed historical cost math.

### 6.4 Cron arms — canonical list (source of truth)

| # | Arm | Code path | API / pathway |
|---|---|---|---|
| 1 | Activity events | `collectActivityEvents` | `/admin/activityevents` · 24×1h windows · 30d retention |
| 2 | Capacity Metrics App (DAX) | `collectMetricsAppData` | Direct DAX · `capacity_snapshots` / `time_points` / `item_metrics_hourly` |
| 3 | Refreshables | `collectAdminRefreshables` | `/admin/capacities/refreshables` · per-dataset refresh history |
| 4 | Tenant settings | `collectTenantSettings` | `/v1/admin/tenantsettings` · latest-wins snapshots |
| 5 | Reports & Apps | `collectReportsApps` | `/admin/groups/{ws}/reports` + `/admin/apps` · sticky-cursor fan-out |
| 6 | Model introspection | `introspectCustomerModels` | Scanner `getInfo` + `getDefinition` · TMDL · **prerequisite** (runs before the `allSettled` batch) |

FUAM is deprecated and only runs when `env.fuamEndpoint` is set; not shown by default.

## 7. States · edge cases

| State | Trigger | UI |
|---|---|---|
| Not connected | no SP saved | Connection hero ✗; other tabs warn "Connect first" |
| Failed runs | arm rejected in last 30 | header badge `N failed runs` (rose); per-arm grid shows the red dots |
| Partial runs | some arms ok, some pending | header badge `N partial runs` (amber) |
| Schedule custom | dropdown = "Custom" | cron input + 5-field hint reveal |
| Missing price | capacity row no € | rose row + "Add price" CTA; downstream falls back to list price |
| Delete env | Danger zone | two-step (export-first nudge → confirm); never auto |

## 8. Telemetry

| Event | Properties |
|---|---|
| `settings.tab_switched` | tab |
| `settings.sp_saved` | env_id |
| `settings.test_connection` | env_id, outcome |
| `settings.sync_toggled` | env_id, on |
| `settings.schedule_changed` | env_id, schedule |
| `settings.sync_now` | env_id |
| `settings.price_added` | kind (capacity\|license), sku |
| `settings.env_deleted` | env_id |

## 9. Rollout

This PRD primarily formalizes a V2 audit + UX polish on an existing shipped surface. No flag needed; the changes ship as part of the normal release cadence. Production verification: cron-arm list matches `collect/route.ts` on every PR that changes either.

## 10. Open questions

- **OQ-1** ✅ Dot visualization confirmed (operator 2026-05-26).
- **OQ-2** ✅ Planned-axes card removed (operator 2026-05-26).
- **OQ-3** ✅ Cron arms audited against LP code (operator 2026-05-26) — Reports & Apps added.
- **OQ-4** Should the Ingestion tab surface a **"Reconnect SP"** button when an arm fails with auth (vs only credentials in Connection)? Lean: yes, contextual deep-link.
- **OQ-5** Pricing history-aware revisions — UI for editing past entries? Lean: append-only with effective-from; no past-row editing.

## 11. Acceptance checklist for `/build-feature`

- [ ] Cron-arm list matches `/api/cron/collect/route.ts` at PR time
- [ ] Dot visualization (overall + per-arm) verified at 1440px
- [ ] Pricing forms write to `capacity_pricing` / `license_inventory` with effective-date
- [ ] Danger zone deletion has the two-step + audit-log entry
- [ ] OQ-4 / OQ-5 answered
- [ ] PRD tagged `v2.0`, linked from `/build-feature` issue

---

**Mockup reference:** `https://layerpulze-mockup.vercel.app/settings`
**Screen narrative:** `docs/screens/settings.md` · **PO review:** `public/review/settings.html`
