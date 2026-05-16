---
title: "Screen Map & Navigation Flows"
aliases: [screen map, navigation, user flows, wireframes]
---

# LayerPulze.ai — Complete Screen Map

Master reference for all screens, navigation flows, and click paths.
Every feature must fit into this map before implementation.
Merges FabricPulse (FinOps) + pbidoc.ai (Semantic Model Quality) into one product.

## Legend

```
[LIVE]    = Deployed to production
[BUILD]   = In progress (Phase 2 worktrees)
[PLAN]    = Planned (B.5 / C1 / C2)
[FUTURE]  = Milestone D / v2
─────     = Navigation link (sidebar, breadcrumb)
──→       = Click action (button, card, row)
◆         = Sidebar item
[tab]     = Horizontal tab (model-level)
```

---

## 1. Two-Level Navigation Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  LEVEL 1: SIDEBAR (environment-level)                          │
│  Shows aggregated/cross-model data for the customer environment│
│                                                                 │
│  ◆ Overview         → Health score, top issues, money page     │
│  ◆ Workspaces       → Browse workspaces, scan models      ────┐│
│  ◆ Documents        → All generated docs across models         ││
│  ◆ Capacity         → Utilization timeline (all capacities)    ││
│  ◆ Cost & Usage     → CU breakdown (all items)                 ││
│  ◆ Governance       → Tenant compliance rules                  ││
│  ◆ Activity         → Audit log (scans, docs, analyses)       ││
│  ◆ Alerts           → Threshold alerts                         ││
│  ◆ Settings         → SP credentials, FUAM, billing            ││
│                                                                 ││
└─────────────────────────────────────────────────────────────────┘│
                                                                   │
  Click into a model from Workspaces ─────────────────────────────┘
                                                                   
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  LEVEL 2: HORIZONTAL TABS (model-level)                        │
│  Deep-dive into a single scanned semantic model                │
│                                                                 │
│  Breadcrumb: Workspaces > Sales [PROD] > Sales Model           │
│                                                                 │
│  [Overview] [Measures] [Lineage] [Diagram]                     │
│  [Documentation] [AI Analysis] [Health] [Reports]              │
│                                                                 │
│  These tabs ONLY appear after drilling into a specific model   │
│  from the Workspaces grid. They are per-model screens.         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Entry Points

```
                    ┌──────────────┐
                    │  layerpulze  │
                    │    .ai       │
                    │  (landing)   │  [PLAN C2]
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Clerk Auth  │  [LIVE]
                    │  /sign-in    │
                    │  /sign-up    │
                    └──────┬───────┘
                           │
                    ┌──────▼────────┐
                    │ /post-sign-in │  [LIVE]
                    │ (role router) │
                    └──────┬────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
      ┌───────▼──┐  ┌──────▼───┐  ┌────▼─────┐
      │ Partner  │  │ Customer │  │  Admin   │
      │ Role     │  │ Role     │  │  Role    │
      │/(partner)│  │/(customer)│  │/(admin)  │  [FUTURE]
      └───────┬──┘  │ /self/   │  └──────────┘
              │     └──────┬───┘
              │            │
              ▼            ▼
        PARTNER FLOW    CUSTOMER FLOW
        (Section 3)     (Section 4, same screens)
```

---

## 3. Partner Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ ◆ PARTNER DASHBOARD                        /(partner)/dashboard │
│                                                          [LIVE] │
│ ┌──────────────────────────────────────────────────────┐       │
│ │ Portfolio Overview                                    │       │
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐              │       │
│ │ │Customers │ │Avg Health│ │ Total CU │              │       │
│ │ │    3     │ │   74     │ │  12,400  │              │       │
│ │ └──────────┘ └──────────┘ └──────────┘              │       │
│ │                                                      │       │
│ │ ┌────────────┐ ┌────────────┐ ┌────────────┐       │       │
│ │ │ SBM        │ │ Contoso    │ │ + Add New  │       │       │
│ │ │ Score: 87  │ │ Score: 62  │ │            │       │       │
│ │ │ 612 models │ │ 45 models  │ │            │       │       │
│ │ │ [Open →] ──┼─┼────────────┼─┼──→ Customer Flow   │       │
│ │ └────────────┘ └────────────┘ └────────────┘       │       │
│ └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ◆ CUSTOMERS                             /(partner)/customers    │
│ ◆ ACTIVITY                              /(partner)/activity     │
│ ◆ CONNECTIONS                           /(partner)/connections  │
│ ◆ SETTINGS                              /(partner)/settings     │
│                                                    All [LIVE]   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Customer Flow — Sidebar (Environment Level)

