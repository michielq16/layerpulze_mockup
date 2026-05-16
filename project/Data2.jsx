// Additional data for Documents, Governance, Activity, and model deep-dive tabs

Object.assign(DATA, {
  documents: {
    stats: { modelsDocumented: 13, total: 52, outdated: 3, storage: '2.3 MB' },
    items: [
      { id: 'd1', model: 'RetailOperations',        ws: 'RetailOps',     type: 'Data Dictionary',       status: 'current',  tables: 13, measures: 47, docs: 11, updated: '11m ago', size: '24.6 KB', tone: 'rose' },
      { id: 'd2', model: 'Management of Change',    ws: 'Operations',    type: 'Full Documentation',    status: 'current',  tables: 46, measures: 30, docs: 9,  updated: '1h ago',  size: '38.1 KB', tone: 'amber' },
      { id: 'd3', model: 'Operations Scorecard',    ws: 'Ops-Score',     type: 'Data Dictionary',       status: 'current',  tables: 74, measures: 579, docs: 6, updated: '6h ago',  size: '78.4 KB', tone: 'emerald' },
      { id: 'd4', model: 'Sales Analytics',         ws: 'Finance-Prod',  type: 'Full Documentation',    status: 'outdated', tables: 12, measures: 42, docs: 8,  updated: '9d ago',  size: '52.6 KB', tone: 'sky' },
      { id: 'd5', model: 'Budget Planning',         ws: 'Finance-Prod',  type: 'Health Check (Dev)',    status: 'current',  tables: 8,  measures: 15, docs: 4,  updated: '2d ago',  size: '21.5 KB', tone: 'violet' },
      { id: 'd6', model: 'Revenue Forecast',        ws: 'Finance-Prod',  type: 'Executive Summary',     status: 'outdated', tables: 9,  measures: 31, docs: 3,  updated: '14d ago', size: '18.9 KB', tone: 'amber' },
      { id: 'd7', model: 'HR Headcount',            ws: 'HR-Data',       type: 'Data Dictionary',       status: 'current',  tables: 6,  measures: 22, docs: 5,  updated: '3d ago',  size: '19.2 KB', tone: 'emerald' },
      { id: 'd8', model: 'Marketing Funnel',        ws: 'Marketing',     type: 'Full Documentation',    status: 'current',  tables: 11, measures: 38, docs: 7,  updated: '5h ago',  size: '41.8 KB', tone: 'sky' },
    ],
  },

  governance: {
    score: 48,
    compliantRules: 6, totalRules: 25, settingsCount: 160,
    findings: [
      { id: 'G-001', sev: 'critical', cat: 'External Sharing',   title: 'Guest access not scoped to security groups',   detail: 'Currently allowed for the entire tenant.',   recommend: 'Restrict to specific AAD groups.' },
      { id: 'G-002', sev: 'critical', cat: 'External Sharing',   title: 'Publish to web enabled',                        detail: 'Reports can be exposed to the public internet.', recommend: 'Disable or limit via security groups.' },
      { id: 'G-003', sev: 'critical', cat: 'Security',            title: 'Resource key auth not blocked',                 detail: 'Dataflow Gen1 still accepts resource keys.',   recommend: 'Block entirely or whitelist.' },
      { id: 'G-004', sev: 'warning',  cat: 'Content',             title: 'R and Python visuals enabled tenant-wide',      detail: 'Custom script visuals increase attack surface.', recommend: 'Disable or restrict to a data-science group.' },
      { id: 'G-005', sev: 'warning',  cat: 'Content',             title: 'Web content tiles enabled',                     detail: 'Third-party HTML iframes can be embedded.',   recommend: 'Disable unless needed for approved reports.' },
      { id: 'G-006', sev: 'warning',  cat: 'Developer',           title: 'Custom visuals allowed without certification',  detail: 'Anyone can publish uncertified visuals.',    recommend: 'Require certification.' },
      { id: 'G-007', sev: 'warning',  cat: 'Content',             title: 'Export to PowerPoint/PDF not restricted',       detail: 'Bulk export flagged by your DLP policy.',    recommend: 'Restrict to a subset of users.' },
      { id: 'G-008', sev: 'warning',  cat: 'Info Protection',     title: 'Sensitivity labels not required on upload',     detail: 'Labels can be omitted on some models.',      recommend: 'Require label on all PBIX upload.' },
      { id: 'G-009', sev: 'warning',  cat: 'Admin',               title: 'Admin API usage not audited',                   detail: 'No retention set for audit log events.',     recommend: 'Set retention to 180 days minimum.' },
      { id: 'G-010', sev: 'info',     cat: 'Info Protection',     title: 'Sensitivity labels enabled',                    detail: '5 of 7 default labels configured.',          recommend: 'Add the remaining 2 to standardize.' },
      { id: 'G-011', sev: 'info',     cat: 'Workspaces',          title: 'Workspace naming convention unenforced',        detail: '47% of workspaces lack environment prefix.', recommend: 'Apply name template policy.' },
      { id: 'G-012', sev: 'info',     cat: 'Datasets',            title: 'XMLA endpoints set to Read/Write',              detail: 'Third-party tools can write models.',        recommend: 'Review for principle of least privilege.' },
      { id: 'G-013', sev: 'info',     cat: 'Content',             title: 'Public email allowed for Publish to Web',       detail: 'No domain restriction on publish-to-web.',   recommend: 'Restrict to corporate domains.' },
    ],
    categories: [
      { name: 'Additional workloads',        enabled: 2, total: 5  },
      { name: 'Admin API settings',          enabled: 4, total: 6  },
      { name: 'Microsoft Fabric',            enabled: 6, total: 14 },
      { name: 'Dataflow settings',           enabled: 3, total: 8  },
      { name: 'Developer settings',          enabled: 2, total: 7  },
      { name: 'Export and sharing settings', enabled: 1, total: 12 },
      { name: 'Help and support',            enabled: 3, total: 3  },
      { name: 'Information protection',      enabled: 5, total: 9  },
    ],
  },

  activity: {
    stats: { scans: 4, docs: 3, ai: 2, resolved: 8 },
    items: [
      { date: 'Apr 23, 2026', day: [
        { type: 'scan',    actor: 'Michiel V.', verb: 'Re-scanned',       target: 'RetailOperations',   meta: '9.2/10',           ago: '2h ago',  tone: 'sky' },
        { type: 'doc',     actor: 'Michiel V.', verb: 'Generated',        target: 'RetailOperations',   meta: 'Data Dictionary',  ago: '2h ago',  tone: 'emerald' },
        { type: 'ai',      actor: 'Sara P.',    verb: 'Ran',              target: 'Sales Analytics',    meta: 'DAX Analysis',     ago: '4h ago',  tone: 'violet' },
        { type: 'alert',   actor: 'system',     verb: 'Fired alert',      target: 'Capacity >85%',      meta: 'Cap-West · 08:42', ago: '6h ago',  tone: 'amber' },
      ]},
      { date: 'Apr 22, 2026', day: [
        { type: 'scan',    actor: 'Michiel V.', verb: 'Re-scanned',       target: 'Management of Change', meta: '7.4/10',         ago: '1d ago',  tone: 'sky' },
        { type: 'resolve', actor: 'Michiel V.', verb: 'Resolved',         target: 'COST-001',           meta: '≈ €182/mo saved',  ago: '1d ago',  tone: 'emerald' },
        { type: 'scan',    actor: 'Michiel V.', verb: 'Re-scanned',       target: 'Mooring Dashboard',  meta: '4.0/10',           ago: '1d ago',  tone: 'sky' },
      ]},
      { date: 'Apr 21, 2026', day: [
        { type: 'doc',     actor: 'Sara P.',    verb: 'Generated',        target: 'Budget Planning',    meta: 'Health Check',     ago: '2d ago',  tone: 'emerald' },
        { type: 'ai',      actor: 'Michiel V.', verb: 'Ran',              target: 'RetailOperations',   meta: 'Power Query Review', ago: '2d ago', tone: 'violet' },
        { type: 'resolve', actor: 'Sara P.',    verb: 'Resolved',         target: 'QUAL-001',           meta: '47 measures documented', ago: '2d ago', tone: 'emerald' },
        { type: 'scan',    actor: 'Michiel V.', verb: 'Re-scanned',       target: 'Operations Scorecard', meta: '8.1/10',         ago: '2d ago',  tone: 'sky' },
      ]},
    ],
  },
});

