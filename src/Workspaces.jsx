import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { StatCard, EnvBadge } from './components';

const SORT_OPTIONS = [
  { key: 'cost-desc',    label: 'Most $/mo',        icon: 'dollar' },
  { key: 'cost-asc',     label: 'Least $/mo',       icon: 'dollar' },
  { key: 'models-desc',  label: 'Most models',      icon: 'database' },
  { key: 'reports-desc', label: 'Most reports',     icon: 'file-text' },
  { key: 'health-desc',  label: 'Best health',      icon: 'trend-up' },
  { key: 'health-asc',   label: 'Worst health',     icon: 'trend-down' },
  { key: 'scan-desc',    label: 'Recently scanned', icon: 'refresh' },
  { key: 'name-asc',     label: 'Name A–Z',         icon: 'arrow-down' },
];

// "scanned" strings on workspaces are relative — parse roughly to days for sort.
function scanAge(s) {
  if (!s || s === '—') return 999;
  const m = String(s).match(/^(\d+(?:\.\d+)?)\s*([hd])/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  return m[2].toLowerCase() === 'h' ? n / 24 : n;
}

function sortItems(items, sort) {
  const a = [...items];
  switch (sort) {
    case 'cost-desc':    return a.sort((x, y) => (y.costPerMo || 0) - (x.costPerMo || 0));
    case 'cost-asc':     return a.sort((x, y) => (x.costPerMo || 0) - (y.costPerMo || 0));
    case 'models-desc':  return a.sort((x, y) => y.models - x.models);
    case 'reports-desc': return a.sort((x, y) => (y.reports || 0) - (x.reports || 0));
    case 'health-desc':  return a.sort((x, y) => (y.health ?? -1) - (x.health ?? -1));
    case 'health-asc':   return a.sort((x, y) => (x.health ?? 999) - (y.health ?? 999));
    case 'scan-desc':    return a.sort((x, y) => scanAge(x.scanned) - scanAge(y.scanned));
    case 'name-asc':     return a.sort((x, y) => x.name.localeCompare(y.name));
    default: return a;
  }
}

export function Workspaces({ onOpen }) {
  const [q, setQ]               = React.useState('');
  const [env, setEnv]           = React.useState('all');
  const [capacityId, setCapId]  = React.useState('all');
  const [capOpen, setCapOpen]   = React.useState(false);
  const [starredOnly, setStar]  = React.useState(false);
  const [sort, setSort]         = React.useState('cost-desc');
  const [sortOpen, setSortOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState('tile');

  const allItems   = DATA.workspaces.items;
  const capacities = DATA.workspaces.capacities;
  const summary    = DATA.workspaces.summary;

  // Apply capacity + env + starred + search filters, then sort.
  const filtered = allItems.filter(w =>
    (capacityId === 'all' || w.capacityId === capacityId) &&
    (env === 'all' || w.env.toLowerCase() === env) &&
    (!starredOnly || w.star) &&
    (q === '' || w.name.toLowerCase().includes(q.toLowerCase()))
  );
  const items = sortItems(filtered, sort);

  // KPIs recalculate when the capacity filter narrows.
  const scoped = capacityId === 'all' ? allItems : allItems.filter(w => w.capacityId === capacityId);
  const scopedModels  = scoped.reduce((n, w) => n + (w.models || 0), 0);
  const scopedReports = scoped.reduce((n, w) => n + (w.reports || 0), 0);
  const scopedCapCost = capacityId === 'all'
    ? capacities.reduce((s, c) => s + c.monthlyCost, 0)
    : (capacities.find(c => c.id === capacityId)?.monthlyCost || 0);
  const scopedLicCost = Math.round(summary.totalCost.licenseCost * (scoped.length / allItems.length));
  const scopedTotal   = scopedCapCost + scopedLicCost;
  const scopedWaste   = Math.round(summary.wastedSpend.value * (scoped.length / allItems.length));

  const envCounts = {
    all:  scoped.length,
    prod: scoped.filter(w => w.env === 'PROD').length,
    uat:  scoped.filter(w => w.env === 'UAT').length,
    dev:  scoped.filter(w => w.env === 'DEV').length,
  };

  const selectedCap  = capacities.find(c => c.id === capacityId);
  const selectedSort = SORT_OPTIONS.find(s => s.key === sort);

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Workspaces</h1>
          <p className="lp-page-sub">Every Fabric workspace in this tenant — scoped by capacity, ranked by health. Click any to drill into models, reports, and cost.</p>
        </div>
        <div className="fade-in d2 ws-head-actions">
          {/* Capacity selector — page-scope, top-right (matches /capacity + /costs) */}
          <div className="ws-cap-wrap ws-cap-wrap-head">
            <button className={'ws-cap-btn' + (capOpen ? ' open' : '')} onClick={() => { setCapOpen(o => !o); setSortOpen(false); }}>
              <span className={'ws-cap-dot' + (capacityId === 'all' ? '' : ' active')}/>
              <span className="ws-cap-name">{capacityId === 'all' ? 'All capacities' : selectedCap?.name}</span>
              {capacityId !== 'all' && selectedCap && <span className="badge badge-outline ws-cap-sku">{selectedCap.sku}</span>}
              {capacityId === 'all' && <span className="ws-cap-count mono">{capacities.length}</span>}
              <Icon name="chevron-down" size={12}/>
            </button>
            {capOpen && (
              <div className="ws-cap-pop ws-cap-pop-right" onClick={e => e.stopPropagation()}>
                <div className="ws-cap-pop-head">CAPACITIES · {capacities.length}</div>
                <button className={'ws-cap-pop-row' + (capacityId === 'all' ? ' active' : '')} onClick={() => { setCapId('all'); setCapOpen(false); }}>
                  <span className="ws-cap-pop-name">All capacities</span>
                  {capacityId === 'all' && <Icon name="check" size={13}/>}
                </button>
                {capacities.map(c => (
                  <button key={c.id} className={'ws-cap-pop-row' + (capacityId === c.id ? ' active' : '')} onClick={() => { setCapId(c.id); setCapOpen(false); }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ws-cap-pop-name">{c.name} <span className="badge badge-outline ws-cap-sku-sm">{c.sku}</span></div>
                      <div className="ws-cap-pop-sub mono">${c.monthlyCost.toLocaleString()}/mo · {c.region}</div>
                    </div>
                    {capacityId === c.id && <Icon name="check" size={13}/>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="btn btn-outline btn-sm"><Icon name="refresh" size={14}/>Sync workspaces</button>
          <button className="btn btn-sm"><Icon name="plus" size={14}/>Connect capacity</button>
        </div>
      </div>

      {/* 5-KPI strip — Workspaces · Models · Health · Total Cost · Potential Wasted */}
      <div className="ws-grid-5 fade-in">
        <StatCard label="Workspaces"     value={scoped.length}              sub={capacityId === 'all' ? 'across portfolio' : selectedCap?.name} icon="folders" tone="sky"/>
        <StatCard label="Semantic Models" value={scopedModels}              sub={scopedReports + ' reports'}                                    icon="database" tone="violet"/>
        <HealthScoreCard health={summary.health}/>
        <StatCard label="Total Cost · Est." value={'$' + (scopedTotal / 1000).toFixed(1) + 'k'} unit="/mo" sub={'$' + scopedCapCost.toLocaleString() + ' capacity + $' + scopedLicCost.toLocaleString() + ' licenses'} icon="dollar" tone="emerald"/>
        <StatCard label="Potential Wasted" value={'$' + scopedWaste.toLocaleString()} unit="/mo" sub={summary.wastedSpend.sources.length + ' optimization opportunities'} icon="trend-down" tone="amber"/>
      </div>

      {/* Section head — matches the original "Browse N matches" style */}
      <div className="lp-section-head" style={{ marginTop: 22 }}>
        <h2>Browse <span className="count">{items.length} matches</span></h2>
      </div>

      {/* Single-row filter bar: Search · Env pills · Starred · Sort · View toggle */}
      {/* (Capacity selector lives in the page-head, top-right) */}
      <div className="lp-card lp-card-flush ws-filter-card fade-in d2">
        <div className="ws-filter-row">
          <div className="lp-search ws-search">
            <Icon name="search" size={14}/>
            <input placeholder="Search workspaces…" value={q} onChange={e => setQ(e.target.value)}/>
          </div>

          <div className="ws-env-chips">
            {[['all','All','sky'],['prod','PROD','emerald'],['uat','UAT','amber'],['dev','DEV','violet']].map(([k, label, tone]) => (
              <button key={k} className={'chip ws-env-chip' + (env === k ? ' active' : '')} onClick={() => setEnv(k)}>
                <span className={'ws-env-dot tone-' + tone + '-solid'}/>
                {label}<span className="count">{envCounts[k]}</span>
              </button>
            ))}
            <button className={'chip ws-star-chip' + (starredOnly ? ' active' : '')} onClick={() => setStar(s => !s)}>
              <Icon name="star" size={12}/>Starred
            </button>
          </div>

          {/* Sort dropdown */}
          <div className="ws-sort-wrap">
            <button className={'ws-sort-btn' + (sortOpen ? ' open' : '')} onClick={() => { setSortOpen(o => !o); setCapOpen(false); }}>
              <Icon name="sort" size={12}/>
              <span>{selectedSort.label}</span>
              <Icon name="chevron-down" size={11}/>
            </button>
            {sortOpen && (
              <div className="ws-sort-pop" onClick={e => e.stopPropagation()}>
                {SORT_OPTIONS.map(o => (
                  <button key={o.key} className={'ws-sort-pop-row' + (sort === o.key ? ' active' : '')} onClick={() => { setSort(o.key); setSortOpen(false); }}>
                    <Icon name={o.icon} size={12}/>
                    <span>{o.label}</span>
                    {sort === o.key && <Icon name="check" size={12}/>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View toggle */}
          <div className="ws-view-toggle">
            <button className={'ws-view-btn' + (viewMode === 'tile' ? ' active' : '')} onClick={() => setViewMode('tile')} title="Tile view" aria-label="Tile view">
              <Icon name="grid" size={14}/>
            </button>
            <button className={'ws-view-btn' + (viewMode === 'list' ? ' active' : '')} onClick={() => setViewMode('list')} title="List view" aria-label="List view">
              <Icon name="list-rows" size={14}/>
            </button>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty" style={{ padding: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No workspaces match.</div>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Loosen the capacity, environment, sort, or search filter above.</div>
        </div>
      ) : viewMode === 'tile' ? (
        <div className="lp-grid-3">
          {items.map((w, i) => (
            <div key={w.id} className={'fade-in d' + ((i % 5) + 1)}>
              <WorkspaceCardV2 ws={w} capacity={capacities.find(c => c.id === w.capacityId)} onClick={() => onOpen(w.id)}/>
            </div>
          ))}
        </div>
      ) : (
        <WorkspaceListView items={items} capacities={capacities} onOpen={onOpen} onToggleStar={() => {}}/>
      )}
    </>
  );
}

function WorkspaceListView({ items, capacities, onOpen, onToggleStar }) {
  return (
    <div className="lp-card lp-card-flush fade-in">
      <div className="ws-list-head">
        <div></div>
        <div>Workspace</div>
        <div>Env</div>
        <div>Models</div>
        <div>Reports</div>
        <div>$/mo</div>
        <div>Capacity</div>
        <div>Scanned</div>
        <div></div>
      </div>
      {items.map(w => {
        const cap = capacities.find(c => c.id === w.capacityId);
        return (
          <button key={w.id} className="ws-list-row" onClick={() => onOpen(w.id)}>
            <button className={'ws-list-star' + (w.star ? ' on' : '')} onClick={e => { e.stopPropagation(); onToggleStar(w.id); }} aria-label="Star workspace">
              <Icon name="star" size={13}/>
            </button>
            <div className="ws-list-name">
              <span className="ws-list-name-icon" style={{
                background: `var(--modern-icon-bg-${w.iconTone})`,
                color:      `var(--modern-icon-fg-${w.iconTone})`,
              }}>
                <Icon name="folder" size={11}/>
              </span>
              {w.name}
            </div>
            <div><EnvBadge env={w.env}/></div>
            <div className="mono ws-list-num">{w.models}</div>
            <div className="mono ws-list-num">{w.reports}</div>
            <div className="mono ws-list-cost">${w.costPerMo >= 1000 ? (w.costPerMo / 1000).toFixed(1) + 'k' : w.costPerMo}</div>
            <div>{cap && <span className="badge badge-outline" style={{ fontSize: 10 }}>{cap.sku}</span>}</div>
            <div className="ws-list-scan">
              {w.scanCta
                ? <span className="ws-list-scan-cta"><Icon name="zap" size={11}/>Scan now</span>
                : <span className="mono muted">{w.scanned}</span>}
            </div>
            <Icon name="chevron-right" size={13} className="ws-list-arrow"/>
          </button>
        );
      })}
    </div>
  );
}

function HealthScoreCard({ health }) {
  const tone = health.score >= 75 ? 'emerald' : health.score >= 55 ? 'amber' : 'rose';
  return (
    <div className="lp-card lp-stat ws-health-card">
      <div className={'lp-stat-tile tone-' + tone}><Icon name="activity" size={20}/></div>
      <div className="lp-stat-body">
        <div className="lp-eyebrow">Health Score</div>
        <div className="lp-stat-value">{health.score}<span className="lp-stat-unit">/100</span></div>
        <div className="ws-health-sub">
          <span className="ws-health-pill" title={'FinOps weight ' + health.weights.finops + '%'}>
            <span className="ws-health-dot tone-sky-solid"/>FinOps <b className="mono">{health.finops}</b>
          </span>
          <span className="ws-health-pill" title={'Quality weight ' + health.weights.quality + '%'}>
            <span className="ws-health-dot tone-violet-solid"/>Quality <b className="mono">{health.quality}</b>
          </span>
          <span className="ws-health-pill" title={'Governance weight ' + health.weights.governance + '%'}>
            <span className="ws-health-dot tone-amber-solid"/>Gov <b className="mono">{health.governance}</b>
          </span>
        </div>
      </div>
    </div>
  );
}

function WorkspaceCardV2({ ws, capacity, onClick }) {
  return (
    <div className="ws-card" onClick={onClick}>
      <div className="ws-card-head">
        <div className="ws-card-icon" style={{
          background: `var(--modern-icon-bg-${ws.iconTone})`,
          color:      `var(--modern-icon-fg-${ws.iconTone})`,
        }}>
          <Icon name="folder" size={18}/>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="ws-card-title">{ws.name}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
            <EnvBadge env={ws.env}/>
            {ws.health != null && (
              <span className="ws-card-sub mono" style={{ fontSize: 11 }}>health {ws.health}</span>
            )}
            {capacity && (
              <span className="badge badge-outline" style={{ fontSize: 9.5, height: 18, padding: '0 6px' }}>{capacity.sku}</span>
            )}
          </div>
        </div>
        <button className={'ws-card-star' + (ws.star ? ' on' : '')} onClick={e => e.stopPropagation()}>
          <Icon name="star" size={16}/>
        </button>
      </div>
      <div className="ws-card-stats">
        <div className="ws-card-stat"><div className="k">{ws.models}</div><div className="l">Models</div></div>
        <div className="ws-card-stat"><div className="k">{ws.reports}</div><div className="l">Reports</div></div>
        <div className="ws-card-stat">
          <div className="k mono">${ws.costPerMo >= 1000 ? (ws.costPerMo / 1000).toFixed(1) + 'k' : ws.costPerMo}</div>
          <div className="l">$/mo</div>
        </div>
      </div>
      <div className="ws-card-footer">
        <span>scanned {ws.scanned}</span>
        {ws.scanCta
          ? <span className="arr">Scan now <Icon name="zap" size={12}/></span>
          : <span className="arr">Open <Icon name="arrow-right" size={12}/></span>}
      </div>
    </div>
  );
}

export function WorkspaceDetail({ wsId, onOpenModel, onBack }) {
  const detail = DATA.workspaceDetail[wsId] || {
    name: DATA.workspaces.items.find(w => w.id === wsId)?.name || 'Workspace',
    env: DATA.workspaces.items.find(w => w.id === wsId)?.env || 'DEV',
    subtitle: 'This workspace has not been scanned yet.',
    models: [],
  };

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={onBack}>
              <Icon name="chevron-right" size={14} strokeWidth={2.5}/> <span style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>—</span>
              <span style={{ transform: 'none' }}>Back to workspaces</span>
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 className="lp-page-title" style={{ margin: 0 }}>{detail.name}</h1>
            <EnvBadge env={detail.env}/>
          </div>
          <p className="lp-page-sub">{detail.subtitle}</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="refresh" size={14}/>Rescan workspace</button>
          <button className="btn btn-sm"><Icon name="external" size={14}/>Open in Fabric</button>
        </div>
      </div>

      <div className="lp-grid-4 fade-in d2">
        <StatCard label="Models"       value={detail.models.length}                    icon="database" tone="violet"/>
        <StatCard label="Scanned"      value={detail.models.filter(m => m.score).length} unit={'/' + detail.models.length} icon="shield-check" tone="emerald"/>
        <StatCard label="Avg Score"    value={(detail.models.filter(m => m.score).reduce((a, m) => a + m.score, 0) / Math.max(1, detail.models.filter(m => m.score).length)).toFixed(1)} unit="/10" icon="activity" tone="sky"/>
        <StatCard label="Measures"     value={detail.models.reduce((a, m) => a + m.measures, 0)} icon="bar-chart" tone="amber"/>
      </div>

      <div className="lp-section-head">
        <h2>Models <span className="count">{detail.models.length} total</span></h2>
        <div className="lp-search" style={{ width: 260 }}>
          <Icon name="search" size={14}/>
          <input placeholder="Search models…"/>
        </div>
      </div>

      <div className="lp-card lp-card-flush">
        <table className="lp-table">
          <thead>
            <tr>
              <th>Model</th>
              <th style={{ width: 100 }}>Tables</th>
              <th style={{ width: 110 }}>Measures</th>
              <th style={{ width: 140 }}>Quality</th>
              <th style={{ width: 140 }}>Last scanned</th>
              <th style={{ width: 120 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {detail.models.map(m => (
              <tr key={m.id} onClick={() => m.score && onOpenModel(wsId, m.id)}>
                <td>
                  <div className="name">
                    <span style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--modern-icon-bg-violet)', color: 'var(--modern-icon-fg-violet)', display: 'grid', placeItems: 'center' }}>
                      <Icon name="database" size={14}/>
                    </span>
                    {m.name}
                  </div>
                </td>
                <td className="num muted">{m.tables}</td>
                <td className="num muted">{m.measures}</td>
                <td>
                  {m.score
                    ? <ScoreBar score={m.score} tone={m.tone}/>
                    : <span className="muted" style={{ fontSize: 12 }}>—</span>}
                </td>
                <td className="muted num" style={{ fontSize: 12 }}>{m.scanned}</td>
                <td>
                  {m.score
                    ? <span className="btn btn-outline btn-sm">Open <Icon name="arrow-right" size={12}/></span>
                    : <span className="btn btn-sm"><Icon name="zap" size={12}/>Scan</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function ScoreBar({ score, tone = 'emerald' }) {
  const color = {
    emerald: 'oklch(0.58 0.15 150)',
    amber:   'oklch(0.66 0.16 62)',
    rose:    'oklch(0.60 0.20 20)',
  }[tone] || 'oklch(0.58 0.15 150)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--muted)' }}>
        <div style={{ width: `${score * 10}%`, height: '100%', borderRadius: 999, background: color }}/>
      </div>
      <span className="num" style={{ fontSize: 12, fontWeight: 600 }}>{score.toFixed(1)}</span>
    </div>
  );
}
