// Data for Licenses, Reports & Apps, Lineage, Access — derived from data-inventory PRD

const __r = (seed) => { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };

// ─── V1: License inventory (Microsoft Graph /subscribedSkus) ────
DATA.licenses = {
  tenantSpend: 33840, // €/mo
  reclaimable: 4700,
  reclaimableCount: 47,
  unassigned: 18,
  mfaCoverage: 0.87,
  mfaTotal: 487,
  mfaMissing: 63,
  skus: [
    { sku: 'Power BI Pro',       skuPart: 'PBI_PRO',       total: 320, consumed: 286, monthly: 9.99, color: 'sky',     family: 'Power BI', stale: 47, list: 9.99 },
    { sku: 'Power BI PPU',       skuPart: 'PBI_PREMIUM_P', total:  18, consumed:  18, monthly: 19.99, color: 'violet', family: 'Power BI', stale: 2,  list: 19.99 },
    { sku: 'Fabric Free',        skuPart: 'FABRIC_FREE',   total: 200, consumed: 124, monthly: 0,     color: 'slate',  family: 'Fabric',  stale: 0,  list: 0 },
    { sku: 'Microsoft 365 E5',   skuPart: 'M365_E5',       total: 350, consumed: 312, monthly: 53.30, color: 'emerald',family: 'M365',    stale: 12, list: 53.30 },
    { sku: 'Microsoft 365 E3',   skuPart: 'M365_E3',       total: 140, consumed: 124, monthly: 33.10, color: 'amber',  family: 'M365',    stale: 8,  list: 33.10 },
  ],
  reclaimList: [
    { name: 'Daniel Okafor',   dept: 'Sales',      sku: 'Power BI Pro', lastActive: 47, sessions30d: 0, cost: 9.99, status: 'reclaim' },
    { name: 'Priya Sharma',    dept: 'Sales',      sku: 'Power BI Pro', lastActive: 38, sessions30d: 0, cost: 9.99, status: 'reclaim' },
    { name: 'Felix Beaumont',  dept: 'Finance',    sku: 'Power BI Pro', lastActive: 32, sessions30d: 1, cost: 9.99, status: 'reclaim' },
    { name: 'Lena Hofmann',    dept: 'IT',         sku: 'Power BI Pro', lastActive: 31, sessions30d: 2, cost: 9.99, status: 'reclaim' },
    { name: 'Jakub Nowak',     dept: 'Operations', sku: 'Power BI Pro', lastActive: 28, sessions30d: 0, cost: 9.99, status: 'reclaim' },
    { name: 'Yuki Tanaka',     dept: 'Finance',    sku: 'Power BI Pro', lastActive: 22, sessions30d: 4, cost: 9.99, status: 'downgrade' },
    { name: 'Maya Greenfield', dept: 'HR',         sku: 'Power BI Pro', lastActive: 18, sessions30d: 6, cost: 9.99, status: 'downgrade' },
  ],
  mfaMissingList: [
    { name: 'svc-bi-runner',       role: 'Service Account', dept: 'IT',      lastActive: 0,  admin: true },
    { name: 'svc-fabric-ingest',   role: 'Service Account', dept: 'IT',      lastActive: 0,  admin: true },
    { name: 'Contractor: J. Okoye',role: 'External',        dept: 'Sales',   lastActive: 4,  admin: false },
    { name: 'Anna Kowalski',       role: 'Member',          dept: 'Finance', lastActive: 1,  admin: false },
  ],
};