// Model-tab data (shared across any opened model for demo)
DATA.modelExtras = {
  diagram: {
    tables: [
      // fact tables
      { id: 'fs',  name: 'FactSales',     kind: 'fact', x: 360, y: 60, cols: ['SalesKey','ProductKey','CustomerKey','DateKey','Quantity','Amount','Cost','Discount'] },
      { id: 'fr',  name: 'FactReturns',   kind: 'fact', x: 600, y: 60, cols: ['ReturnKey','ProductKey','CustomerKey','DateKey','Quantity','RefundAmt'] },
      { id: 'fb',  name: 'FactBudget',    kind: 'fact', x: 820, y: 270, cols: ['BudgetKey','ProductKey','DateKey','Planned','Actual'] },
      // dims
      { id: 'dp',  name: 'DimProduct',    kind: 'dim',  x: 60,  y: 30,  cols: ['ProductKey','Name','Category','SubCat','Brand'] },
      { id: 'dc',  name: 'DimCustomer',   kind: 'dim',  x: 60,  y: 200, cols: ['CustomerKey','Name','Segment','Country','Tier'] },
      { id: 'dd',  name: 'DimDate',       kind: 'dim',  x: 620, y: 310, cols: ['DateKey','Date','Year','Quarter','Month','Day'] },
      { id: 'dg',  name: 'DimGeography',  kind: 'dim',  x: 60,  y: 370, cols: ['GeoKey','Country','Region','City'] },
      // measure table
      { id: 'mm',  name: '_Measures',     kind: 'measure', x: 360, y: 330, cols: ['TotalSales','YTDRevenue','GrossMargin','SalesGrowth%'] },
    ],
    rels: [
      { from: 'dp', to: 'fs', kind: 'active' },
      { from: 'dp', to: 'fr', kind: 'active' },
      { from: 'dp', to: 'fb', kind: 'inactive' },
      { from: 'dc', to: 'fs', kind: 'active' },
      { from: 'dc', to: 'fr', kind: 'active' },
      { from: 'dd', to: 'fs', kind: 'active' },
      { from: 'dd', to: 'fr', kind: 'active' },
      { from: 'dd', to: 'fb', kind: 'active' },
      { from: 'dg', to: 'dc', kind: 'active' },
    ],
  },
  docs: [
    { id: 'v11', name: 'SalesAnalytics_Data_Dictionary.docx', type: 'Data Dictionary', version: 'v11', latest: true, ago: '11m ago', by: 'Michiel V.', size: '24.6 KB', pages: 14 },
    { id: 'v10', name: 'SalesAnalytics_Data_Dictionary.docx', type: 'Data Dictionary', version: 'v10',                ago: '1w ago',  by: 'Michiel V.', size: '24.6 KB', pages: 14 },
    { id: 'v9',  name: 'SalesAnalytics_Full_Documentation.docx', type: 'Full Documentation', version: 'v9',           ago: '1w ago',  by: 'Sara P.',    size: '52.6 KB', pages: 38 },
    { id: 'v7',  name: 'SalesAnalytics_Health_Check_Developer.docx', type: 'Health Check (Dev)', version: 'v7',       ago: '1w ago',  by: 'Sara P.',    size: '21.5 KB', pages: 11 },
    { id: 'v6',  name: 'SalesAnalytics_Executive_Summary.docx', type: 'Executive Summary', version: 'v6',             ago: '2w ago',  by: 'Michiel V.', size: '14.2 KB', pages: 4  },
  ],
  ai: [
    { id: 'AI-4', name: 'Report Structure Review', tone: 'rose',   critical: 1, warning: 0, info: 2, at: '01:52', by: 'Michiel V.', summary: 'One report page uses 9 slicers — consider a filter pane.' },
    { id: 'AI-3', name: 'Data Model Assessment',   tone: 'violet', critical: 0, warning: 0, info: 5, at: '01:51', by: 'Michiel V.', summary: 'Model is well-normalized. 5 suggestions on hygiene.' },
    { id: 'AI-2', name: 'Power Query Review',      tone: 'amber',  critical: 0, warning: 1, info: 2, at: '01:51', by: 'Michiel V.', summary: 'One native-query step breaks folding on DimCustomer.' },
    { id: 'AI-1', name: 'DAX Analysis',            tone: 'sky',    critical: 0, warning: 1, info: 3, at: '01:51', by: 'Michiel V.', summary: 'YTD Revenue uses FILTER(ALL()) unnecessarily.' },
  ],
  health: {
    unused: {
      measures: { used: 25, unused: 22, total: 47 },
      columns:  { used: 36, unused: 113, total: 149 },
      measuresList: [
        { name: 'Stockout Alert Status', table: '_Measures',   ago: '47d' },
        { name: 'Profit Margin Status',  table: '_Measures',   ago: '62d' },
        { name: 'Inventory Age Bucket',  table: '_Measures',   ago: '31d' },
        { name: 'Sales LY Delta',        table: '_Measures',   ago: '22d' },
      ],
      columnsList: [
        { name: 'Column1',        table: '_Measures',  ago: 'never' },
        { name: 'ChannelCode',    table: 'DimChannel', ago: '94d' },
        { name: 'Region2',        table: 'DimGeo',     ago: '72d' },
        { name: 'ReportingEntity',table: 'DimOrg',     ago: '45d' },
      ],
    },
    duplicates: [
      { a: 'Total Active Products', b: '7 identical copies', kind: 'exact', similarity: 100 },
      { a: 'Store Rank — Profit',   b: '3 identical copies', kind: 'exact', similarity: 100 },
      { a: 'Sales Growth %',        b: 'Sales MOM',           kind: 'similar', similarity: 86 },
    ],
    savings: {
      removable: 135, measures: 22, columns: 113, dupes: 8, reduction: 69,
      candidates: [
        { name: 'Stockout Alert Status', kind: 'measure', confidence: 'HIGH', reason: 'Not used in any report' },
        { name: 'Profit Margin Status',  kind: 'measure', confidence: 'HIGH', reason: 'Not used in any report' },
        { name: 'Inventory Age Bucket',  kind: 'measure', confidence: 'MED',  reason: 'Used only in a hidden page' },
        { name: 'ChannelCode',           kind: 'column',  confidence: 'HIGH', reason: 'No downstream references' },
      ],
    },
  },
  reports: {
    coverage: { measures: 2, measuresTotal: 47, columns: 1, columnsTotal: 149 },
    pages: [
      { id: 'p1', name: 'Retail Dashboard',      visuals: 12, measures: 2, cols: 1, hidden: false, thumbSeed: 'dash' },
      { id: 'p2', name: 'Store Rankings',         visuals: 6,  measures: 3, cols: 2, hidden: false, thumbSeed: 'rank' },
      { id: 'p3', name: 'Margin Analysis',        visuals: 8,  measures: 4, cols: 3, hidden: false, thumbSeed: 'marg' },
      { id: 'p4', name: 'Legacy — Old Dashboard', visuals: 4,  measures: 1, cols: 0, hidden: true,  thumbSeed: 'old' },
    ],
  },
};
