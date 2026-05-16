// Shared data used by multiple views

const DATA = {
  tenant: { name: 'Contoso Fabric', env: 'F64-prod-we', region: 'west-europe' },

  overview: {
    health: 74,
    healthDelta: +3,
    docCoverage: 78,
    capacity: 62,
    spend24h: '12.4k',
    spendDelta: +8,
    issuesOpen: 14,

    // Novel visual: contribution composition
    composition: [
      { key: 'cost',    label: 'Cost efficiency',    value: 62, weight: 30, tone: 'sky' },
      { key: 'quality', label: 'Model quality',      value: 81, weight: 25, tone: 'violet' },
      { key: 'docs',    label: 'Doc coverage',       value: 78, weight: 20, tone: 'emerald' },
      { key: 'refresh', label: 'Refresh reliability',value: 88, weight: 15, tone: 'amber' },
      { key: 'sec',     label: 'Security posture',   value: 54, weight: 10, tone: 'rose' },
    ],

    trend: [68, 69, 71, 70, 72, 71, 73, 72, 74, 73, 75, 74],

    topIssues: [
      { id: 'COST-001', severity: 'critical', category: 'cost',
        title: <>3 Import-mode models exceed <code>50M</code> rows — storage pressure</>,
        evidence: <>Workspace <b>Finance-Prod</b> · 2,142 CU over 7d</>,
        impact: '≈ $182/mo potential savings · 3 affected models',
        impactTone: 'critical' },
      { id: 'QUAL-001', severity: 'warning', category: 'quality',
        title: <>47 undocumented measures in <b>Finance-Prod</b></>,
        evidence: <>182 measures total · last audit 3d ago</>,
        impact: 'Blocks self-serve reporting',
        impactTone: 'warning' },
      { id: 'REF-012', severity: 'warning', category: 'refresh',
        title: <>Refresh p95 &gt; 10 min on <code>Sales Pipeline</code></>,
        evidence: <>4 capacities · 62% utilization avg</>,
        impact: 'Risks SLA on 3 downstream reports',
        impactTone: 'warning' },
      { id: 'SEC-008',  severity: 'info', category: 'security',
        title: 'Row-level security covers 8 of 24 critical tables',
        evidence: 'Recommended by your governance policy',
        impact: 'Exposure flagged on PII in 3 workspaces',
        impactTone: 'info' },
    ],
  },

  workspaces: {
    counts: { workspaces: 12, models: 34, tables: 496, measures: 976 },
    items: [
      { id: 'sales-prod', name: 'Sales-Prod',   env: 'PROD', star: true,  models: 5, tables: 68, measures: 172, scanned: '2h ago',  owner: 'A. Rivera',     iconTone: 'sky',     health: 88 },
      { id: 'finance-prod', name: 'Finance-Prod', env: 'PROD', star: true,  models: 8, tables: 120, measures: 301, scanned: '1d ago',  owner: 'M. Qureshi',    iconTone: 'violet',  health: 62 },
      { id: 'hr-data',    name: 'HR-Data',      env: 'DEV',  star: false, models: 2, tables: 18, measures: 42,  scanned: '—',       owner: 'J. Patel',      iconTone: 'emerald', health: null, scanCta: true },
      { id: 'supply-uat', name: 'Supply-Chain', env: 'UAT',  star: false, models: 4, tables: 52, measures: 98,  scanned: '6h ago',  owner: 'T. Hoffmann',   iconTone: 'amber',   health: 74 },
      { id: 'retail-ops', name: 'RetailOps',    env: 'PROD', star: true,  models: 7, tables: 94, measures: 210, scanned: '12h ago', owner: 'S. Lindqvist',  iconTone: 'rose',    health: 92 },
      { id: 'mkt-dev',    name: 'Marketing',    env: 'DEV',  star: false, models: 3, tables: 38, measures: 74,  scanned: '3d ago',  owner: 'P. Nguyen',      iconTone: 'sky',     health: 55 },
      { id: 'ops-score',  name: 'Operations Scorecard', env: 'PROD', star: false, models: 3, tables: 47, measures: 59, scanned: '1d ago', owner: 'K. Andersen', iconTone: 'emerald', health: 81 },
      { id: 'ana-sbx',    name: 'Analytics-Sandbox', env: 'DEV', star: false, models: 2, tables: 59, measures: 20, scanned: '—', owner: 'D. Okafor', iconTone: 'violet', health: null, scanCta: true },
    ],
  },

  workspaceDetail: {
    'finance-prod': {
      name: 'Finance-Prod', env: 'PROD',
      subtitle: 'Owned by M. Qureshi · 8 models · connected via FUAM-Prod',
      models: [
        { id: 'sales-analytics', name: 'Sales Analytics',   tables: 12, measures: 42, scanned: '3d ago',  score: 9.2, tone: 'emerald' },
        { id: 'budget-planning', name: 'Budget Planning',   tables: 8,  measures: 15, scanned: '—',       score: null },
        { id: 'kpi-dashboard',   name: 'KPI Dashboard',     tables: 4,  measures: 28, scanned: '1d ago',  score: 7.4, tone: 'amber' },
        { id: 'rev-forecast',    name: 'Revenue Forecast',  tables: 9,  measures: 31, scanned: '6h ago',  score: 8.1, tone: 'emerald' },
        { id: 'expense-pnl',     name: 'Expense P&L',       tables: 11, measures: 38, scanned: '2d ago',  score: 6.2, tone: 'amber' },
        { id: 'gl-balances',     name: 'GL Balances',       tables: 7,  measures: 22, scanned: '5d ago',  score: 4.1, tone: 'rose' },
      ],
    },
  },

  model: {
    'sales-analytics': {
      name: 'Sales Analytics',
      workspace: 'Finance-Prod',
      env: 'PROD',
      scannedAgo: '3d ago',
      score: 9.2,
      tier: 'Platinum',
      weakest: { dim: 'Discoverability', val: 5.5 },
      stats: { tables: 13, columns: 162, measures: 47, relationships: 18, reports: 1 },
      breakdown: [
        { key: 'naming',   label: 'Naming',             val: 9.5 },
        { key: 'sources',  label: 'Sources',            val: 8.9 },
        { key: 'perf',     label: 'Performance',        val: 8.1 },
        { key: 'struct',   label: 'Structure',          val: 9.8 },
        { key: 'hygiene',  label: 'Hygiene',            val: 7.0 },
        { key: 'discover', label: 'Discoverability',    val: 5.5 },
      ],
      scoreTrend: [8.4, 8.5, 8.7, 8.8, 8.9, 9.0, 9.0, 9.1, 9.1, 9.2, 9.2, 9.2],
      tables: [
        { group: 'Fact',      rows: [{ name: 'FactSales',       cols: 14, rel: 'active' }, { name: 'FactReturns', cols: 9, rel: 'active' }, { name: 'FactBudget', cols: 12, rel: 'inactive' }] },
        { group: 'Dimension', rows: [{ name: 'DimProduct',      cols: 8,  rel: 'active' }, { name: 'DimCustomer',cols: 11, rel: 'active' }, { name: 'DimDate',    cols: 7, rel: 'active' }, { name: 'DimGeography', cols: 6, rel: 'active' }] },
      ],
      actions: { warning: 18, info: 2 },
    },
  },

  capacity: {
    '24h': [42,45,50,55,60,66,70,78,82,75,72,68,65,64,68,72,78,85,92,88,82,72,62,58],
    '7d':  [58,61,66,70,74,72,68,65,62,60,66,72,78,82,80,76,70,66,62,60,64,70,78,84,88,86,82,74],
    '30d': Array.from({ length: 30 }, (_, i) => 55 + Math.round(Math.sin(i / 3) * 15 + i * 0.3)),
  },

  cuConsumers: [
    { nm: 'Sales Refresh',    pct: 42, cu: 2142, tone: 'oklch(0.69 0.17 237)' },
    { nm: 'Budget Calc',      pct: 28, cu: 1418, tone: 'oklch(0.62 0.16 275)' },
    { nm: 'KPI Refresh',      pct: 16, cu: 812,  tone: 'oklch(0.64 0.16 135)' },
    { nm: 'Expense Rollup',   pct: 9,  cu: 456,  tone: 'oklch(0.65 0.18 45)' },
    { nm: 'Ad-hoc queries',   pct: 5,  cu: 252,  tone: 'oklch(0.55 0.22 25)' },
  ],
  cuTable: [
    { date: 'Apr 07', item: 'Sales Model',   op: 'Refresh',    cu: 1240 },
    { date: 'Apr 07', item: 'Budget Calc',   op: 'Dataflow',   cu:  812 },
    { date: 'Apr 07', item: 'KPI Refresh',   op: 'Refresh',    cu:  456 },
    { date: 'Apr 06', item: 'Sales Model',   op: 'Refresh',    cu: 1180 },
    { date: 'Apr 06', item: 'Expense P&L',   op: 'Refresh',    cu:  712 },
    { date: 'Apr 06', item: 'Ad-hoc query',  op: 'Query',      cu:   42 },
    { date: 'Apr 05', item: 'Sales Model',   op: 'Refresh',    cu: 1326 },
  ],
};

window.DATA = DATA;