// ─── V3+V7: Reports & Apps inventory ──────────────────────────
DATA.reports = {
  total: 184,
  orphaned: 7,
  dormant: 23,
  withoutRefresh: 12,
  items: [
    { name: 'Margin Dashboard',         ws: 'Finance-Prod',   type: 'Power BI',   dataset: 'Sales Analytics',  viewers30: 142, opens30: 1842, modified: '2d ago',  status: 'healthy', refresh: 'ok',     visuals: 12, tone: 'sky' },
    { name: 'Pipeline 360',             ws: 'Sales',          type: 'Power BI',   dataset: 'Sales Analytics',  viewers30: 84,  opens30: 612,  modified: '5d ago',  status: 'healthy', refresh: 'ok',     visuals: 14, tone: 'amber' },
    { name: 'YTD Variance Report',      ws: 'Finance-Prod',   type: 'Paginated',  dataset: 'Budget Planning',  viewers30: 38,  opens30: 287,  modified: '1w ago',  status: 'healthy', refresh: 'ok',     visuals: 4,  tone: 'sky' },
    { name: 'Q4 Sales Snapshot 2024',   ws: 'Sales',          type: 'Power BI',   dataset: 'Legacy Sales',     viewers30: 0,   opens30: 0,    modified: '94d ago', status: 'orphan',  refresh: 'failed', visuals: 18, tone: 'amber' },
    { name: 'EMEA Quarterly Review',    ws: 'Finance-Prod',   type: 'Power BI',   dataset: 'Revenue Forecast', viewers30: 22,  opens30: 124,  modified: '3w ago',  status: 'healthy', refresh: 'ok',     visuals: 9,  tone: 'sky' },
    { name: 'Plant Output Live',        ws: 'Operations',     type: 'Power BI',   dataset: 'Plant Output (PILOT)', viewers30: 4, opens30: 18, modified: '47d ago', status: 'dormant', refresh: 'stale', visuals: 7,  tone: 'emerald' },
    { name: 'Marketing Funnel 2024',    ws: 'Marketing',      type: 'Power BI',   dataset: 'Marketing Funnel 2024', viewers30: 0, opens30: 0, modified: '94d ago', status: 'orphan', refresh: 'stale', visuals: 11, tone: 'violet' },
    { name: 'HR Attrition',             ws: 'HR-Data',        type: 'Power BI',   dataset: 'HR Headcount',     viewers30: 17,  opens30: 84,   modified: '12d ago', status: 'healthy', refresh: 'ok',     visuals: 6,  tone: 'rose' },
    { name: 'Operations Scorecard',     ws: 'Ops-Score',      type: 'Power BI',   dataset: 'Ops Scorecard',    viewers30: 64,  opens30: 412,  modified: '4d ago',  status: 'healthy', refresh: 'ok',     visuals: 8,  tone: 'emerald' },
    { name: 'Stockout Alert Status',    ws: 'Operations',     type: 'Power BI',   dataset: '(deleted)',        viewers30: 0,   opens30: 0,    modified: '187d ago',status: 'broken',  refresh: 'na',     visuals: 3,  tone: 'rose' },
  ],
};

DATA.apps = {
  total: 18,
  audienceTotal: 1840,
  dormantCount: 4,
  items: [
    { name: 'Sales Q4 Insights',    ws: 'Sales',         audience: 412, opens30: 8,   updated: '94d ago', status: 'dormant',  reports: 4, tone: 'amber' },
    { name: 'Finance Executive',    ws: 'Finance-Prod',  audience: 28,  opens30: 142, updated: '4d ago',  status: 'healthy',  reports: 6, tone: 'sky' },
    { name: 'Plant Operations',     ws: 'Operations',    audience: 184, opens30: 612, updated: '6d ago',  status: 'healthy',  reports: 5, tone: 'emerald' },
    { name: 'HR Self-Service',      ws: 'HR-Data',       audience: 487, opens30: 184, updated: '12d ago', status: 'healthy',  reports: 3, tone: 'rose' },
    { name: 'Marketing Funnel',     ws: 'Marketing',     audience: 64,  opens30: 0,   updated: '187d ago',status: 'dormant',  reports: 2, tone: 'violet' },
    { name: 'CFO Briefing',         ws: 'Finance-Prod',  audience: 12,  opens30: 42,  updated: '2d ago',  status: 'healthy',  reports: 4, tone: 'sky' },
  ],
};

