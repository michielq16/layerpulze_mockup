import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { Badge } from './components';

export function ModelDiagram() {
  const [sub, setSub] = React.useState('data-model');
  const [zoom, setZoom] = React.useState(1);
  const [selected, setSelected] = React.useState(null);

  const d = DATA.modelExtras.diagram;
  const W = 1080, H = 520;

  const posById = Object.fromEntries(d.tables.map(t => [t.id, t]));
  const tableH = (t) => 34 + t.cols.length * 18 + 8;
  const tableW = 170;

  return (
    <>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
        <span className="seg-tabs">
          {[['data-model','Data Model'],['query-flow','Query Flow']].map(([k,l]) => (
            <button key={k} className={'seg-tab' + (sub === k ? ' active' : '')} onClick={() => setSub(k)}>{l}</button>
          ))}
        </span>
        {sub === 'data-model' && (
          <span className="lp-eyebrow">
            {d.tables.filter(t => t.kind === 'fact').length} facts · {d.tables.filter(t => t.kind === 'dim').length} dimensions · {d.rels.length} relationships
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setZoom(z => Math.max(0.6, z - 0.1))}>−</button>
          <span className="mono" style={{ fontSize: 11, alignSelf: 'center', color: 'var(--muted-foreground)' }}>{Math.round(zoom * 100)}%</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setZoom(z => Math.min(1.4, z + 0.1))}>+</button>
          <button className="btn btn-outline btn-sm"><Icon name="external" size={12}/>Export PNG</button>
        </div>
      </div>

      {sub === 'data-model' && (
        <div className="lp-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="diagram-legend">
            <span className="lg"><span className="sw fact"/>Fact</span>
            <span className="lg"><span className="sw dim"/>Dimension</span>
            <span className="lg"><span className="sw measure"/>Measures</span>
            <span className="lg"><span className="rel active"/>Active</span>
            <span className="lg"><span className="rel inactive"/>Inactive</span>
          </div>
          <div className="diagram-canvas">
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="560" style={{ transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
              <defs>
                <pattern id="diag-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.8" fill="oklch(0.85 0.005 250)"/>
                </pattern>
                <marker id="arrow-act" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M0 0 L10 5 L0 10 z" fill="oklch(0.69 0.17 237)"/>
                </marker>
                <marker id="arrow-inact" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M0 0 L10 5 L0 10 z" fill="oklch(0.70 0.02 250)"/>
                </marker>
              </defs>
              <rect width={W} height={H} fill="url(#diag-grid)"/>

              {d.rels.map((r, i) => {
                const A = posById[r.from], B = posById[r.to];
                const ax = A.x + tableW, ay = A.y + tableH(A) / 2;
                const bx = B.x,          by = B.y + tableH(B) / 2;
                const mid = (ax + bx) / 2;
                const isHit = selected && (selected === r.from || selected === r.to);
                return (
                  <path key={i}
                    d={`M ${ax} ${ay} C ${mid} ${ay}, ${mid} ${by}, ${bx} ${by}`}
                    stroke={r.kind === 'active' ? 'oklch(0.69 0.17 237)' : 'oklch(0.70 0.02 250)'}
                    strokeWidth={isHit ? 2.4 : 1.6}
                    strokeDasharray={r.kind === 'inactive' ? '4 3' : 'none'}
                    fill="none"
                    markerEnd={`url(#${r.kind === 'active' ? 'arrow-act' : 'arrow-inact'})`}
                    opacity={selected && !isHit ? 0.3 : 1}
                  />
                );
              })}

              {d.tables.map(t => {
                const h = tableH(t);
                const isSel = selected === t.id;
                return (
                  <g key={t.id} transform={`translate(${t.x} ${t.y})`} onClick={() => setSelected(s => s === t.id ? null : t.id)} style={{ cursor: 'pointer' }}>
                    <rect x="0" y="0" width={tableW} height={h} rx="8" ry="8"
                      fill="var(--card)"
                      stroke={isSel ? 'oklch(0.69 0.17 237)' : 'oklch(0.88 0.005 250)'}
                      strokeWidth={isSel ? 2 : 1}
                      filter="drop-shadow(0 2px 4px rgba(15, 23, 42, 0.06))"
                    />
                    <rect x="0" y="0" width={tableW} height="28" rx="8" ry="8"
                      fill={t.kind === 'fact' ? 'oklch(0.94 0.06 255)' : t.kind === 'dim' ? 'oklch(0.94 0.05 150)' : 'oklch(0.94 0.05 45)'}
                    />
                    <rect x="0" y="20" width={tableW} height="8"
                      fill={t.kind === 'fact' ? 'oklch(0.94 0.06 255)' : t.kind === 'dim' ? 'oklch(0.94 0.05 150)' : 'oklch(0.94 0.05 45)'}
                    />
                    <circle cx="14" cy="14" r="4"
                      fill={t.kind === 'fact' ? 'oklch(0.45 0.12 255)' : t.kind === 'dim' ? 'oklch(0.40 0.14 150)' : 'oklch(0.50 0.15 45)'}
                    />
                    <text x="26" y="18" fontSize="12" fontWeight="600" fill="var(--foreground)" fontFamily="DM Sans">{t.name}</text>
                    <text x={tableW - 10} y="18" textAnchor="end" fontSize="10" fontFamily="JetBrains Mono" fill="var(--muted-foreground)">{t.cols.length}</text>
                    {t.cols.map((c, i) => (
                      <g key={c}>
                        <text x="14" y={46 + i * 18} fontSize="11" fill="var(--foreground)" fontFamily="JetBrains Mono">{c}</text>
                        {i === 0 && <circle cx={tableW - 14} cy={42 + i * 18} r="3" fill="oklch(0.55 0.18 60)"/>}
                      </g>
                    ))}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {sub === 'query-flow' && <QueryFlow/>}
    </>
  );
}

function QueryFlow() {
  const steps = [
    { kind: 'source',  name: 'SQL Server',           detail: 'srv-eu.sql.azure.com · FactSales',    tone: 'sky' },
    { kind: 'native',  name: 'Native query',         detail: 'SELECT * FROM dbo.FactSales WHERE ...',tone: 'violet' },
    { kind: 'filter',  name: 'Filter rows',          detail: 'Year ≥ 2022',                          tone: 'emerald' },
    { kind: 'merge',   name: 'Merge queries',        detail: 'LEFT JOIN DimProduct',                 tone: 'amber' },
    { kind: 'typed',   name: 'Change type',          detail: '14 columns typed',                    tone: 'emerald' },
    { kind: 'load',    name: 'Load → FactSales',     detail: '3.2M rows · import mode',             tone: 'rose' },
  ];
  return (
    <div className="lp-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="diagram-legend">
        <span className="lg"><span className="sw fact"/>Source</span>
        <span className="lg"><span className="sw dim"/>Transform</span>
        <span className="lg"><span className="sw measure"/>Load</span>
        <span style={{ marginLeft: 'auto' }} className="lp-eyebrow">14 source type patterns supported</span>
      </div>
      <div style={{ padding: '30px 24px', overflowX: 'auto' }}>
        <div className="query-flow-row">
          {steps.map((s, i) => (
            <React.Fragment key={s.name}>
              <div className="qf-node" style={{
                background: `var(--modern-icon-bg-${s.tone})`,
                borderColor: `var(--modern-icon-fg-${s.tone})`,
              }}>
                <div className="qf-node-kind mono">{s.kind}</div>
                <div className="qf-node-name">{s.name}</div>
                <div className="qf-node-detail mono">{s.detail}</div>
              </div>
              {i < steps.length - 1 && (
                <svg className="qf-arrow" width="42" height="44" viewBox="0 0 42 44">
                  <path d="M 0 22 L 36 22" stroke="oklch(0.75 0.02 250)" strokeWidth="1.6" strokeDasharray="3 3"/>
                  <path d="M 32 16 L 40 22 L 32 28" fill="none" stroke="oklch(0.55 0.02 250)" strokeWidth="1.6"/>
                </svg>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Documentation tab — aligned with the C2d /documents Generate flow.
   - 4 audience preset cards (Auditor · Analyst · Executive · Engineer)
   - Versions list filtered to THIS model (from DATA.documents.items)
   - Rows + View buttons + audience cards all open DocumentPreviewModal */

import { DocumentPreviewModal, AUDIENCE_LABELS } from './NewPages';

export function ModelDocs({ modelName, workspace, env = 'PROD' }) {
  const audiences = ['auditor', 'analyst', 'executive', 'engineer'];
  const versions = DATA.documents.items.filter(d => d.model === modelName);
  const audiencesGenerated = new Set(versions.map(v => v.audience));
  const [preview, setPreview] = React.useState(null);

  const openPreview = (cfg) => setPreview(cfg);
  const openForAudience = (audience) => {
    const existing = versions.find(v => v.audience === audience);
    if (existing) {
      setPreview({
        model: modelName, ws: workspace, env,
        audience: existing.audience, format: existing.format,
        includeLogo: true,
        generatedAt: existing.updatedAbs,
        status: existing.status,
        fromLibrary: true,
      });
    } else {
      // Generate-style preview (no existing version yet)
      setPreview({
        model: modelName, ws: workspace, env,
        audience, format: 'docx',
        includeLogo: true,
        generatedAt: 'just now · preview',
        fromGenerate: true,
      });
    }
  };

  return (
    <>
      <div className="lp-page-head" style={{ marginBottom: 18 }}>
        <div className="fade-in">
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>Documentation</h2>
          <p className="lp-page-sub" style={{ margin: '4px 0 0' }}>{versions.length} version{versions.length === 1 ? '' : 's'} on file · click a preset to render · click any version to preview</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="refresh" size={14}/>Regenerate all</button>
          <button className="btn btn-sm doc-gen-cta"><Icon name="wand" size={14}/>Generate</button>
        </div>
      </div>

      {/* 4 audience presets (mirrors /documents Generate tab step 2) */}
      <div className="model-docs-presets fade-in d2">
        {audiences.map(a => {
          const meta = AUDIENCE_LABELS[a];
          const hasVersion = audiencesGenerated.has(a);
          return (
            <button
              key={a}
              className={'model-docs-preset model-docs-preset-' + meta.tone}
              onClick={() => openForAudience(a)}
            >
              <div className={'doc-aud-pill doc-aud-pill-' + meta.tone}>{meta.label}</div>
              <div className="model-docs-preset-sub">{meta.sub}</div>
              <div className="model-docs-preset-foot">
                {hasVersion ? (
                  <><Icon name="check" size={11}/><span>On file · click to preview</span></>
                ) : (
                  <><Icon name="wand" size={11}/><span>Not yet generated · click to render</span></>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="lp-section-head" style={{ marginTop: 22 }}>
        <h2>Versions <span className="count">{versions.length}</span></h2>
        <span className="lp-eyebrow">Joins models · measures · DAX · lineage · governance · ownership</span>
      </div>

      <div className="doc-list fade-in d3">
        {versions.length === 0 && (
          <div className="empty" style={{ padding: 28 }}>
            No documents generated yet for <b>{modelName}</b>. Click an audience preset above to render the first one.
          </div>
        )}
        {versions.map(it => {
          const audMeta = AUDIENCE_LABELS[it.audience] || { label: it.audience, tone: 'slate' };
          const handleOpen = (e) => {
            e?.stopPropagation();
            openPreview({
              model: it.model, ws: it.ws, env: env,
              audience: it.audience, format: it.format,
              includeLogo: true,
              generatedAt: it.updatedAbs,
              status: it.status,
              fromLibrary: true,
            });
          };
          return (
            <div
              key={it.id}
              className={'doc-row doc-row-click' + (it.status === 'outdated' ? ' doc-row-outdated' : '')}
              onClick={handleOpen}
              role="button" tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpen(e); } }}
            >
              <div className="doc-icon" style={{
                background: `var(--modern-icon-bg-${it.tone})`,
                color:      `var(--modern-icon-fg-${it.tone})`,
              }}>
                <Icon name="file-text" size={18}/>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="doc-title">
                  {it.model}
                  <span className={'doc-aud-pill doc-aud-pill-' + audMeta.tone}>{audMeta.label}</span>
                  <span className={'doc-status ' + it.status}>
                    <span className="dot"/>{it.status === 'current' ? 'Current' : 'Outdated'}
                  </span>
                </div>
                <div className="doc-meta">
                  <span className="mono doc-format">{it.format.toUpperCase()}</span>
                  <span className="sep">·</span>
                  <span title={it.updatedAbs}>updated {it.updated}</span>
                  <span className="sep">·</span>
                  <span className="mono">{it.size}</span>
                </div>
              </div>
              <div className="doc-actions" onClick={e => e.stopPropagation()}>
                <button className="btn btn-ghost btn-sm" title="View" onClick={handleOpen}><Icon name="external" size={14}/></button>
                <button className="btn btn-ghost btn-sm" title="Regenerate"><Icon name="refresh" size={14}/></button>
                <button className="btn btn-outline btn-sm" onClick={handleOpen}><Icon name="arrow-down" size={12}/>Download</button>
              </div>
            </div>
          );
        })}
      </div>

      {preview && (
        <DocumentPreviewModal
          {...preview}
          onClose={() => setPreview(null)}
          onCommit={() => setPreview(null)}
        />
      )}
    </>
  );
}

export function ModelAI() {
  const items = DATA.modelExtras.ai;
  return (
    <>
      <div className="lp-page-head" style={{ marginBottom: 18 }}>
        <div className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="ai-hero-mark"><Icon name="wand" size={20}/></div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>AI Advisory</h2>
            <p className="lp-page-sub" style={{ margin: '4px 0 0' }}>Best-practice recommendations from our advisory engine.</p>
          </div>
        </div>
      </div>

      <div className="lp-grid-3 fade-in d2">
        {[
          { t: 'DAX Analysis',           sub: 'Patterns, anti-patterns, perf',   icon: 'zap',          tone: 'sky' },
          { t: 'Power Query Review',     sub: 'Folding, sources, transforms',    icon: 'git-branch',   tone: 'amber' },
          { t: 'Data Model Assessment',  sub: 'Relationships, cardinality',      icon: 'database',     tone: 'violet' },
        ].map(a => (
          <button key={a.t} className="ai-run-card">
            <span className="ai-run-icon" style={{
              background: `var(--modern-icon-bg-${a.tone})`,
              color:      `var(--modern-icon-fg-${a.tone})`,
            }}><Icon name={a.icon} size={18}/></span>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div className="ai-run-title">{a.t}</div>
              <div className="ai-run-sub">{a.sub}</div>
            </div>
            <span className="ai-run-cta"><Icon name="arrow-right" size={14}/></span>
          </button>
        ))}
      </div>

      <div className="lp-section-head">
        <h2>Previous analyses <span className="count">{items.length}</span></h2>
        <span className="lp-eyebrow">Ran today</span>
      </div>

      <div className="lp-card lp-card-flush fade-in d3">
        {items.map(a => (
          <div key={a.id} className="ai-row">
            <div className="ai-row-icon" style={{
              background: `var(--modern-icon-bg-${a.tone})`,
              color:      `var(--modern-icon-fg-${a.tone})`,
            }}>
              <Icon name="wand" size={16}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ai-row-title">{a.name}</div>
              <div className="ai-row-summary">{a.summary}</div>
            </div>
            <div className="ai-row-sev">
              {a.critical > 0 && <span className="sev-pill crit"><span className="d"/>{a.critical}</span>}
              {a.warning  > 0 && <span className="sev-pill warn"><span className="d"/>{a.warning}</span>}
              {a.info     > 0 && <span className="sev-pill info"><span className="d"/>{a.info}</span>}
            </div>
            <div className="ai-row-time mono">{a.at}</div>
            <button className="btn btn-outline btn-sm">Open</button>
          </div>
        ))}
      </div>
    </>
  );
}

export function ModelHealth() {
  const h = DATA.modelExtras.health;

  return (
    <>
      <div className="lp-page-head" style={{ marginBottom: 18 }}>
        <div className="fade-in">
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>Model Health</h2>
          <p className="lp-page-sub" style={{ margin: '4px 0 0' }}>Unused objects, duplicate DAX, potential savings — what you can safely remove.</p>
        </div>
      </div>

      <div className="lp-section-head">
        <h2>Unused objects <span className="count">{h.unused.measures.unused + h.unused.columns.unused} unused</span></h2>
      </div>

      <div className="lp-grid-2 fade-in">
        <div className="lp-card">
          <div className="lp-card-header">
            <div>
              <div className="lp-card-title">Measures</div>
              <div className="lp-card-sub">{h.unused.measures.used}/{h.unused.measures.total} used · {Math.round(h.unused.measures.used / h.unused.measures.total * 100)}% coverage</div>
            </div>
            <span className="mono" style={{ fontSize: 22, fontWeight: 600 }}>{h.unused.measures.unused}</span>
          </div>
          <UsageBar used={h.unused.measures.used} total={h.unused.measures.total} tone="emerald"/>
          <div style={{ marginTop: 14 }}>
            <div className="lp-eyebrow" style={{ marginBottom: 6 }}>Top unused measures</div>
            {h.unused.measuresList.map(m => (
              <div key={m.name} className="h-row">
                <Icon name="bar-chart" size={12}/>
                <span className="h-row-name">{m.name}</span>
                <span className="badge badge-outline">{m.table}</span>
                <span className="h-row-ago">last used {m.ago}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="lp-card">
          <div className="lp-card-header">
            <div>
              <div className="lp-card-title">Columns</div>
              <div className="lp-card-sub">{h.unused.columns.used}/{h.unused.columns.total} used · {Math.round(h.unused.columns.used / h.unused.columns.total * 100)}% coverage</div>
            </div>
            <span className="mono" style={{ fontSize: 22, fontWeight: 600 }}>{h.unused.columns.unused}</span>
          </div>
          <UsageBar used={h.unused.columns.used} total={h.unused.columns.total} tone="amber"/>
          <div style={{ marginTop: 14 }}>
            <div className="lp-eyebrow" style={{ marginBottom: 6 }}>Top unused columns</div>
            {h.unused.columnsList.map(c => (
              <div key={c.name} className="h-row">
                <Icon name="layers" size={12}/>
                <span className="h-row-name">{c.name}</span>
                <span className="badge badge-outline">{c.table}</span>
                <span className="h-row-ago">last used {c.ago}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lp-section-head">
        <h2>Duplicate DAX <span className="count">{h.duplicates.filter(d => d.kind === 'exact').length} exact · {h.duplicates.filter(d => d.kind === 'similar').length} similar</span></h2>
      </div>

      <div className="lp-card lp-card-flush fade-in d2">
        <table className="lp-table">
          <thead>
            <tr><th>Measure</th><th>Matches</th><th style={{ width: 120 }}>Similarity</th><th style={{ width: 100 }}>Action</th></tr>
          </thead>
          <tbody>
            {h.duplicates.map((d, i) => (
              <tr key={i}>
                <td><div className="name"><Icon name="bar-chart" size={12}/>{d.a}</div></td>
                <td className="muted">{d.b}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 5, borderRadius: 999, background: 'var(--muted)' }}>
                      <div style={{ width: d.similarity + '%', height: '100%', borderRadius: 999, background: d.kind === 'exact' ? 'oklch(0.55 0.22 25)' : 'oklch(0.65 0.18 45)' }}/>
                    </div>
                    <span className="mono" style={{ fontSize: 11, fontWeight: 600 }}>{d.similarity}%</span>
                  </div>
                </td>
                <td><button className="btn btn-outline btn-sm">Consolidate</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lp-section-head">
        <h2>Potential savings <span className="count">{h.savings.reduction}% reduction possible</span></h2>
      </div>

      <div className="lp-grid-money fade-in d3">
        <div className="lp-card savings-hero">
          <div className="savings-hero-num mono">{h.savings.reduction}%</div>
          <div className="savings-hero-label">complexity reduction if you clean up</div>
          <div className="savings-stats">
            <div><div className="k mono">{h.savings.removable}</div><div className="l">removable</div></div>
            <div><div className="k mono">{h.savings.measures}</div><div className="l">measures</div></div>
            <div><div className="k mono">{h.savings.columns}</div><div className="l">columns</div></div>
            <div><div className="k mono">{h.savings.dupes}</div><div className="l">dupes to merge</div></div>
          </div>
        </div>
        <div className="lp-card">
          <div className="lp-card-header">
            <div>
              <div className="lp-card-title">Top cleanup candidates</div>
              <div className="lp-card-sub">Confidence based on 30-day usage</div>
            </div>
            <button className="btn btn-outline btn-sm">Export list</button>
          </div>
          <table className="lp-table" style={{ marginTop: 4 }}>
            <tbody>
              {h.savings.candidates.map(c => (
                <tr key={c.name}>
                  <td><div className="name"><Icon name={c.kind === 'measure' ? 'bar-chart' : 'layers'} size={12}/>{c.name}</div></td>
                  <td><Badge tone="outline">{c.kind}</Badge></td>
                  <td><span className={'conf conf-' + c.confidence.toLowerCase()}>{c.confidence}</span></td>
                  <td className="muted" style={{ fontSize: 12 }}>{c.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function UsageBar({ used, total, tone }) {
  const pct = (used / total) * 100;
  const color = { emerald: 'oklch(0.58 0.15 150)', amber: 'oklch(0.65 0.18 45)', sky: 'oklch(0.69 0.17 237)' }[tone] || 'oklch(0.58 0.15 150)';
  return (
    <div style={{ display: 'flex', height: 10, borderRadius: 999, background: 'var(--muted)', overflow: 'hidden' }}>
      <div style={{ width: pct + '%', background: color, transition: 'width .3s' }}/>
    </div>
  );
}

export function ModelReports() {
  const r = DATA.modelExtras.reports;
  const [selected, setSelected] = React.useState(r.pages[0].id);
  const page = r.pages.find(p => p.id === selected);

  return (
    <>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18 }}>
        <span className="seg-tabs">
          <button className="seg-tab active">Page Viewer</button>
          <button className="seg-tab">Intelligence</button>
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="external" size={12}/>Export pages</button>
          <button className="btn btn-sm"><Icon name="external" size={12}/>Open in Power BI</button>
        </div>
      </div>

      <div className="lp-grid-money fade-in">
        <div className="lp-card">
          <div className="lp-card-header">
            <div>
              <div className="lp-card-title">Report coverage</div>
              <div className="lp-card-sub">What the report pages actually use</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
            <CoverageRow label="Measures" used={r.coverage.measures} total={r.coverage.measuresTotal} tone="sky"/>
            <CoverageRow label="Columns"  used={r.coverage.columns}  total={r.coverage.columnsTotal}  tone="violet"/>
          </div>
          <div className="coverage-callout">
            <Icon name="info" size={14}/>
            <div>
              <b>{r.coverage.measuresTotal - r.coverage.measures}</b> measures and <b>{r.coverage.columnsTotal - r.coverage.columns}</b> columns aren't used in any report.
              Consider hiding unused items to simplify the explore experience.
            </div>
          </div>
        </div>
        <div className="lp-card">
          <div className="lp-card-header">
            <div>
              <div className="lp-card-title">Report pages</div>
              <div className="lp-card-sub">{r.pages.filter(p => !p.hidden).length} visible · {r.pages.filter(p => p.hidden).length} hidden</div>
            </div>
          </div>
          <div className="report-thumbs">
            {r.pages.map(p => (
              <button key={p.id} className={'report-thumb' + (selected === p.id ? ' active' : '') + (p.hidden ? ' hidden' : '')} onClick={() => setSelected(p.id)}>
                <ReportThumb seed={p.thumbSeed}/>
                <div className="report-thumb-body">
                  <div className="report-thumb-title">{p.name}</div>
                  <div className="report-thumb-meta">{p.visuals} visuals · {p.measures} measures</div>
                </div>
                {p.hidden && <span className="report-thumb-hidden">hidden</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {page && (
        <>
          <div className="lp-section-head"><h2>{page.name} <span className="count">{page.visuals} visuals</span></h2></div>
          <div className="lp-card fade-in d2">
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 18 }}>
              <div className="report-preview-large">
                <ReportThumb seed={page.thumbSeed} large/>
              </div>
              <div>
                <div className="lp-eyebrow">Used in this page</div>
                <div className="report-use-grid">
                  <div>
                    <div className="report-use-k mono">{page.measures}</div>
                    <div className="report-use-l">measures</div>
                  </div>
                  <div>
                    <div className="report-use-k mono">{page.cols}</div>
                    <div className="report-use-l">columns</div>
                  </div>
                  <div>
                    <div className="report-use-k mono">{page.visuals}</div>
                    <div className="report-use-l">visuals</div>
                  </div>
                </div>
                <div className="lp-eyebrow" style={{ marginTop: 14 }}>Visual inventory</div>
                <div className="report-visuals">
                  {['Bar chart','Line chart','KPI card','Table','Slicer','Matrix'].slice(0, Math.min(6, page.visuals)).map((v, i) => (
                    <div key={i} className="report-vis-row">
                      <Icon name="bar-chart" size={12}/>
                      <span>{v}</span>
                      <span className="mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--muted-foreground)' }}>{Math.floor(Math.random() * 3) + 1} fields</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function CoverageRow({ label, used, total, tone }) {
  const pct = (used / total) * 100;
  const color = { sky: 'oklch(0.69 0.17 237)', violet: 'oklch(0.62 0.16 275)' }[tone];
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'baseline' }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
        <span className="mono" style={{ fontSize: 12 }}>
          <b>{used}</b> / {total} <span style={{ color: 'var(--muted-foreground)' }}>({Math.round(pct)}%)</span>
        </span>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: 'var(--muted)' }}>
        <div style={{ width: pct + '%', height: '100%', borderRadius: 999, background: color }}/>
      </div>
    </div>
  );
}

const RC_TYPE_BG = { Source: 'var(--modern-icon-bg-sky)', Lakehouse: 'var(--modern-icon-bg-sky)', Warehouse: 'var(--modern-icon-bg-violet)', Notebook: 'var(--modern-icon-bg-violet)', Pipeline: 'var(--modern-icon-bg-emerald)', Semantic: 'var(--modern-icon-bg-amber)' };
const RC_TYPE_FG = { Source: 'var(--modern-icon-fg-sky)', Lakehouse: 'var(--modern-icon-fg-sky)', Warehouse: 'var(--modern-icon-fg-violet)', Notebook: 'var(--modern-icon-fg-violet)', Pipeline: 'var(--modern-icon-fg-emerald)', Semantic: 'var(--modern-icon-fg-amber)' };

export function ModelDataflows() {
  const chain = DATA.modelExtras.refreshChain;
  const [selected, setSelected] = React.useState('pipe-1');

  const DAYS = 14;
  const dayLabels = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (DAYS - 1 - i));
    return d.toLocaleDateString('en', { month: 'numeric', day: 'numeric' });
  });

  const selItem = chain.find(c => c.id === selected);
  const failingItems = chain.filter(it => it.runs.some(r => !r.ok));
  const mostFailing = chain.reduce((worst, it) => {
    const n = it.runs.filter(r => !r.ok).length;
    return n > (worst ? worst.runs.filter(r => !r.ok).length : 0) ? it : worst;
  }, null);

  const totalFails = chain.find(c => c.id === 'sm-1')?.runs.filter(r => !r.ok).length ?? 0;

  return (
    <>
      <div className="lp-page-head" style={{ marginBottom: 18 }}>
        <div className="fade-in">
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>Refresh Chain</h2>
          <p className="lp-page-sub" style={{ margin: '4px 0 0' }}>
            14-day run history for Sales Analytics and every upstream source — find the layer breaking the chain.
          </p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="refresh" size={14}/>Trigger refresh</button>
        </div>
      </div>

      {mostFailing && mostFailing.runs.filter(r => !r.ok).length > 3 && (
        <div className="df-alert fade-in" style={{ marginBottom: 16, alignItems: 'flex-start' }}>
          <Icon name="alert" size={14} style={{ marginTop: 2, flexShrink: 0 }}/>
          <div style={{ flex: 1 }}>
            <b>Cascade failure detected</b> — <b>{mostFailing.label}</b> ({mostFailing.type} · {mostFailing.layer}) has{' '}
            {mostFailing.runs.filter(r => !r.ok).length} of {DAYS} runs failing in 14 days
            ({Math.round(mostFailing.runs.filter(r => !r.ok).length / DAYS * 100)}% failure rate).
            This propagates downstream: <b>Sales Analytics</b> missed {totalFails} scheduled refreshes.
          </div>
          <button className="btn btn-sm" style={{ flexShrink: 0 }}><Icon name="external" size={12}/>Investigate</button>
        </div>
      )}

      <div className="lp-card lp-card-flush fade-in d2" style={{ overflowX: 'auto' }}>
        <div className="rc-header">
          <div className="rc-label-col"/>
          {dayLabels.map((d, i) => (
            <div key={i} className="rc-day-head">{i === DAYS - 1 ? 'Today' : d}</div>
          ))}
          <div className="rc-rate-col">Rate</div>
        </div>

        {chain.map((item) => {
          const failCount = item.runs.filter(r => !r.ok).length;
          const rate = Math.round((DAYS - failCount) / DAYS * 100);
          const isSel = selected === item.id;
          const isModel = item.id === 'sm-1';
          return (
            <div key={item.id} className={'rc-row' + (isSel ? ' active' : '') + (isModel ? ' rc-row-model' : '')}
              onClick={() => setSelected(item.id)}>
              <div className="rc-label-col">
                <div className="rc-node-icon" style={{ background: RC_TYPE_BG[item.type], color: RC_TYPE_FG[item.type] }}>
                  <Icon name={item.icon} size={13}/>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="rc-node-name">{item.label}</div>
                  <div className="rc-node-meta">
                    <span className="badge badge-outline" style={{ fontSize: 9, height: 15, padding: '0 4px' }}>{item.layer}</span>
                    <span className="muted" style={{ fontSize: 11 }}>{item.schedule}</span>
                  </div>
                </div>
              </div>
              {item.runs.map((run, i) => (
                <div key={i} className="rc-cell">
                  <div className={'rc-dot' + (run.ok ? ' ok' : ' fail')} title={run.ok ? `Day −${DAYS - 1 - i}: OK` : `Day −${DAYS - 1 - i}: FAILED`}/>
                  {isModel && !run.ok && <div className="rc-cascade-marker"/>}
                </div>
              ))}
              <div className="rc-rate-col">
                <span className={'mono ' + (rate < 70 ? 'val-rose' : rate < 90 ? 'val-amber' : 'val-emerald')}
                  style={{ fontSize: 12, fontWeight: 700 }}>
                  {rate}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 16, padding: '8px 2px', fontSize: 12, color: 'var(--muted-foreground)' }}>
        <span className="rc-legend-item"><span className="rc-dot ok"/>Success</span>
        <span className="rc-legend-item"><span className="rc-dot fail"/>Failed</span>
        <span className="rc-legend-item">Click row to inspect · highlighted = selected item</span>
      </div>

      {selItem && (
        <div className="lp-card fade-in d2" style={{ marginTop: 4 }}>
          <div className="lp-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="rc-node-icon" style={{ width: 36, height: 36, borderRadius: 8, background: RC_TYPE_BG[selItem.type], color: RC_TYPE_FG[selItem.type] }}>
                <Icon name={selItem.icon} size={16}/>
              </div>
              <div>
                <div className="lp-card-title">{selItem.label}</div>
                <div className="lp-card-sub">{selItem.type} · {selItem.layer} · {selItem.schedule}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {selItem.runs.filter(r => !r.ok).length > 0 && (
                <span className="badge tone-rose-soft">{selItem.runs.filter(r => !r.ok).length} failures / 14d</span>
              )}
              <span className="badge badge-outline">{selItem.type}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderTop: '1px solid var(--border)' }}>
            {[
              { l: 'Runs (14d)',    v: selItem.runs.length },
              { l: 'Failures',     v: selItem.runs.filter(r => !r.ok).length, rose: selItem.runs.filter(r => !r.ok).length > 0 },
              { l: 'Success rate', v: Math.round(selItem.runs.filter(r => r.ok).length / selItem.runs.length * 100) + '%' },
              { l: 'Schedule',     v: selItem.schedule },
            ].map((s, i) => (
              <div key={s.l} style={{ textAlign: 'center', padding: '14px 10px', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
                <div className={'mono ' + (s.rose ? 'val-rose' : '')} style={{ fontSize: 20, fontWeight: 700 }}>{s.v}</div>
                <div className="lp-eyebrow" style={{ marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn btn-outline btn-sm"><Icon name="refresh" size={12}/>Trigger run</button>
            <button className="btn btn-outline btn-sm"><Icon name="external" size={12}/>View in Fabric</button>
            {selItem.runs.filter(r => !r.ok).length > 0 && (
              <button className="btn btn-sm"><Icon name="alert" size={12}/>View failures</button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ReportThumb({ seed, large }) {
  const h = large ? 340 : 88;
  const w = large ? 560 : 150;
  const seeded = (s) => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash) + s.charCodeAt(i) | 0;
    return (Math.abs(hash) % 100) / 100;
  };
  const r = seeded(seed);
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ borderRadius: 6, background: 'oklch(0.97 0.005 250)', display: 'block' }}>
      <rect x={w*0.04} y={h*0.05} width={w*0.92} height={h*0.08} rx="2" fill="oklch(0.93 0.005 250)"/>
      <rect x={w*0.04} y={h*0.2} width={w*0.28} height={h*0.2} rx="2" fill="oklch(0.93 0.06 255)"/>
      <rect x={w*0.36} y={h*0.2} width={w*0.28} height={h*0.2} rx="2" fill="oklch(0.94 0.05 150)"/>
      <rect x={w*0.68} y={h*0.2} width={w*0.28} height={h*0.2} rx="2" fill="oklch(0.94 0.05 45)"/>
      {[0,1,2,3,4,5,6].map(i => (
        <rect key={i} x={w*(0.04 + i*0.042)} y={h*(0.88 - (0.1 + (seeded(seed + i) * 0.3)))} width={w*0.035} height={h*(0.1 + (seeded(seed + i) * 0.3))} fill="oklch(0.69 0.17 237)"/>
      ))}
      <path d={`M ${w*0.36} ${h*0.8} Q ${w*0.5} ${h*(0.5 + r*0.3)}, ${w*0.7} ${h*(0.6 + r*0.2)} T ${w*0.96} ${h*0.7}`} stroke="oklch(0.62 0.16 275)" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}
