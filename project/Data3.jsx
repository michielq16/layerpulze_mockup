// User Intelligence pillar — data for Users, Adoption, Sleepers, Audit

// Helpers
const __spark = (n, base = 10, vol = 0.5) =>
  Array.from({ length: n }, (_, i) => Math.round((base + Math.sin(i * 0.6) * base * 0.3 + (Math.random() - 0.5) * base * vol) * 10) / 10);

Object.assign(DATA, {
  userIntel: {
    // Overview stats for the sidebar group
    summary: {
      totalUsers: 487,
      activeMTD: 312,
      copilotUsers: 42,
      sleepersCount: 17,
      monthlySpend: 18432,
      currency: '€',
    },
  },

  // ─── Users (S1, S2, S6) ────────────────────────
  users: {
    departments: [
      { name: 'Finance',     headcount: 84, cu: 1284200, cost: 6420, share: 35, tone: 'sky' },
      { name: 'Operations',  headcount: 142, cu: 928400,  cost: 4642, share: 25, tone: 'emerald' },
      { name: 'Sales',       headcount: 73, cu: 612300,  cost: 3061, share: 16, tone: 'amber' },
      { name: 'HR',          headcount: 38, cu: 287600,  cost: 1438, share: 8,  tone: 'violet' },
      { name: 'IT',          headcount: 56, cu: 401400,  cost: 2007, share: 11, tone: 'rose' },
      { name: 'Unassigned',  headcount: 94, cu: 175900,  cost: 864,  share: 5,  tone: 'slate' },
    ],
    top: [
      { id: 'u1', name: 'Sara Patel',     email: 'sara.patel@contoso.com',     dept: 'Finance',    role: 'Senior Analyst',    cu: 184_200, cost: 921, queries: 4823, datasets: 28, refreshes: 47, exports: 134, copilot: 312, spark: __spark(14, 14, 0.3), copilotRate: 0.34, status: 'power' },
      { id: 'u2', name: 'Michiel Vermeer',email: 'michiel.v@contoso.com',      dept: 'Finance',    role: 'BI Lead',           cu: 142_800, cost: 714, queries: 3128, datasets: 41, refreshes: 89, exports: 86,  copilot: 248, spark: __spark(14, 12, 0.3), copilotRate: 0.41, status: 'power' },
      { id: 'u3', name: 'Anita Velasquez', email: 'anita.v@contoso.com',       dept: 'Operations', role: 'Ops Manager',       cu: 98_400,  cost: 492, queries: 2840, datasets: 17, refreshes: 12, exports: 198, copilot: 56,  spark: __spark(14, 9, 0.4),  copilotRate: 0.08, status: 'power' },
      { id: 'u4', name: 'Daniel Okafor',   email: 'daniel.o@contoso.com',      dept: 'Sales',      role: 'Sales Director',    cu: 87_100,  cost: 436, queries: 1962, datasets: 12, refreshes: 4,  exports: 312, copilot: 12,  spark: __spark(14, 8, 0.5),  copilotRate: 0.02, status: 'normal' },
      { id: 'u5', name: 'Emilia Rossi',    email: 'emilia.r@contoso.com',      dept: 'Operations', role: 'Plant Manager',     cu: 74_600,  cost: 373, queries: 1543, datasets: 9,  refreshes: 8,  exports: 67,  copilot: 0,   spark: __spark(14, 7, 0.4),  copilotRate: 0,    status: 'normal' },
      { id: 'u6', name: 'Hans Berg',       email: 'hans.b@contoso.com',        dept: 'IT',         role: 'Data Engineer',     cu: 68_300,  cost: 342, queries: 932,  datasets: 47, refreshes: 142, exports: 18, copilot: 184, spark: __spark(14, 6, 0.5),  copilotRate: 0.62, status: 'power' },
      { id: 'u7', name: 'Yuki Tanaka',     email: 'yuki.t@contoso.com',        dept: 'Finance',    role: 'Junior Analyst',    cu: 52_900,  cost: 264, queries: 1843, datasets: 8,  refreshes: 6,  exports: 41,  copilot: 92,  spark: __spark(14, 5, 0.4),  copilotRate: 0.21, status: 'normal' },
      { id: 'u8', name: 'Maya Greenfield', email: 'maya.g@contoso.com',        dept: 'HR',         role: 'People Analyst',    cu: 41_200,  cost: 206, queries: 1284, datasets: 6,  refreshes: 18, exports: 23,  copilot: 41,  spark: __spark(14, 4, 0.5),  copilotRate: 0.14, status: 'normal' },
      { id: 'u9', name: 'Jakub Nowak',     email: 'jakub.n@contoso.com',       dept: 'Operations', role: 'Logistics Analyst', cu: 38_700,  cost: 193, queries: 1102, datasets: 14, refreshes: 5,  exports: 78,  copilot: 0,   spark: __spark(14, 3.7, 0.5),copilotRate: 0,    status: 'normal' },
      { id: 'u10',name: 'Priya Sharma',    email: 'priya.s@contoso.com',       dept: 'Sales',      role: 'Sales Analyst',     cu: 33_400,  cost: 167, queries: 944,  datasets: 11, refreshes: 3,  exports: 156, copilot: 6,   spark: __spark(14, 3.2, 0.4),copilotRate: 0.01, status: 'normal' },
      { id: 'u11',name: 'Felix Beaumont',  email: 'felix.b@contoso.com',       dept: 'Finance',    role: 'Controller',        cu: 28_900,  cost: 145, queries: 712,  datasets: 22, refreshes: 9,  exports: 89,  copilot: 0,   spark: __spark(14, 2.7, 0.5),copilotRate: 0,    status: 'normal' },
      { id: 'u12',name: 'Lena Hofmann',    email: 'lena.h@contoso.com',        dept: 'IT',         role: 'DBA',               cu: 24_300,  cost: 122, queries: 412,  datasets: 38, refreshes: 78, exports: 4,   copilot: 22,  spark: __spark(14, 2.3, 0.6),copilotRate: 0.18, status: 'normal' },
    ],
  },

  // ─── User detail (for any user opened from the leaderboard) ─
  userDetail: {
    /* Heatmap: 7 days × 24 hours, integer 0-10 */
    heatmap: Array.from({ length: 7 }, (_, day) =>
      Array.from({ length: 24 }, (_, hr) => {
        const workHr = hr >= 8 && hr <= 18;
        const workDay = day < 5;
        const base = workHr && workDay ? 6 : (hr >= 19 && hr <= 22 && workDay) ? 1.5 : workDay ? 0.5 : 0.3;
        return Math.max(0, Math.round((base + Math.sin(hr * 0.4 + day) * 1.5 + Math.random() * 2) * (workHr && workDay ? 1.2 : 0.6)));
      })
    ),
    recent: [
      { at: '14:42', op: 'ViewReport',    target: 'Sales Analytics · Margin Dashboard', tone: 'sky' },
      { at: '14:38', op: 'AskCopilot',    target: '"trend in EMEA Q1 revenue?"',         tone: 'violet' },
      { at: '14:21', op: 'ExportData',    target: 'Sales Analytics · top-customers',     tone: 'amber' },
      { at: '13:55', op: 'EditDataset',   target: 'Budget Planning · YTD Variance',      tone: 'rose' },
      { at: '13:12', op: 'ViewReport',    target: 'Revenue Forecast · Q2 outlook',       tone: 'sky' },
      { at: '12:08', op: 'RefreshDataset',target: 'Budget Planning',                     tone: 'emerald' },
      { at: '11:34', op: 'ViewReport',    target: 'Sales Analytics · Pipeline',          tone: 'sky' },
    ],
    datasets: [
      { name: 'Sales Analytics',   ws: 'Finance-Prod', queries: 1840, share: 38 },
      { name: 'Budget Planning',   ws: 'Finance-Prod', queries: 1284, share: 27 },
      { name: 'Revenue Forecast',  ws: 'Finance-Prod', queries: 612,  share: 13 },
      { name: 'Marketing Funnel',  ws: 'Marketing',    queries: 487,  share: 10 },
      { name: 'HR Headcount',      ws: 'HR-Data',      queries: 312,  share: 6  },
      { name: '6 others',          ws: '—',            queries: 288,  share: 6  },
    ],
  },

  // ─── Adoption (S4, S5, S8) ──────────────────────
  adoption: {
    dau: { v: 124, delta: 8, spark: __spark(30, 100, 0.2) },
    wau: { v: 287, delta: 3, spark: __spark(30, 250, 0.15) },
    mau: { v: 419, delta: 12, spark: __spark(30, 380, 0.1) },
    stickiness: 0.42,    // DAU/MAU
    funnel: [
      { stage: 'Invited',         count: 487, rate: 1.00 },
      { stage: 'First sign-in',   count: 412, rate: 0.85 },
      { stage: 'First query',     count: 358, rate: 0.74 },
      { stage: 'Second session',  count: 304, rate: 0.62 },
      { stage: 'Weekly active',   count: 212, rate: 0.44 },
      { stage: 'Power user',      count: 38,  rate: 0.08 },
    ],
    cohorts: [
      { month: 'Nov',   new: 18, retained: 14, m2: 11, m3: 9 },
      { month: 'Dec',   new: 24, retained: 19, m2: 16, m3: 12 },
      { month: 'Jan',   new: 31, retained: 26, m2: 22, m3: 17 },
      { month: 'Feb',   new: 28, retained: 24, m2: 19, m3: null },
      { month: 'Mar',   new: 36, retained: 32, m2: null, m3: null },
      { month: 'Apr',   new: 42, retained: null, m2: null, m3: null },
    ],
    copilot: {
      eligible: 487, active: 42, share: 0.086,
      sessionsWeek: 1284,
      ack: 0.78, // acceptance rate
      // 12 weeks of copilot usage
      weekly: __spark(12, 80, 0.4).map(v => Math.max(20, v * 14)),
      topUsers: [
        { name: 'Hans Berg',        sessions: 184, ack: 0.82 },
        { name: 'Michiel Vermeer',  sessions: 248, ack: 0.71 },
        { name: 'Sara Patel',       sessions: 312, ack: 0.84 },
        { name: 'Yuki Tanaka',      sessions: 92,  ack: 0.69 },
      ],
      types: [
        { kind: 'Summarise',     count: 412, share: 32 },
        { kind: 'Explain DAX',   count: 318, share: 25 },
        { kind: 'Q&A',           count: 287, share: 22 },
        { kind: 'Suggest visual',count: 164, share: 13 },
        { kind: 'Other',         count: 103, share: 8  },
      ],
    },
  },

  // ─── Sleepers (S3, S9, S11) ─────────────────────
  sleepers: {
    summary: { count: 17, refreshes30d: 1840, wastedCU: 142_300, wastedCost: 712, biggestStale: 94 },
    candidates: [
      { id: 's1', name: 'Marketing Funnel 2024',   ws: 'Marketing',    refreshes30d: 240, lastQuery: 94, queries30d: 0, cost: 184, status: 'archive', size: '2.4 GB', refreshSched: 'Hourly' },
      { id: 's2', name: 'Legacy Sales (Q3-Q4 2023)',ws: 'Finance-Prod', refreshes30d: 120, lastQuery: 78, queries30d: 0, cost: 96,  status: 'archive', size: '4.1 GB', refreshSched: '4× daily' },
      { id: 's3', name: 'HR Onboarding Pipeline',  ws: 'HR-Data',      refreshes30d: 90,  lastQuery: 64, queries30d: 0, cost: 72,  status: 'archive', size: '480 MB', refreshSched: '3× daily' },
      { id: 's4', name: 'Plant Output (PILOT)',    ws: 'Operations',   refreshes30d: 240, lastQuery: 52, queries30d: 0, cost: 184, status: 'archive', size: '1.2 GB', refreshSched: 'Hourly' },
      { id: 's5', name: 'Q1 Audit Snapshot',       ws: 'Finance-Prod', refreshes30d: 60,  lastQuery: 41, queries30d: 0, cost: 48,  status: 'archive', size: '320 MB', refreshSched: '2× daily' },
      { id: 's6', name: 'Field Sales Mobile',      ws: 'Sales',        refreshes30d: 180, lastQuery: 12, queries30d: 4, cost: 142, status: 'review',  size: '1.8 GB', refreshSched: '6× daily' },
      { id: 's7', name: 'Pricing Strategy DEV',    ws: 'Sandbox',      refreshes30d: 240, lastQuery: 8,  queries30d: 2, cost: 184, status: 'review',  size: '210 MB', refreshSched: 'Hourly' },
    ],
    /* Refresh-to-first-query distribution (S9) — minutes */
    refreshLatency: [
      { dataset: 'Sales Analytics',    refresh: '04:00', firstQuery: '08:14', wait: 254, recommendation: 'good'   },
      { dataset: 'Budget Planning',    refresh: '04:30', firstQuery: '09:42', wait: 312, recommendation: 'good'   },
      { dataset: 'Revenue Forecast',   refresh: '00:00', firstQuery: '09:18', wait: 558, recommendation: 'shift'  },
      { dataset: 'HR Headcount',       refresh: '02:00', firstQuery: '10:33', wait: 513, recommendation: 'shift'  },
      { dataset: 'Marketing Funnel',   refresh: '03:00', firstQuery: '08:48', wait: 348, recommendation: 'good'   },
    ],
  },

  // ─── Audit (S7, S12, S13) ───────────────────────
  audit: {
    summary: { exports30d: 1284, exportsAfterHours: 47, rlsRules: 23, rlsNeverFire: 4 },
    exports: [
      { at: '2026-05-11 14:21', user: 'Sara Patel',      dataset: 'Sales Analytics',    report: 'Margin Dashboard',  format: 'CSV',   rows: 12_840, sens: 'Confidential', flag: false },
      { at: '2026-05-11 11:08', user: 'Michiel Vermeer', dataset: 'Revenue Forecast',   report: 'Q2 Outlook',        format: 'XLSX',  rows: 2_142,  sens: 'Internal',     flag: false },
      { at: '2026-05-11 09:42', user: 'Anita Velasquez', dataset: 'Operations Scorecard',report: 'KPI Heatmap',      format: 'PDF',   rows: null,    sens: 'Internal',     flag: false },
      { at: '2026-05-11 02:34', user: 'svc-bi-runner',   dataset: 'Budget Planning',    report: 'YTD Variance',      format: 'CSV',   rows: 48_120, sens: 'Restricted',   flag: true },
      { at: '2026-05-10 22:17', user: 'Daniel Okafor',   dataset: 'Sales Analytics',    report: 'Pipeline detail',   format: 'XLSX', rows: 6_204,  sens: 'Confidential', flag: true },
      { at: '2026-05-10 14:55', user: 'Maya Greenfield', dataset: 'HR Headcount',       report: 'Attrition',         format: 'PDF',   rows: null,    sens: 'Restricted',   flag: false },
      { at: '2026-05-10 11:18', user: 'Yuki Tanaka',     dataset: 'Sales Analytics',    report: 'EMEA Q1',           format: 'CSV',   rows: 8_412,  sens: 'Confidential', flag: false },
      { at: '2026-05-10 03:08', user: 'Felix Beaumont',  dataset: 'Budget Planning',    report: 'Forecast vs Actual',format: 'XLSX', rows: 5_184,  sens: 'Restricted',   flag: true },
    ],
    /* Off-hours heatmap (S7): 7 days × 24 hours, exports per hour */
    offHoursHeatmap: Array.from({ length: 7 }, (_, day) =>
      Array.from({ length: 24 }, (_, hr) => {
        const work = hr >= 8 && hr <= 18 && day < 5;
        return Math.max(0, Math.round(
          (work ? 14 : (day >= 5 ? 2 : 1.2))
          + Math.sin(hr * 0.4 + day) * 1.6
          + Math.random() * (work ? 4 : 1.5)
        ));
      })
    ),
    rlsRules: [
      { id: 'RLS-001', model: 'Sales Analytics',    role: 'EU Sales',    fires30d: 18_420, lastFire: '8m ago', status: 'active' },
      { id: 'RLS-002', model: 'Sales Analytics',    role: 'US Sales',    fires30d: 22_180, lastFire: '12m ago',status: 'active' },
      { id: 'RLS-003', model: 'Sales Analytics',    role: 'APAC Sales',  fires30d: 8_410,  lastFire: '34m ago',status: 'active' },
      { id: 'RLS-004', model: 'Budget Planning',    role: 'Finance HQ',  fires30d: 4_280,  lastFire: '2h ago', status: 'active' },
      { id: 'RLS-005', model: 'Budget Planning',    role: 'Finance EMEA',fires30d: 1_840,  lastFire: '4h ago', status: 'active' },
      { id: 'RLS-006', model: 'HR Headcount',       role: 'HR Admin',    fires30d: 612,    lastFire: '6h ago', status: 'active' },
      { id: 'RLS-007', model: 'HR Headcount',       role: 'Regional HR', fires30d: 0,      lastFire: 'never',  status: 'never' },
      { id: 'RLS-008', model: 'Operations Scorecard',role:'Plant Admin', fires30d: 14_280, lastFire: '4m ago', status: 'active' },
      { id: 'RLS-009', model: 'Operations Scorecard',role:'Plant Ops',   fires30d: 9_140,  lastFire: '11m ago',status: 'active' },
      { id: 'RLS-010', model: 'Marketing Funnel',   role: 'Marketing US',fires30d: 0,      lastFire: 'never',  status: 'never' },
      { id: 'RLS-011', model: 'Marketing Funnel',   role: 'Marketing EU',fires30d: 0,      lastFire: 'never',  status: 'never' },
      { id: 'RLS-012', model: 'Revenue Forecast',   role: 'Finance HQ',  fires30d: 0,      lastFire: 'never',  status: 'never' },
    ],
  },
});