// ─── V4+V6: Lineage graph (cross-workload artifacts) ───────────
DATA.lineage = {
  totalItems: 487,
  newCategories: 6, // Lakehouse, Warehouse, Notebook, KQL, Pipeline, etc.
  sleeperItems: 41,
  nodes: [
    // Sources (left)
    { id: 'src-sql',    type: 'Source',      kind: 'SQL Server',    label: 'srv-eu.sql.azure',    x: 80,  y: 80,  cost: 0,  lastSeen: 'now',    layer: 0 },
    { id: 'src-blob',   type: 'Source',      kind: 'Blob storage',  label: 'datalake-prd',         x: 80,  y: 220, cost: 0,  lastSeen: 'now',    layer: 0 },
    { id: 'src-api',    type: 'Source',      kind: 'REST API',      label: 'CRM API',              x: 80,  y: 360, cost: 0,  lastSeen: 'now',    layer: 0 },
    // Lakehouse / Warehouse layer
    { id: 'lh-1',       type: 'Lakehouse',   kind: 'Lakehouse',     label: 'finance_lake',         x: 280, y: 120, cost: 184, lastSeen: '4m',    layer: 1 },
    { id: 'lh-2',       type: 'Lakehouse',   kind: 'Lakehouse',     label: 'Legacy_2023',          x: 280, y: 260, cost: 410, lastSeen: '187d', status: 'sleeper', layer: 1 },
    { id: 'wh-1',       type: 'Warehouse',   kind: 'Warehouse',     label: 'finance_wh',           x: 280, y: 380, cost: 142, lastSeen: '8m',    layer: 1 },
    // Notebooks
    { id: 'nb-1',       type: 'Notebook',    kind: 'Notebook',      label: 'sales-etl.ipynb',      x: 460, y: 80,  cost:  62, lastSeen: '2h',    layer: 2 },
    { id: 'nb-2',       type: 'Notebook',    kind: 'Notebook',      label: 'price-model.ipynb',    x: 460, y: 200, cost: 318, lastSeen: '6m',    layer: 2 },
    { id: 'pipe-1',     type: 'Pipeline',    kind: 'Pipeline',      label: 'CRM Sync',             x: 460, y: 320, cost:  98, lastSeen: '1h',    layer: 2 },
    // Semantic models
    { id: 'sm-1',       type: 'Semantic',    kind: 'Semantic model',label: 'Sales Analytics',      x: 640, y: 100, cost: 487, lastSeen: '12m',   layer: 3 },
    { id: 'sm-2',       type: 'Semantic',    kind: 'Semantic model',label: 'Revenue Forecast',     x: 640, y: 240, cost: 142, lastSeen: '34m',   layer: 3 },
    { id: 'sm-3',       type: 'Semantic',    kind: 'Semantic model',label: 'Legacy Sales',         x: 640, y: 360, cost: 218, lastSeen: '78d', status: 'sleeper', layer: 3 },
    // Reports
    { id: 'rpt-1',      type: 'Report',      kind: 'Report',        label: 'Margin Dashboard',     x: 820, y: 60,  cost: 0,   lastSeen: '8m',    layer: 4 },
    { id: 'rpt-2',      type: 'Report',      kind: 'Report',        label: 'Pipeline 360',         x: 820, y: 140, cost: 0,   lastSeen: '24m',   layer: 4 },
    { id: 'rpt-3',      type: 'Report',      kind: 'Report',        label: 'EMEA Quarterly',       x: 820, y: 240, cost: 0,   lastSeen: '1h',    layer: 4 },
    { id: 'rpt-4',      type: 'Report',      kind: 'Report',        label: 'Q4 Sales 2024',        x: 820, y: 340, cost: 0,   lastSeen: '94d', status: 'orphan', layer: 4 },
    // Apps
    { id: 'app-1',      type: 'App',         kind: 'App',           label: 'Finance Executive',    x: 1000,y: 100, cost: 0,   lastSeen: '12m',   layer: 5 },
    { id: 'app-2',      type: 'App',         kind: 'App',           label: 'Sales Q4 Insights',    x: 1000,y: 280, cost: 0,   lastSeen: '4d', status: 'dormant',  layer: 5 },
  ],
  edges: [
    ['src-sql', 'lh-1'],   ['src-blob', 'lh-2'], ['src-blob', 'wh-1'], ['src-api', 'pipe-1'],
    ['lh-1', 'nb-1'],      ['lh-1', 'nb-2'],     ['wh-1', 'pipe-1'],   ['lh-2', 'sm-3'],
    ['nb-1', 'sm-1'],      ['nb-2', 'sm-2'],     ['pipe-1', 'sm-1'],   ['pipe-1', 'sm-2'],
    ['sm-1', 'rpt-1'],     ['sm-1', 'rpt-2'],    ['sm-2', 'rpt-3'],    ['sm-3', 'rpt-4'],
    ['rpt-1', 'app-1'],    ['rpt-3', 'app-1'],   ['rpt-2', 'app-2'],
  ],
};

