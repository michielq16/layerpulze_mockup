// H2 Cost Attribution + Workload Mix — data

const __wkSpark = (n, base, vol = 0.3, seed = 1) => {
  let s = seed;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return Array.from({ length: n }, (_, i) =>
    Math.max(0, Math.round((base + Math.sin(i * 0.4 + seed) * base * 0.25 + (rand() - 0.5) * base * vol) * 10) / 10));
};

DATA.capacities = [
  { id: 'cap-prd', name: 'SBM-PRD',  sku: 'F8', vCores: 8, currency: 'EUR', monthlyBill: 5847, capacityCU: 28800,
    hasPricing: true, status: 'healthy', cuAvg30: 64, cuPeak30: 91, throttle7d: 1, env: 'F64-prod-we' },
  { id: 'cap-snd', name: 'SBM-SND',  sku: 'F2', vCores: 2, currency: 'EUR', monthlyBill: 1462, capacityCU: 7200,
    hasPricing: true, status: 'idle',    cuAvg30: 12, cuPeak30: 28, throttle7d: 0, env: 'F64-prod-we' },
  { id: 'cap-uat', name: 'SBM-UAT',  sku: 'F4', vCores: 4, currency: 'USD', monthlyBill: 0,    capacityCU: 14400,
    hasPricing: false,status: 'healthy', cuAvg30: 38, cuPeak30: 62, throttle7d: 0, env: 'F64-prod-we' },
];

// Per-capacity 30d daily CU% (Story 5 — distinct values per capacity)
DATA.capacityCU = {
  'cap-prd': __wkSpark(30, 64, 0.35, 7),
  'cap-snd': __wkSpark(30, 12, 0.50, 13),
  'cap-uat': __wkSpark(30, 38, 0.30, 21),
};
DATA.capacityCU24h = {
  'cap-prd': __wkSpark(24, 64, 0.40, 31),
  'cap-snd': __wkSpark(24, 12, 0.55, 37),
  'cap-uat': __wkSpark(24, 38, 0.35, 41),
};
DATA.capacityCU7d = {
  'cap-prd': __wkSpark(28, 64, 0.35, 43),
  'cap-snd': __wkSpark(28, 12, 0.50, 47),
  'cap-uat': __wkSpark(28, 38, 0.30, 53),
};

// Per-capacity cutover (Story 5 data-source pill)
DATA.perCapacityCutover = '2026-04-22';

// Cost observations (treemap source) — items grouped by workspace
DATA.costItems = {
  'cap-prd': [
    { ws: 'Finance-Prod', tone: 'sky', items: [
      { name: 'Sales Analytics',     type: 'Power BI',  cu: 184_200, costPct: 21.1 },
      { name: 'Budget Planning',     type: 'Power BI',  cu: 142_800, costPct: 16.4 },
      { name: 'YTD Pipeline',        type: 'Pipeline',  cu:  98_400, costPct: 11.3 },
      { name: 'Revenue Forecast',    type: 'Power BI',  cu:  62_100, costPct:  7.1 },
      { name: 'GL Reconciliation',   type: 'Dataflow',  cu:  41_200, costPct:  4.7 },
    ]},
    { ws: 'Operations', tone: 'emerald', items: [
      { name: 'Ops Scorecard',       type: 'Power BI',  cu:  87_100, costPct: 10.0 },
      { name: 'Plant Output Spark',  type: 'Spark',     cu:  74_600, costPct:  8.6 },
      { name: 'Equipment Telemetry', type: 'Dataset',   cu:  38_700, costPct:  4.4 },
    ]},
    { ws: 'Sales', tone: 'amber', items: [
      { name: 'Pipeline 360',        type: 'Power BI',  cu:  56_400, costPct:  6.5 },
      { name: 'CRM Sync',            type: 'Pipeline',  cu:  28_900, costPct:  3.3 },
      { name: 'Lead Score Notebook', type: 'Spark',     cu:  18_400, costPct:  2.1 },
    ]},
    { ws: 'Marketing', tone: 'violet', items: [
      { name: 'Funnel Dashboard',    type: 'Power BI',  cu:  24_300, costPct:  2.8 },
      { name: 'Campaign Lake',       type: 'Dataflow',  cu:  12_100, costPct:  1.4 },
    ]},
    { ws: 'HR-Data', tone: 'rose', items: [
      { name: 'Headcount Model',     type: 'Power BI',  cu:   8_400, costPct:  1.0 },
    ]},
  ],
  'cap-snd': [
    { ws: 'Sandbox', tone: 'slate', items: [
      { name: 'Pricing Strategy DEV', type: 'Power BI', cu: 18_400, costPct: 52 },
      { name: 'Test Notebook',        type: 'Spark',    cu:  9_200, costPct: 26 },
      { name: 'Ad-hoc Queries',       type: 'Dataset',  cu:  4_300, costPct: 12 },
      { name: 'Migration Scratch',    type: 'Pipeline', cu:  3_500, costPct: 10 },
    ]},
  ],
  'cap-uat': [], // empty-state path (no pricing OR no activity)
};