### 4.1 Overview (Money Page)

```
┌─────────────────────────────────────────────────────────────────┐
│ ◆ OVERVIEW                        /(customer)/[id]       [LIVE]│
│                                                                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │ HEALTH   │ │   COST   │ │ CAPACITY │ │   DOCS   │          │
│ │   87     │ │  €2.4k   │ │   72%    │ │   34%    │          │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│ ┌───────────────── TOP ISSUES ─────────────────────┐           │
│ │ ⚠ COST-001  Top item consumes >40% CU    [→]   │           │
│ │ ⚠ QUAL-001  12 orphaned measures          [→] ──┼──→ 4.8   │
│ │ ⚠ CAP-001   Utilization >85% (peak)      [→]   │  DRILL   │
│ │ ● DOC-001   <50% measures documented      [→]   │  DOWN    │
│ └──────────────────────────────────────────────────┘           │
│                                                                 │
│ ┌─── PROVENANCE ───┐                                           │
│ │ ● Silver fidelity │                                          │
│ └───────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Workspaces (pbidoc.ai pattern)

```
┌─────────────────────────────────────────────────────────────────┐
│ ◆ WORKSPACES              /(customer)/[id]/workspaces    [PLAN]│
│                                                        (B.5)   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │ WKSPACES │ │  MODELS  │ │  TABLES  │ │ MEASURES │          │
│ │   493    │ │   216    │ │   496    │ │   976    │          │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│ [Search...] [All 493] [DEV 161] [UAT 159] [PROD 173] [★]     │
│                                                                 │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐                  │
│ │ Sales      │ │ HR Data    │ │ Finance    │                  │
│ │ [PROD] ★   │ │ [DEV]      │ │ [PROD] ★   │                  │
│ │ 3 models   │ │ 1 model    │ │ 8 models   │                  │
│ │ 42 tables  │ │ Scan now   │ │ 120 meas.  │                  │
│ │ [Open →] ──┼─┼──→ 4.3     │ │            │                  │
│ └────────────┘ └────────────┘ └────────────┘                  │
│                                                                 │
│ [Sync workspaces ↻]                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Workspace Detail → Model List

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Workspaces                                           │
│ WORKSPACE: Sales [PROD]                                  [PLAN]│
│          /(customer)/[id]/workspaces/[wsId]              (B.5) │
│                                                                 │
│ ┌──────────────────────────────────────────────────────┐       │
│ │ Model Name        │ Tables │ Measures │ Scanned │    │       │
│ │───────────────────│────────│──────────│─────────│────│       │
│ │ Sales Analytics   │   12   │    42    │  3d ago │Open│──→ 5  │
│ │ Budget Planning   │    8   │    15    │    —    │Scan│       │
│ │ KPI Dashboard     │    4   │    28    │  1d ago │Open│──→ 5  │
│ └──────────────────────────────────────────────────────┘       │
│                                              │                  │
│                          "Scan" triggers POST /api/fabric/     │
│                          introspect/[modelId]/sync             │
│                          (getDefinition → TMDL → DAX)         │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 Documents Hub (cross-model)