// ─── V5: Access — AAD groups & workspace role assignments ─────
DATA.access = {
  groupsTotal: 47,
  assignmentsTotal: 312,
  privilegedCount: 14,
  staleAssignments: 23,
  groups: [
    { name: 'Finance-Admins',        members: 23, inactive: 4,  workspaces: 8, role: 'Admin',       risk: 'high',   updated: '12d ago' },
    { name: 'Sales-Contributors',    members: 84, inactive: 12, workspaces: 5, role: 'Contributor', risk: 'med',    updated: '4d ago' },
    { name: 'Operations-Viewers',    members:142, inactive: 8,  workspaces: 12,role: 'Viewer',      risk: 'low',    updated: '8d ago' },
    { name: 'BI-Power-Users',        members: 38, inactive: 2,  workspaces: 18,role: 'Member',      risk: 'med',    updated: '2d ago' },
    { name: 'HR-Limited',            members: 12, inactive: 0,  workspaces: 2, role: 'Viewer',      risk: 'low',    updated: '6d ago' },
    { name: 'IT-Service-Accounts',   members:  6, inactive: 0,  workspaces: 23,role: 'Admin',       risk: 'high',   updated: '34d ago' },
    { name: 'Marketing-Editors',     members: 28, inactive: 6,  workspaces: 4, role: 'Member',      risk: 'low',    updated: '14d ago' },
    { name: 'Legacy-Sales-2023',     members: 18, inactive: 18, workspaces: 3, role: 'Admin',       risk: 'high',   updated: '187d ago', stale: true },
  ],
  assignments: [
    { workspace: 'Sales-Prod',       principal: 'Finance-Admins',      kind: 'Group',  role: 'Admin',       members: 23, lastUsed: '4d ago',  risk: 'high' },
    { workspace: 'Finance-Prod',     principal: 'Finance-Admins',      kind: 'Group',  role: 'Admin',       members: 23, lastUsed: '1d ago',  risk: 'high' },
    { workspace: 'Finance-Prod',     principal: 'BI-Power-Users',      kind: 'Group',  role: 'Member',      members: 38, lastUsed: '4h ago',  risk: 'low' },
    { workspace: 'Operations',       principal: 'IT-Service-Accounts', kind: 'Group',  role: 'Admin',       members:  6, lastUsed: '34d ago', risk: 'high' },
    { workspace: 'Marketing',        principal: 'Legacy-Sales-2023',   kind: 'Group',  role: 'Admin',       members: 18, lastUsed: '187d ago',risk: 'high', stale: true },
    { workspace: 'HR-Data',          principal: 'HR-Limited',          kind: 'Group',  role: 'Viewer',      members: 12, lastUsed: '6d ago',  risk: 'low' },
    { workspace: 'Sandbox',          principal: 'sara.patel@…',        kind: 'User',   role: 'Admin',       members:  1, lastUsed: '1d ago',  risk: 'med' },
    { workspace: 'Sales',            principal: 'svc-bi-runner',       kind: 'ServicePrincipal', role: 'Admin', members: 1, lastUsed: '4m ago', risk: 'high' },
  ],
};

window.DATA = DATA;