// Workload-mix 30-day daily stack (5 workload types)
const __mkStack = (base, seed) => {
  const r = (i, m) => { let s = (seed + i * m) % 233280; return ((s * 9301 + 49297) % 233280) / 233280; };
  return Array.from({ length: 30 }, (_, i) => ({
    powerbi:  Math.round((base * 0.42 + (r(i, 1) - 0.5) * base * 0.2)),
    dataflow: Math.round((base * 0.20 + (r(i, 3) - 0.5) * base * 0.15)),
    pipeline: Math.round((base * 0.15 + (r(i, 5) - 0.5) * base * 0.12)),
    spark:    Math.round((base * 0.13 + (r(i, 7) - 0.5) * base * 0.10) + (i % 7 < 5 ? base * 0.05 : 0)),
    dataset:  Math.round((base * 0.08 + (r(i, 11) - 0.5) * base * 0.06)),
    other:    Math.max(0, Math.round((base * 0.02 + (r(i, 13) - 0.5) * base * 0.03))),
  }));
};
DATA.workloadMix = {
  'cap-prd': __mkStack(28800 * 0.64, 17),
  'cap-snd': __mkStack(7200 * 0.12, 23),
  'cap-uat': __mkStack(14400 * 0.38, 29),
};

DATA.workloadTypes = [
  { key: 'powerbi',  label: 'Power BI',  color: 'oklch(0.66 0.18 75)'  },
  { key: 'dataflow', label: 'Dataflow',  color: 'oklch(0.62 0.18 237)' },
  { key: 'pipeline', label: 'Pipeline',  color: 'oklch(0.58 0.14 150)' },
  { key: 'spark',    label: 'Spark',     color: 'oklch(0.58 0.18 290)' },
  { key: 'dataset',  label: 'Dataset',   color: 'oklch(0.58 0.20 25)'  },
  { key: 'other',    label: 'Other',     color: 'oklch(0.55 0.03 250)' },
];

// Peak-hour heatmap 7d × 24h CU% per capacity
const __mkHeat = (avg, peak, seed) => Array.from({ length: 7 }, (_, d) =>
  Array.from({ length: 24 }, (_, h) => {
    const wk = d < 5, work = h >= 8 && h <= 18, batch = h >= 2 && h <= 5;
    let v = avg;
    if (work && wk) v = avg + (peak - avg) * 0.7 * (1 - Math.abs(h - 11) / 8);
    else if (batch && wk) v = avg + (peak - avg) * 0.85;
    else if (!wk && work) v = avg * 0.4;
    else v = avg * 0.6;
    const s = (seed + d * 24 + h) % 233280;
    return Math.max(0, Math.round(v + ((s * 9301 + 49297) % 233280 / 233280 - 0.5) * 10));
  }));

DATA.peakHeat = {
  'cap-prd': __mkHeat(64, 91, 11),
  'cap-snd': __mkHeat(12, 28, 19),
  'cap-uat': __mkHeat(38, 62, 27),
};

window.DATA = DATA;