```
┌─────────────────────────────────────────────────────────────────┐
│ ◆ DOCUMENTS              /(customer)/[id]/documents      [PLAN]│
│                                                        (C2)    │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │DOCUMENTED│ │  TOTAL   │ │ OUTDATED │ │ STORAGE  │          │
│ │ MODELS   │ │   DOCS   │ │  MODELS  │ │  USED    │          │
│ │   13     │ │    52    │ │    0     │ │  2.3 MB  │          │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│ [Search...] [All workspaces ▼] [All statuses ▼] [Most recent] │
│                                                                 │
│ ┌──────────────────────────────────────────────────────┐       │
│ │ RetailOperations    ● Current  13t 47m  11 docs  [↻]│       │
│ │ Management of Change ● Current 46t 30m   9 docs  [↻]│       │
│ │ Operations Scorecard ● Current 74t 579m  6 docs  [↻]│       │
│ └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### 4.5 FinOps: Capacity & Costs

```
┌─────────────────────────────────────────────────────────────────┐
│ ◆ CAPACITY               /(customer)/[id]/capacity       [LIVE]│
│                                                                 │
│ [Select Capacity ▼]  [24h] [7d] [30d]                         │
│                                                                 │
│ ┌──────────────────────────────────────────────────────┐       │
│ │  100% ┌── 85% threshold ─────────────────────        │       │
│ │       │    ╱╲    ╱╲                                  │       │
│ │   50% │   ╱  ╲  ╱  ╲    ← utilization area chart    │       │
│ │       │  ╱    ╲╱    ╲                                │       │
│ │       └──────────────────────── time                  │       │
│ └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ◆ COST & USAGE           /(customer)/[id]/costs          [LIVE]│
│                                                                 │
│ ┌───── Top CU Consumers (bar chart) ──────────────┐           │
│ │ ████████████████████ Sales Refresh      42%      │           │
│ │ ██████████████      Budget Calc         28%      │           │
│ │ ████████            KPI Refresh         16%      │           │
│ └──────────────────────────────────────────────────┘           │
│                                                                 │
│ ┌───── 30-Day Observations (paginated table) ─────┐           │
│ │ Date  │ Item        │ Operation │ CU            │           │
│ │ Apr 7 │ Sales Model │ Refresh   │ 1,240         │           │
│ └──────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

### 4.6 Intelligence: Governance, Activity, Alerts

```
┌─────────────────────────────────────────────────────────────────┐
│ ◆ GOVERNANCE            /(customer)/[id]/governance   [FUTURE]│
│                                                                │
│ ┌──────────┐                                                   │
│ │ SCORE 48 │  6 of 25 rules compliant · 160 settings          │
│ └──────────┘                                                   │
│                                                                 │
│ Findings (13 issues)  [All] [Critical 3] [Warning 6] [Info 4] │
│                                                                 │
│ ● Guest access scoped to groups     [CRITICAL] External Sharing│
│ ● External sharing scoped           [CRITICAL] External Sharing│
│ ● Resource key auth blocked         [CRITICAL] Security        │
│ △ R/Python visuals disabled         [WARNING]  Content         │
│ △ Web content tiles disabled        [WARNING]  Content         │
│ ○ Sensitivity labels enabled        [INFO]     Info Protection │
│                                                                 │
│ All Settings (160 in 34 categories)  [Expand all] [Collapse]  │
│ ▸ Additional workloads                         2/5 enabled     │
│ ▸ Admin API settings                           4/6 enabled     │
│ ▸ Microsoft Fabric                             6/14 enabled    │
│ ...                                                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ◆ ACTIVITY              /(customer)/[id]/activity        [PLAN]│
│                                                        (C1)    │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │ SCANS    │ │   DOCS   │ │    AI    │ │ RESOLVED │          │
│ │ THIS WK  │ │GENERATED │ │ ANALYSES │ │          │          │
│ │    1     │ │    0     │ │    0     │ │    0     │          │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│ [All 20] [● Scans] [● Documents] [● AI] [● Resolved]         │
│                                                                 │
│ MAR 3, 2026                                               1    │
│ │ ↻ Michiel Re-scanned RetailOperations   6d ago 9.2/10  │    │
│ MAR 2, 2026                                               6    │
│ │ ↻ Michiel Re-scanned RetailOperations   9.2/10 6 chg   │    │
│ │ ↻ Michiel Re-scanned Management of Chg  3.0/10         │    │
│ │ ↻ Michiel Re-scanned Mooring Dashboard  4.0/10 1 chg   │    │
│ [Load more]                                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ◆ ALERTS                 /(customer)/[id]/alerts         [LIVE]│
│                                                    placeholder  │
│                                                                 │
│ ┌──────────────────────────────────────────────────────┐       │
│ │ Alert               │ Threshold │ Status  │ Action  │       │
│ │ Capacity >85%       │   85%     │ ● On    │ Edit    │       │
│ │ Throttling detected │   any     │ ● On    │ Edit    │       │
│ └──────────────────────────────────────────────────────┘       │
│                                                                 │
│ Recent Events                                                   │
│ │ Apr 07 14:30 │ Capacity >85% │ Cap-West │ ⚠               │
└─────────────────────────────────────────────────────────────────┘
```

### 4.7 Settings

```
┌─────────────────────────────────────────────────────────────────┐
│ ◆ SETTINGS               /(customer)/[id]/settings       [LIVE]│
│                                                                 │
│ ┌───── Service Principal ──────────────────────────┐           │
│ │ Client ID:     [••••••••••••••••]                │           │
│ │ Client Secret: [••••••••••••••••]                │           │
│ │ Tenant ID:     [sbm.onmicrosoft.com]             │           │
│ │ Status: ● Connected (3 capacities found)         │           │
│ │ [Test Connection]  [Save]                        │           │
│ └──────────────────────────────────────────────────┘           │
│                                                                 │
│ ┌───── FUAM Lakehouse ─────────────────────────────┐           │
│ │ Connection: ● Connected   [Reconnect]            │           │
│ └──────────────────────────────────────────────────┘           │
│                                                                 │
│ ┌───── Data Collection ────────────────────────────┐           │
│ │ [Collect Data ↻]  [Introspect Models ↻]          │           │
│ └──────────────────────────────────────────────────┘           │
│                                                                 │
│ ┌───── Billing ────────────────────────────────────┐  [PLAN C2]│
│ │ Free Plan  [✦ Upgrade]                           │           │
│ │ Semantic models:  ████████████████████  3/3      │           │
│ │ AI analyses:      ████████             44/100    │           │
│ │ Doc generations:  ████                 18/100    │           │
│ │                                                  │           │
│ │ [Manage tracked models]                          │           │
│ └──────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

### 4.8 Drill-down (from Overview issues)

```
┌─────────────────────────────────────────────────────────────────┐
│ DRILL-DOWN (sheet/modal from Overview)                  [BUILD]│
│                                                                 │
│ ┌───────────────────────────────────────────────────┐          │
│ │ ⚠ COST-001: Top item consumes >40% of CU         │          │
│ │                                                    │          │
│ │ Root cause:                                        │          │
│ │ "Sales Model" refresh consumes 42% of total CU    │          │
│ │                                                    │          │
│ │ Affected objects:                                  │          │
│ │ ┌──────────────────────────────────────────┐      │          │
│ │ │ Measure      │ DAX           │ Complex   │      │          │
│ │ │ Total Sales  │ SUM(Sales..)  │ ● Simple  │→ 5.2 │          │
│ │ │ YTD Revenue  │ CALCULATE(..  │ ● High    │→ 5.2 │          │
│ │ └──────────────────────────────────────────┘      │          │
│ │                                                    │          │
│ │ Recommendation:                                    │          │
│ │ "Schedule refresh outside peak hours"              │          │
│ │                                                    │          │
│ │ [View in Model →]  [View Cost Breakdown →]         │          │
│ └───────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Model-Level Deep-Dive (Horizontal Tabs)

Accessed by clicking "Open" on a scanned model in Workspaces (4.3).
Breadcrumb: `Workspaces > Engineering Data [DEV] > RetailOperations`

### 5.1 Model Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ Workspaces > Sales [PROD] > Sales Analytics                    │
│ [Overview] [Measures] [Lineage] [Diagram]                [PLAN]│
│ [Documentation] [AI Analysis] [Health] [Reports]         (B.5) │
│                                                                 │
│ Model Overview · Scanned 6d ago              [↻ Re-scan]       │
│                                                                 │
│ ┌──────────────────────────────────────────────────────┐       │
│ │  ┌────┐                                              │       │
│ │  │9.2 │ Platinum · Quality Score                     │       │
│ │  │/10 │ Weakest: Discoverability (5.5/10)            │       │
│ │  └────┘                                              │       │
│ └──────────────────────────────────────────────────────┘       │
│                                                                 │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                │
│ │  13  │ │ 162  │ │  47  │ │  18  │ │   1  │                │
│ │TABLES│ │ COLS │ │MEAS. │ │RELS. │ │RPTS. │                │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                │
│                                                                 │
│ ┌─── Changes since last scan ──┐ ┌── Quality Breakdown ────┐  │
│ │ No changes detected          │ │ Radar chart (6-dim)     │  │
│ │ Model is stable              │ │  Naming ●               │  │
│ └──────────────────────────────┘ │  Sources   ● Perf.      │  │
│                                  │  Discov. ●   ● Struct.  │  │
│ ┌─── Quality Score Trend ──────┐ │        Hygiene          │  │
│ │ 9.2/10                       │ └─────────────────────────┘  │
│ │ ──────────╱──── trend line   │                               │
│ └──────────────────────────────┘                               │
│                                                                 │
│ ┌─── Action Center ── 20 open ────────────────────┐           │
│ │ [All] [BPA 2] [AI 15] [Health 3]               │           │
│ │ ▸ WARNING  18                                    │           │
│ │ ▸ INFO      2                                    │           │
│ └──────────────────────────────────────────────────┘           │
│                                                                 │
│ TABLES  13 tables                                              │
│ [Filter tables...]                                             │
│ ▸ Metrics   1 table                                            │
│ ▸ Other    12 tables                                           │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Measures (Dependencies & Lineage graphs)

```
┌─────────────────────────────────────────────────────────────────┐
│ [Overview] [*Measures*] [Lineage] [Diagram] ...          [PLAN]│
│                                                        (B.5)   │
│            [Dependencies]  [Lineage]                           │
│                                                                 │
│ 41 connected  6 orphans  34 edges  1 grouped                  │
│ [Search measures...]                                           │
│                                                                 │
│ ┌──────────────────────────────────────────────────────┐       │
│ │                                                      │       │
│ │    ┌────────────────────┐                            │       │
│ │    │ _Measures          │                            │       │
│ │    │ 41 measures        │  ← React Flow graph       │       │
│ │    │ Click to expand    │  Click measure node →      │       │
│ │    └────────────────────┘  see DAX + dependencies    │       │
│ │                                                      │       │
│ └──────────────────────────────────────────────────────┘       │
│                                          [Export PNG]          │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Lineage (measure → table dependencies)

```
┌─────────────────────────────────────────────────────────────────┐
│ [Overview] [Measures] [*Lineage*] [Diagram] ...          [BUILD│
│                                                                 │
│ React Flow: measure → table → relationship graph               │
│                                                                 │
│ ┌──────────────────────────────────────────────────────┐       │
│ │  ┌─────────┐    ┌───────────┐    ┌──────────┐      │       │
│ │  │ Sales   │───→│Total Sales│───→│ KPI Card │      │       │
│ │  │ (table) │    │ (measure) │    │(report)  │      │       │
│ │  └─────────┘    └───────────┘    └──────────┘      │       │
│ │       │         ┌───────────┐                       │       │
│ │       └────────→│Gross Mrgn │                       │       │
│ │                 │ (measure) │                       │       │
│ │                 └───────────┘                       │       │
│ └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 Diagram (Data Model & Power Query Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│ [Overview] [Measures] [Lineage] [*Diagram*] ...          [PLAN]│
│                                                        (B.5)   │
│            [Data Model]  [Query Flow]                          │
│                                                                 │
│ DATA MODEL tab:                                                │
│ 13 tables  3 facts  9 dimensions  18 relationships             │
│ [Search tables...]                                             │
│ ┌──────────────────────────────────────────────────────┐       │
│ │ ┌──────────┐     ┌──────────────┐   ┌──────────┐   │       │
│ │ │FactSales │────→│DimPaymentMthd│   │DimProduct│   │       │
│ │ │ SalesKey │     │ PaymentKey   │   │ProductKey│   │       │
│ │ │ Quantity │     │ PaymentName  │   │ Name     │   │       │
│ │ │ Amount   │     └──────────────┘   │ Category │   │       │
│ │ └──────────┘                        └──────────┘   │       │
│ │  ● Fact(3)  ● Dimension(9)  ● Measure(1)          │       │
│ │  — Active  ---- Inactive                            │       │
│ └──────────────────────────────────────────────────────┘       │
│                                              [Export PNG]      │
│                                                                 │
│ QUERY FLOW tab:                                       [FUTURE]│
│ Power Query M expression lineage                               │
│ Source (SQL Server) → M Query → Landing Table                  │
│ 14 source type patterns supported                              │
└─────────────────────────────────────────────────────────────────┘
```

### 5.5 Documentation (per-model)

```
┌─────────────────────────────────────────────────────────────────┐
│ [Overview] [Measures] [Lineage] [Diagram]                [PLAN]│
│ [*Documentation*] [AI Analysis] [Health] [Reports]     (C2)   │
│                                                                 │
│ Documentation                         [Generate Document ▼]   │
│                                                                 │
│ ┌──────────────────────────────────────────────────────┐       │
│ │ ● RetailOps_Data_Dictionary.docx [Latest]           │       │
│ │   Data Dictionary · 11m ago · 24.6 KB               │       │
│ │                                [View] [Download] [🔗]│       │
│ │                                                      │       │
│ │   RetailOps_Data_Dictionary.docx v10                │       │
│ │   Data Dictionary · 1w ago · 24.6 KB                │       │
│ │                                                      │       │
│ │   RetailOps_Documentation.docx v9                   │       │
│ │   1w ago · 52.6 KB                                  │       │
│ │                                                      │       │
│ │   RetailOps_Health_Check_Developer.docx v7           │       │
│ │   Health Check (Developer) · 1w ago · 21.5 KB       │       │
│ └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### 5.6 AI Analysis

```
┌─────────────────────────────────────────────────────────────────┐
│ [Overview] [Measures] [Lineage] [Diagram]                [PLAN]│
│ [Documentation] [*AI Analysis*] [Health] [Reports]       (D)  │
│                                                                 │
│ ✦ AI Advisory                                                  │
│ Get best-practice recommendations from our AI advisory engine. │
│                                                                 │
│ [DAX Analysis] [Power Query Review] [Data Model Assessment]   │
│                                                                 │
│ PREVIOUS ANALYSES                                              │
│ ┌──────────────────────────────────────────────────────┐       │
│ │ Report Structure Review  ⊘1 critical ○2 info  01:52 │       │
│ │ Data Model Assessment    ○5 info              01:51 │       │
│ │ Power Query Review       △1 warning  ○2 info  01:51 │       │
│ │ DAX Analysis             △1 warning  ○3 info  01:51 │       │
│ └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### 5.7 Health (Unused, Duplicates, Cleanup, Reports)

```
┌─────────────────────────────────────────────────────────────────┐
│ [Overview] [Measures] [Lineage] [Diagram]              [FUTURE]│
│ [Documentation] [AI Analysis] [*Health*] [Reports]             │
│                                                                 │
│ Model Health                                                    │
│ Analyze unused objects, duplicate DAX, potential savings,      │
│ and report structure.                                          │
│                                                                 │
│ ┌─── Unused Objects ──── 135 unused  31% coverage ────┐       │
│ │ 22/47 unused measures  113/149 unused columns        │       │
│ │                                                      │       │
│ │ Unused Measures:                                     │       │
│ │ Stockout Alert Status │ _Measures │ ⊘               │       │
│ │ Profit Margin Status  │ _Measures │ ⊘               │       │
│ │                                                      │       │
│ │ Unused Columns:                                      │       │
│ │ Column1       │ _Measures  │ ⊘                      │       │
│ │ ChannelCode   │ DimChannel │ ⊘                      │       │
│ └──────────────────────────────────────────────────────┘       │
│                                                                 │
│ ┌─── Duplicate DAX ── 2 exact  1 similar ─────────────┐       │
│ │ Total Active Products, Sales LY, ...    7 identical  │       │
│ │ Store Rank - Profit Margin, ...         3 identical  │       │
│ │ Sales Growth % ↔ Sales MOM              86% similar  │       │
│ └──────────────────────────────────────────────────────┘       │
│                                                                 │
│ ┌─── Potential Savings ── 69% reduction possible ─────┐       │
│ │ 135 removable objects │ 22 measures │ 113 columns   │       │
│ │ 8 consolidatable duplicates                          │       │
│ │                                                      │       │
│ │ Top Cleanup Candidates:                              │       │
│ │ Stockout Alert Status │ measure │ HIGH │ Not used   │       │
│ │ Profit Margin Status  │ measure │ HIGH │ Not used   │       │
│ └──────────────────────────────────────────────────────┘       │
│                                                                 │
│ ┌─── Report Pages ── 1 report  1 page ───────────────┐       │
│ │ RetailOperations  2 measures, 1 column used         │       │
│ │ Retail Dashboard │ 2 visuals │ not hidden           │       │
│ └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### 5.8 Reports

```
┌─────────────────────────────────────────────────────────────────┐
│ [Overview] [Measures] [Lineage] [Diagram]              [FUTURE]│
│ [Documentation] [AI Analysis] [Health] [*Reports*]             │
│                                                                 │
│            [Page Viewer]  [Intelligence]                        │
│                                                                 │
│ RetailOperations  1 pages     [Export Pages] [Open in Power BI]│
│                                                                 │
│ Measures ██                              4% — 2/47             │
│ Columns  ●                               1% — 1/149            │
│ 45 measures not used in any report                             │
│ 148 columns not used in any report                             │
│                                                                 │
│ ┌────────────┐                ┌─────────────────────────┐     │
│ │ [thumbnail]│                │ Select a page to view   │     │
│ │  📊 📊     │                │ measure details         │     │
│ │ 2 visuals  │                │                         │     │
│ │ 2 measures │                │         →               │     │
│ │            │                │                         │     │
│ │ Retail     │                │                         │     │
│ │ Dashboard  │                │                         │     │
│ └────────────┘                └─────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Complete Sidebar Reference

```
CUSTOMER SIDEBAR                     PARTNER SIDEBAR
┌──────────────────────┐             ┌──────────────────────┐
│ L LayerPulze         │             │ L LayerPulze         │
│                      │             │                      │
│ ◆ Overview      [LIVE]│             │ ◆ Dashboard     [LIVE]│
│                      │             │ ◆ Customers     [LIVE]│
│ ── EXPLORE ───────── │             │ ◆ Activity      [LIVE]│
│ ◆ Workspaces    [PLAN]│             │ ◆ Connections   [LIVE]│
│ ◆ Documents     [PLAN]│             │ ◆ Settings      [PLAN]│
│                      │             └──────────────────────┘
│ ── FINOPS ────────── │
│ ◆ Capacity      [LIVE]│
│ ◆ Cost & Usage  [LIVE]│
│                      │
│ ── INTELLIGENCE ──── │
│ ◆ Governance  [FUTURE]│
│ ◆ Activity      [PLAN]│
│ ◆ Alerts        [LIVE]│
│                      │
│ ◆ Settings      [LIVE]│
└──────────────────────┘
```

---

## 7. User Journeys

```
JOURNEY 1: "Why is my capacity throttling?"
  Overview → COST-001 issue → Drill-down (4.8) → see "Sales Refresh 42%"
  → Cost & Usage (4.5) → see peak hours → Recommendation: reschedule

JOURNEY 2: "How does this measure work?"
  Workspaces (4.2) → Sales [PROD] → Open (4.3) → Sales Analytics
  → Scan → Model Overview (5.1) → Measures tab (5.2) → click measure
  → see DAX + dependencies

JOURNEY 3: "What's the health of my Fabric environment?"
  Overview (4.1) → Health 87 → Breakdown bars → worst: Docs 34%
  → DOC-001 issue → Drill-down (4.8) → 400 undocumented measures

JOURNEY 4: "Which models depend on this table?"
  Workspaces → Model → Lineage tab (5.3) → React Flow graph
  → click Sales table → see all downstream measures

JOURNEY 5: "What changed since last scan?"
  Workspaces → Model → Overview tab (5.1) → Changes card → diff

JOURNEY 6: "Generate documentation for this model"
  Workspaces → Model → Documentation tab (5.5) → Generate Document
  → select type → Download .docx

JOURNEY 7: "What's wrong with this model's DAX?"
  Workspaces → Model → AI Analysis tab (5.6) → DAX Analysis
  → see recommendations with severity

JOURNEY 8: "Clean up unused objects"                          [FUTURE]
  Workspaces → Model → Health tab (5.7) → Unused Objects
  → 135 unused → Potential Savings → 69% complexity reduction

JOURNEY 9: "Are we compliant with tenant policies?"            [FUTURE]
  Governance (4.6) → Score 48/100 → 3 critical findings
  → fix in Power BI Admin Portal

JOURNEY 10: "What data sources feed this model?"               [FUTURE]
  Workspaces → Model → Diagram tab (5.4) → Query Flow
  → SQL Server → M queries → landing tables
```

---

## 8. Public / Unauthenticated Pages

Pages reachable without a Clerk session. Accessed only via external links
(e.g. the unsubscribe link embedded in a weekly digest email). Must remain
outside the Clerk auth middleware matcher.

```
┌─────────────────────────────────────────────────────────────────┐
│ UNSUBSCRIBED                             /unsubscribed    [LIVE]│
│                                             (C2b / W4)          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                                                      │       │
│  │   ✓ You've been unsubscribed                         │       │
│  │                                                      │       │
│  │   You will no longer receive the LayerPulze weekly   │       │
│  │   digest. You can re-enable notifications anytime    │       │
│  │   from your LayerPulze account settings.             │       │
│  │                                                      │       │
│  │              [ Back to LayerPulze → ]                │       │
│  │                                                      │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                 │
│  Error variant (?error=invalid):                                │
│  "This unsubscribe link is invalid or has expired."             │
└─────────────────────────────────────────────────────────────────┘
```

**Data dependencies:** None (static page).
**Entry points:** Only from `/api/unsubscribe/[token]` 302 redirect.
**Not shown in any sidebar.**

---

## 9. Screen Inventory

| # | Screen | Route | Level | Milestone | Status |
|---|--------|-------|-------|-----------|--------|
| 1 | Landing page | `/` | — | C2 | LIVE |
| 2 | Sign in | `/sign-in` | — | A | LIVE |
| 3 | Sign up | `/sign-up` | — | A | LIVE |
| 4 | Partner dashboard | `/(partner)/dashboard` | Sidebar | A | LIVE |
| 5 | Partner customers | `/(partner)/customers` | Sidebar | A | LIVE |
| 6 | Partner activity | `/(partner)/activity` | Sidebar | A | LIVE |
| 7 | Partner connections | `/(partner)/connections` | Sidebar | C1 | LIVE |
| 8 | Partner settings | `/(partner)/settings` | Sidebar | C1 | Placeholder |
| 9 | Overview (money page) | `/(customer)/[id]` | Sidebar | B | LIVE |
| 10 | Workspaces grid | `/(customer)/[id]/workspaces` | Sidebar | B.5 | PLAN |
| 11 | Workspace detail | `/(customer)/[id]/workspaces/[wsId]` | Sidebar | B.5 | PLAN |
| 12 | Documents hub | `/(customer)/[id]/documents` | Sidebar | C2 | PLAN |
| 13 | Capacity | `/(customer)/[id]/capacity` | Sidebar | B | LIVE |
| 14 | Cost & usage | `/(customer)/[id]/costs` | Sidebar | B | LIVE |
| 15 | Governance | `/(customer)/[id]/governance` | Sidebar | — | FUTURE |
| 16 | Activity log | `/(customer)/[id]/activity` | Sidebar | C1 | PLAN |
| 17 | Alerts | `/(customer)/[id]/alerts` | Sidebar | C2 | LIVE |
| 18 | Settings | `/(customer)/[id]/settings` | Sidebar | A | LIVE |
| 19 | Drill-down | `/(customer)/[id]` (sheet) | Sidebar | B | BUILD |
| 20 | Model overview | `.../models/[modelId]` | Tab | B.5 | PLAN |
| 21 | Model measures | `.../models/[modelId]/measures` | Tab | B.5 | PLAN |
| 22 | Model lineage | `.../models/[modelId]/lineage` | Tab | B | BUILD |
| 23 | Model diagram | `.../models/[modelId]/diagram` | Tab | B.5 | PLAN |
| 24 | Model documentation | `.../models/[modelId]/docs` | Tab | C2 | PLAN |
| 25 | Model AI analysis | `.../models/[modelId]/ai` | Tab | D | PLAN |
| 26 | Model health | `.../models/[modelId]/health` | Tab | — | FUTURE |
| 27 | Model reports | `.../models/[modelId]/reports` | Tab | — | FUTURE |
| 28 | Billing | `/(customer)/[id]/settings/billing` | Settings | C2 | PLAN |
| 29 | Manage tracked models | `.../settings/billing/models` | Settings | C2 | PLAN |
| 30 | Admin dashboard | `/(admin)/` | Sidebar | D | FUTURE |
| 31 | Post-sign-in router | `/post-sign-in` | — | C1 | LIVE |
| 32 | Forbidden | `/forbidden` | — | C1 | LIVE |
| 33 | Partner billing | `/(partner)/settings/billing` | Settings | C2 | BUILD |
| 34 | Unsubscribed confirmation | `/unsubscribed` | Public | C2b | LIVE |

**Total: 34 screens (14 live, 3 building, 14 planned, 3 future)**
