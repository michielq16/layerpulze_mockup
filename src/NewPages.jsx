import React from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import DATA from './data';
import { StatCard } from './components';
import { resolveModelOwner, resolveModelSme, resolveModelStewards, resolveModelDomain } from './Ownership';
import { getModelGlossaryAttachments, getColumnGlossaryAttachments } from './Glossary';

/* Resolve a glossary-sourced description for a table or column ref.
   Operator rule: descriptions come from the attached business-glossary
   term — never invented prose. Returns null when nothing is attached. */
function glossaryDescFor({ table, column }) {
  let matches = [];
  if (column) matches = getColumnGlossaryAttachments(column);
  else if (table) matches = DATA.glossary.items.filter(t => (t.linkedTo?.tables || []).includes(table));
  if (matches.length === 0) return null;
  const t = matches[0];
  const typeMeta = DATA.glossary.types.find(x => x.key === t.type);
  return { term: t.term, type: typeMeta?.label || t.type, tone: typeMeta?.tone || 'slate', def: (t.definition || '').split('. ')[0] + '.' };
}

export function Documents() {
  const d = DATA.documents;
  const [tab, setTab] = React.useState('library');
  const [preview, setPreview] = React.useState(null);
  const outdatedCount = d.items.filter(i => i.status === 'outdated').length;

  const openPreview = (cfg) => setPreview(cfg);
  const closePreview = () => setPreview(null);
  const onAfterGenerate = () => { setPreview(null); setTab('library'); };

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Documents</h1>
          <p className="lp-page-sub">Your vault of auto-generated Word, PDF, and Markdown documentation for every semantic model. Browse, regenerate, schedule, or generate something new.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="refresh" size={14}/>Regenerate outdated{outdatedCount > 0 ? ` (${outdatedCount})` : ''}</button>
          <button className="btn btn-sm doc-gen-cta" onClick={() => setTab('generate')}><Icon name="plus" size={14}/>Generate new</button>
        </div>
      </div>

      <div className="lp-grid-4 fade-in">
        <StatCard label="Models documented" value={d.stats.modelsDocumented} unit="/34" sub={Math.round(d.stats.modelsDocumented / 34 * 100) + '% coverage'} icon="file-text" tone="emerald"/>
        <StatCard label="Generated / 30d"   value={d.stats.generated30d}     icon="wand"      tone="sky"/>
        <StatCard label="Outdated"          value={d.stats.outdated}         sub="Model changed since gen" icon="alert-triangle" tone="amber"/>
        <StatCard label="Median gen time"   value={d.stats.medianGenSec}     unit="s" sub="across all models" icon="zap" tone="violet"/>
      </div>

      <div className="model-tabs fade-in d2" style={{ marginTop: 18 }}>
        {[
          ['library',  `Library`,  'folders'],
          ['generate', 'Generate', 'wand'],
        ].map(([k, l, ic]) => (
          <button key={k} className={'model-tab' + (tab === k ? ' active' : '')} onClick={() => setTab(k)}>
            <Icon name={ic} size={14}/>{l}
            {k === 'library' && <span className="model-tab-count mono">{d.items.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'library' && <DocumentsLibrary onGenerate={() => setTab('generate')} onPreview={openPreview}/>}
      {tab === 'generate' && <DocumentsGenerate onBackToLibrary={() => setTab('library')} onPreview={openPreview}/>}
      {preview && (
        <DocumentPreviewModal
          {...preview}
          onClose={closePreview}
          onCommit={onAfterGenerate}
        />
      )}
    </>
  );
}

const SCHEDULE_LABELS = {
  off:      { label: 'Off',           icon: 'moon',     tone: 'slate'   },
  daily:    { label: 'Daily',         icon: 'refresh',  tone: 'sky'     },
  weekly:   { label: 'Weekly',        icon: 'calendar', tone: 'emerald' },
  monthly:  { label: 'Monthly',       icon: 'calendar', tone: 'sky'     },
  onchange: { label: 'On change',     icon: 'zap',      tone: 'violet'  },
};

export const AUDIENCE_LABELS = {
  complete:  { label: 'Complete',  tone: 'emerald', sub: 'Full-scope canonical document' },
  auditor:   { label: 'Auditor',   tone: 'rose',   sub: 'SOC 2 / HIPAA evidence' },
  analyst:   { label: 'Analyst',   tone: 'sky',    sub: 'Onboarding handoff'    },
  executive: { label: 'Executive', tone: 'amber',  sub: 'QBR-ready summary'      },
  engineer:  { label: 'Engineer',  tone: 'violet', sub: 'Full technical detail'  },
};

function DocumentsLibrary({ onGenerate, onPreview }) {
  const d = DATA.documents;
  const [q, setQ] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [ws, setWs] = React.useState('all');
  const [aud, setAud] = React.useState('all');
  const [sort, setSort] = React.useState('recent');
  const [schedOpen, setSchedOpen] = React.useState(null);

  const allWs = Array.from(new Set(d.items.map(i => i.ws)));
  const allAud = Array.from(new Set(d.items.map(i => i.audience)));
  const outdated = d.items.filter(i => i.status === 'outdated');

  const counts = {
    all:       d.items.length,
    current:   d.items.filter(i => i.status === 'current').length,
    outdated:  outdated.length,
    scheduled: d.items.filter(i => i.schedule && i.schedule !== 'off').length,
  };

  const filtered = d.items.filter(it => {
    if (statusFilter === 'current'   && it.status !== 'current')   return false;
    if (statusFilter === 'outdated'  && it.status !== 'outdated')  return false;
    if (statusFilter === 'scheduled' && (!it.schedule || it.schedule === 'off')) return false;
    if (ws  !== 'all' && it.ws  !== ws)  return false;
    if (aud !== 'all' && it.audience !== aud) return false;
    if (q && !(it.model + it.ws).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'name')     return a.model.localeCompare(b.model);
    if (sort === 'outdated') return (a.status === 'outdated' ? 0 : 1) - (b.status === 'outdated' ? 0 : 1);
    // recent — using existing string order as proxy; backend would sort on `generatedAt` desc
    return d.items.indexOf(a) - d.items.indexOf(b);
  });

  return (
    <>
      {outdated.length > 0 && (
        <div className="doc-banner fade-in">
          <Icon name="alert" size={16}/>
          <div className="doc-banner-body">
            <div className="doc-banner-title">{outdated.length} document{outdated.length > 1 ? 's are' : ' is'} outdated</div>
            <div className="doc-banner-sub">The source model has changed since last generation. Regenerate to refresh — or set up auto-regen so you never see this again.</div>
          </div>
          <div className="doc-banner-actions">
            <button className="btn btn-outline btn-sm"><Icon name="settings" size={13}/>Set up auto-regen</button>
            <button className="btn btn-sm"><Icon name="refresh" size={13}/>Regenerate all</button>
          </div>
        </div>
      )}

      <div className="lp-card lp-card-flush fade-in d2" style={{ padding: 14, marginBottom: 14 }}>
        <div className="doc-lib-filters">
          <div className="lp-search" style={{ flex: 1, minWidth: 240 }}>
            <Icon name="search" size={14}/>
            <input placeholder="Search by model, workspace…" value={q} onChange={e => setQ(e.target.value)}/>
          </div>
          <div className="chip-row">
            {[['all','All',counts.all],['current','Current',counts.current],['outdated','Outdated',counts.outdated],['scheduled','Scheduled',counts.scheduled]].map(([k,l,n]) => (
              <button key={k} className={'chip' + (statusFilter === k ? ' active' : '')} onClick={() => setStatusFilter(k)}>
                {l}<span className="count">{n}</span>
              </button>
            ))}
          </div>
          <select className="input input-sm" value={ws} onChange={e => setWs(e.target.value)}>
            <option value="all">All workspaces</option>
            {allWs.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <select className="input input-sm" value={aud} onChange={e => setAud(e.target.value)}>
            <option value="all">All audiences</option>
            {allAud.map(a => <option key={a} value={a}>{AUDIENCE_LABELS[a]?.label || a}</option>)}
          </select>
          <select className="input input-sm" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="recent">Recently generated</option>
            <option value="name">Name A–Z</option>
            <option value="outdated">Outdated first</option>
          </select>
        </div>
      </div>

      <div className="lp-section-head">
        <h2>Library <span className="count">{sorted.length} of {d.items.length}</span></h2>
      </div>

      <div className="doc-list fade-in d3">
        {sorted.map(it => {
          const sched = SCHEDULE_LABELS[it.schedule || 'off'];
          const audMeta = AUDIENCE_LABELS[it.audience] || { label: it.audience, tone: 'slate' };
          const isSchedOpen = schedOpen === it.id;
          const handleView = (e) => {
            e?.stopPropagation();
            onPreview?.({
              model:       it.model,
              ws:          it.ws,
              env:         'PROD',
              audience:    it.audience,
              format:      it.format,
              includeLogo: true,
              generatedAt: it.updatedAbs,
              fromLibrary: true,
              status:      it.status,
            });
          };
          return (
            <div
              key={it.id}
              className={'doc-row doc-row-click' + (it.status === 'outdated' ? ' doc-row-outdated' : '')}
              onClick={handleView}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleView(e); } }}
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
                  <span className="mono">{it.ws}</span>
                  <span className="sep">·</span>
                  <span className="mono doc-format">{it.format.toUpperCase()}</span>
                  <span className="sep">·</span>
                  <span title={it.updatedAbs}>updated {it.updated}</span>
                  <span className="sep">·</span>
                  <span className="mono">{it.size}</span>
                </div>
              </div>
              <div className="doc-sched-wrap" onClick={e => e.stopPropagation()}>
                <button className={'doc-sched-chip doc-sched-' + sched.tone} onClick={() => setSchedOpen(o => o === it.id ? null : it.id)}>
                  <Icon name={sched.icon} size={11}/>
                  <span>{sched.label}</span>
                  {it.scheduleNext && it.schedule !== 'off' && <span className="doc-sched-next mono">{it.scheduleNext}</span>}
                  <Icon name="chevron-down" size={10}/>
                </button>
                {isSchedOpen && (
                  <div className="doc-sched-pop" onClick={e => e.stopPropagation()}>
                    <div className="lp-eyebrow" style={{ padding: '8px 10px 4px' }}>Auto-regenerate</div>
                    {Object.entries(SCHEDULE_LABELS).map(([k, meta]) => (
                      <button key={k} className={'doc-sched-opt' + (it.schedule === k ? ' active' : '')} onClick={() => setSchedOpen(null)}>
                        <Icon name={meta.icon} size={12}/>
                        <span>{meta.label}</span>
                        {it.schedule === k && <Icon name="check" size={11}/>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="doc-actions" onClick={e => e.stopPropagation()}>
                <button className="btn btn-ghost btn-sm" title="View" onClick={handleView}><Icon name="external" size={14}/></button>
                <button className="btn btn-ghost btn-sm" title="Regenerate"><Icon name="refresh" size={14}/></button>
                <button className="btn btn-outline btn-sm" onClick={handleView}><Icon name="arrow-down" size={12}/>Download</button>
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="empty doc-empty">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No documents match.</div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Adjust the filters above, or <a onClick={onGenerate} style={{ color: 'oklch(0.55 0.18 237)', cursor: 'pointer', fontWeight: 500 }}>generate a new document</a>.</div>
          </div>
        )}
      </div>
    </>
  );
}

function DocumentsGenerate({ onBackToLibrary, onPreview }) {
  const d = DATA.documents;
  const [selectedId, setSelectedId] = React.useState(d.pickerModels[0].id);
  const [pickerQ, setPickerQ] = React.useState('');
  const [pickerFilter, setPickerFilter] = React.useState('all');
  const [audience, setAudience] = React.useState('analyst');
  const [format, setFormat] = React.useState('docx');
  const [includeLogo, setIncludeLogo] = React.useState(true);
  const [customSel, setCustomSel] = React.useState(null);

  const selected = d.pickerModels.find(m => m.id === selectedId) || d.pickerModels[0];

  const audienceDefaults = React.useMemo(() => {
    const set = new Set();
    d.sections.forEach(grp => grp.items.forEach(s => {
      if (s.audiences && s.audiences.includes(audience)) set.add(s.key);
    }));
    return set;
  }, [audience]);

  const activeSel = customSel != null ? customSel : audienceDefaults;
  const isOn = (k) => activeSel.has(k);
  const toggle = (k) => {
    const next = new Set(activeSel);
    if (next.has(k)) next.delete(k); else next.add(k);
    setCustomSel(next);
  };
  const resetToAudience = () => setCustomSel(null);

  const sectionCount = (s) => s.countKey ? (selected[s.countKey] || 0) : (s.count || 0);
  const selectedCount = d.sections.reduce((n, grp) => n + grp.items.filter(s => isOn(s.key)).length, 0);
  const totalItems = d.sections.reduce((n, grp) => n + grp.items.filter(s => isOn(s.key)).reduce((m, s) => m + sectionCount(s), 0), 0);
  const estPages = Math.max(3, Math.round(selectedCount * 1.4 + totalItems / 18));
  const estKB = Math.round(8 + selectedCount * 2.2 + totalItems * 0.12);

  const filteredPicker = d.pickerModels.filter(m =>
    (pickerQ === '' || m.name.toLowerCase().includes(pickerQ.toLowerCase()) || m.ws.toLowerCase().includes(pickerQ.toLowerCase())) &&
    (pickerFilter === 'all' || m.status === pickerFilter)
  );

  const previewSections = d.sections.flatMap(grp => grp.items.filter(s => isOn(s.key)).map(s => ({ ...s, count: sectionCount(s), group: grp.group })));

  return (
    <>
      <div className="lp-section-head">
        <h2>Generate a document</h2>
        <span className="lp-eyebrow">3 steps · ~{d.stats.medianGenSec}s</span>
      </div>

      <div className="doc-gen-grid fade-in d2">
        {/* ── STEP 1: Model picker ── */}
        <div className="doc-gen-col doc-gen-pick">
          <div className="doc-gen-step"><span className="doc-gen-step-n">1</span>Pick a model</div>

          <div className="lp-search doc-pick-search">
            <Icon name="search" size={13}/>
            <input placeholder="Search models or workspaces…" value={pickerQ} onChange={e => setPickerQ(e.target.value)}/>
          </div>

          <div className="chip-row" style={{ marginBottom: 8 }}>
            {[['all','All',d.pickerModels.length],['outdated','Outdated',d.pickerModels.filter(m=>m.status==='outdated').length],['never','Never',d.pickerModels.filter(m=>m.status==='never').length]].map(([k,l,n]) => (
              <button key={k} className={'chip chip-sm' + (pickerFilter === k ? ' active' : '')} onClick={() => setPickerFilter(k)}>
                {l}<span className="count">{n}</span>
              </button>
            ))}
          </div>

          <div className="doc-pick-list">
            {filteredPicker.map(m => (
              <button key={m.id} className={'doc-pick-row' + (m.id === selectedId ? ' selected' : '')} onClick={() => { setSelectedId(m.id); setCustomSel(null); }}>
                <div className="doc-pick-icon" style={{
                  background: `var(--modern-icon-bg-${m.tone})`,
                  color:      `var(--modern-icon-fg-${m.tone})`,
                }}>
                  <Icon name="boxes" size={14}/>
                </div>
                <div className="doc-pick-main">
                  <div className="doc-pick-name">{m.name}</div>
                  <div className="doc-pick-meta">
                    <span className="mono">{m.ws}</span>
                    <span className="sep">·</span>
                    <span className="mono">{m.tables}t · {m.measures}m</span>
                  </div>
                </div>
                <span className={'doc-pick-stat doc-pick-stat-' + m.status}>
                  {m.status === 'current'  && <><span className="dot"/>Current</>}
                  {m.status === 'outdated' && <><span className="dot"/>Outdated</>}
                  {m.status === 'never'    && <><span className="dot"/>Never</>}
                </span>
              </button>
            ))}
            {filteredPicker.length === 0 && <div className="empty" style={{ padding: '20px 0', fontSize: 12 }}>No models match.</div>}
          </div>
        </div>

        {/* ── STEP 2: Sections + options ── */}
        <div className="doc-gen-col doc-gen-config">
          <div className="doc-gen-step"><span className="doc-gen-step-n">2</span>Choose sections</div>

          <div className="doc-aud-row">
            <div className="lp-eyebrow" style={{ marginBottom: 6 }}>Audience preset</div>
            <div className="doc-aud-tabs">
              {d.audiences.filter(a => a.key !== 'custom').map(a => (
                <button key={a.key} className={'doc-aud-tab' + (audience === a.key && customSel == null ? ' active' : '')} onClick={() => { setAudience(a.key); setCustomSel(null); }}>
                  <span className="doc-aud-label">{a.label}</span>
                  <span className="doc-aud-sub">{a.sub}</span>
                </button>
              ))}
            </div>
            {customSel != null && (
              <div className="doc-aud-custom">
                <span><Icon name="sliders" size={11}/> Custom selection — <b>{selectedCount} sections</b></span>
                <button className="btn btn-ghost btn-sm" onClick={resetToAudience}>Reset to {d.audiences.find(a=>a.key===audience).label}</button>
              </div>
            )}
          </div>

          <div className="doc-sections">
            {d.sections.map(grp => {
              const onCount = grp.items.filter(s => isOn(s.key)).length;
              return (
                <div key={grp.group} className="doc-section-grp">
                  <div className="doc-section-grp-head">
                    <span className="doc-section-grp-name">{grp.group}</span>
                    <span className="doc-section-grp-count mono">{onCount}/{grp.items.length}</span>
                  </div>
                  <div className="doc-section-grp-body">
                    {grp.items.map(s => {
                      const on = isOn(s.key);
                      const cnt = sectionCount(s);
                      return (
                        <label key={s.key} className={'doc-section-row' + (on ? ' on' : '')}>
                          <input type="checkbox" checked={on} onChange={() => toggle(s.key)}/>
                          <span className="doc-section-check"><Icon name="check" size={10}/></span>
                          <span className="doc-section-label">{s.label}</span>
                          {cnt > 0 && <span className="doc-section-count mono">{cnt}</span>}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="doc-options">
            <div className="doc-option-row">
              <span className="lp-eyebrow">Format</span>
              <div className="seg-tabs" style={{ marginLeft: 'auto' }}>
                {[['docx','.docx'],['pdf','.pdf'],['md','Markdown']].map(([k,l]) => (
                  <button key={k} className={'seg-tab' + (format === k ? ' active' : '')} onClick={() => setFormat(k)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="doc-option-row">
              <span className="lp-eyebrow">Cover</span>
              <label className="doc-toggle" style={{ marginLeft: 'auto' }}>
                <input type="checkbox" checked={includeLogo} onChange={e => setIncludeLogo(e.target.checked)}/>
                <span className="doc-toggle-track"><span className="doc-toggle-thumb"/></span>
                <span style={{ fontSize: 12 }}>Include partner logo</span>
              </label>
            </div>
          </div>
        </div>

        {/* ── STEP 3: Preview + actions ── */}
        <div className="doc-gen-col doc-gen-preview">
          <div className="doc-gen-step"><span className="doc-gen-step-n">3</span>Preview & download</div>

          <div className="doc-preview-card">
            <div className="doc-preview-chrome">
              <div className="doc-preview-tabs">
                <span className="doc-preview-tab active">Page 1</span>
                <span className="doc-preview-tab">Page 2</span>
                <span className="doc-preview-tab">…</span>
                <span className="doc-preview-tab">Page {estPages}</span>
              </div>
              <span className="doc-preview-fmt mono">{format.toUpperCase()}</span>
            </div>
            <div className="doc-preview-page">
              {includeLogo && (
                <div className="doc-preview-header">
                  <div className="doc-preview-logo">L</div>
                  <span className="doc-preview-partner">LayerPulse · Contoso Fabric</span>
                </div>
              )}
              <div className="doc-preview-title">{selected.name}</div>
              <div className="doc-preview-sub">{d.audiences.find(a => a.key === audience).label} report · {selected.ws} · {selected.env}</div>
              <div className="doc-preview-rule"/>
              {previewSections.length === 0 && (
                <div className="doc-preview-empty">No sections selected. Pick at least one section in step 2 to see the document take shape.</div>
              )}
              {previewSections.slice(0, 8).map((s, i) => (
                <div key={s.key} className="doc-preview-section">
                  <div className="doc-preview-section-h">
                    <span className="doc-preview-section-n mono">{i + 1}.</span>
                    <span>{s.label}</span>
                    {s.count > 1 && <span className="doc-preview-section-c mono">{s.count}</span>}
                  </div>
                  <div className="doc-preview-section-lines">
                    <span style={{ width: '78%' }}/>
                    <span style={{ width: '64%' }}/>
                    <span style={{ width: '82%' }}/>
                  </div>
                </div>
              ))}
              {previewSections.length > 8 && (
                <div className="doc-preview-more">+ {previewSections.length - 8} more section{previewSections.length - 8 > 1 ? 's' : ''} on later pages</div>
              )}
            </div>
          </div>

          <div className="doc-est-strip">
            <div className="doc-est-cell">
              <div className="doc-est-k mono">{estPages}</div>
              <div className="doc-est-l">pages</div>
            </div>
            <div className="doc-est-cell">
              <div className="doc-est-k mono">~{estKB} KB</div>
              <div className="doc-est-l">size</div>
            </div>
            <div className="doc-est-cell">
              <div className="doc-est-k mono">~{Math.max(6, Math.round(selectedCount * 2))}s</div>
              <div className="doc-est-l">to generate</div>
            </div>
          </div>

          <div className="doc-gen-actions">
            <button className="btn btn-outline btn-sm" disabled={selectedCount === 0}><Icon name="external" size={13}/>Share link</button>
            <button className="btn btn-outline btn-sm" disabled={selectedCount === 0}><Icon name="refresh" size={13}/>Schedule weekly</button>
            <button
              className="btn doc-gen-cta"
              disabled={selectedCount === 0}
              onClick={() => onPreview?.({
                model:       selected.name,
                ws:          selected.ws,
                env:         selected.env,
                audience,
                format,
                includeLogo,
                generatedAt: 'just now · preview',
                sections:    previewSections.map(s => s.key),
                fromGenerate: true,
                status:      selected.status,
              })}
            >
              <Icon name="arrow-down" size={14}/>Generate .{format}
            </button>
          </div>

          {selected.status === 'outdated' && (
            <div className="doc-gen-hint">
              <Icon name="alert" size={12}/>
              <span>Last generated {selected.lastGen}. Model has changed since — regenerate to refresh.</span>
            </div>
          )}
          {selected.status === 'never' && (
            <div className="doc-gen-hint doc-gen-hint-info">
              <Icon name="info" size={12}/>
              <span>No prior document for this model. First generation will become the baseline.</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   DocumentPreviewModal — rendered Word-shaped preview of the generated doc.
   Powered by DATA.documents.sample (Sales Analytics canonical content).
   The model heading is swapped for whatever model the operator opened —
   this is a mockup; the back-end will swap the body too.
   ───────────────────────────────────────────────────────────────────────── */

export function DocumentPreviewModal({ model, ws, env = 'PROD', audience: initialAudience, format: initialFormat, includeLogo = true, generatedAt, sections, status, fromGenerate, onClose, onCommit }) {
  const [audience, setAudience] = React.useState(initialAudience || 'complete');
  const [format, setFormat]     = React.useState(initialFormat || 'docx');
  const [currentPage, setCurrentPage] = React.useState(1);
  const bodyRef = React.useRef(null);
  const sample = DATA.documents.sample;

  // Close on ESC
  React.useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  // Lock body scroll while open
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Resolve real role assignments (joined into doc per the audience → role mapping
  // documented in docs/analysis/fabric-artifact-ownership-conventions.md). Falls
  // back gracefully when secondary roles (SME, Stewards) aren't set.
  const modelId   = (DATA.documents.pickerModels.find(m => m.name === model) || {}).id;
  const owner     = resolveModelOwner(model, ws);
  const sme       = modelId ? resolveModelSme(modelId)      : null;
  const stewards  = modelId ? resolveModelStewards(modelId) : [];
  const domain    = modelId ? resolveModelDomain(modelId)   : null;

  // Pull glossary terms attached to this model (manual attachments via /glossary
   // or the model-detail "Attach term" affordance). Transformed into the
   // {term, def, type} shape the page builders expect. Falls back to the
   // sample fixture only when no attachments are recorded for this model.
  const attachedGlossary = React.useMemo(() => {
    const raw = getModelGlossaryAttachments(model);
    if (raw.length === 0) {
      // Fallback — use canonical fixture so the doc never has an empty glossary
      return sample.glossary.map(t => ({ term: t.term, def: t.def, type: 'business' }));
    }
    return raw.map(t => ({
      term: t.term,
      def: (t.definition || '').split('. ')[0] + '.',
      type: t.type,
      domain: t.domain,
      sensitivity: t.sensitivity,
    }));
  }, [model]);

  const ctx = { model, ws, env, includeLogo, generatedAt, sample, audience, owner, sme, stewards, domain, attachedGlossary };
  const pages = React.useMemo(() => buildDocPages(audience, ctx), [audience, model, ws, env, includeLogo, generatedAt]);
  const total = pages.length;

  // Track active page by scroll position
  React.useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;
    const onScroll = () => {
      const pageEls = root.querySelectorAll('.doc-modal-page-wrap');
      const top = root.scrollTop + 80;
      let active = 1;
      pageEls.forEach((el, i) => { if (el.offsetTop <= top) active = i + 1; });
      setCurrentPage(active);
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => root.removeEventListener('scroll', onScroll);
  }, [pages.length]);

  const scrollToPage = (n) => {
    const root = bodyRef.current;
    if (!root) return;
    const target = root.querySelectorAll('.doc-modal-page-wrap')[n - 1];
    if (target) root.scrollTo({ top: target.offsetTop - 12, behavior: 'smooth' });
  };

  const audMeta = AUDIENCE_LABELS[audience] || { label: audience, tone: 'slate' };

  // Portal to <body> so the modal escapes any transformed ancestor (e.g. the
  // `.fade-in` tab wrapper) that would otherwise become its containing block
  // and trap position:fixed inside the page content instead of the viewport.
  return createPortal(
    <div className="doc-modal-backdrop" onClick={onClose}>
      <div className="doc-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Generated document — ${model}`}>

        {/* Header */}
        <div className="doc-modal-header">
          <div className="doc-modal-title-block">
            <div className="doc-modal-title">
              <Icon name="file-text" size={18}/>
              <span>{model}</span>
              <span className={'doc-aud-pill doc-aud-pill-' + audMeta.tone}>{audMeta.label}</span>
              <span className="mono doc-modal-fmt">{format.toUpperCase()}</span>
            </div>
            <div className="doc-modal-sub">
              <span className="mono">{ws}</span>
              <span className="sep">·</span>
              <span className="mono">{env}</span>
              <span className="sep">·</span>
              <span>Generated {generatedAt}</span>
              {sections && (<>
                <span className="sep">·</span>
                <span><b>{sections.length}</b> sections</span>
              </>)}
            </div>
          </div>

          <div className="doc-modal-toolbar">
            <div className="doc-modal-aud-switch">
              <span className="lp-eyebrow">View</span>
              <div className="seg-tabs seg-tabs-sm">
                {['complete','auditor','analyst','executive','engineer'].map(a => (
                  <button
                    key={a}
                    className={'seg-tab' + (audience === a ? ' active' : '')}
                    onClick={() => { setAudience(a); setCurrentPage(1); bodyRef.current?.scrollTo({ top: 0 }); }}
                    title={`Switch render to ${AUDIENCE_LABELS[a].label}`}
                  >
                    {AUDIENCE_LABELS[a].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="doc-modal-actions">
              <select className="input input-sm doc-modal-fmt-sel" value={format} onChange={e => setFormat(e.target.value)} aria-label="Format">
                <option value="docx">.docx</option>
                <option value="pdf">.pdf</option>
                <option value="md">.md</option>
              </select>
              <button className="btn btn-outline btn-sm"><Icon name="refresh" size={13}/>Regenerate</button>
              <button className="btn btn-sm doc-gen-cta"><Icon name="arrow-down" size={13}/>Download .{format}</button>
              <button className="btn btn-ghost btn-sm doc-modal-close" onClick={onClose} title="Close (Esc)" aria-label="Close"><Icon name="x" size={16}/></button>
            </div>
          </div>
        </div>

        {/* Status hint (outdated banner) */}
        {status === 'outdated' && (
          <div className="doc-modal-banner">
            <Icon name="alert" size={13}/>
            <span>Source model has changed since this document was last generated. Regenerate to refresh.</span>
            <button className="btn btn-sm" style={{ marginLeft: 'auto' }}><Icon name="refresh" size={12}/>Regenerate now</button>
          </div>
        )}

        {/* Body — paginated pages */}
        <div className="doc-modal-body" ref={bodyRef}>
          {pages.map((P, i) => (
            <div key={i} className="doc-modal-page-wrap">
              <div className="doc-modal-page-num mono">Page {i + 1} of {total}</div>
              <div className="doc-modal-page">
                {includeLogo && (
                  <div className="doc-page-running-head">
                    <span className="doc-page-rh-brand">LayerPulse · Contoso Fabric</span>
                    <span className="doc-page-rh-meta mono">{model} · {audMeta.label} · {generatedAt}</span>
                  </div>
                )}
                <div className="doc-page-content">{P}</div>
                <div className="doc-page-running-foot">
                  <span className="doc-page-rf-brand">LayerPulse — auto-generated documentation</span>
                  <span className="doc-page-rf-num mono">{i + 1} / {total}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer — page nav */}
        <div className="doc-modal-footer">
          <div className="doc-modal-page-nav">
            <button className="btn btn-ghost btn-sm" onClick={() => scrollToPage(currentPage - 1)} disabled={currentPage <= 1}><Icon name="chevron-left" size={14}/></button>
            <span className="mono">Page <b>{currentPage}</b> of <b>{total}</b></span>
            <button className="btn btn-ghost btn-sm" onClick={() => scrollToPage(currentPage + 1)} disabled={currentPage >= total}><Icon name="chevron-right" size={14}/></button>
          </div>
          <div className="doc-modal-foot-meta">
            <Icon name="info" size={11}/>
            <span>Mockup preview · <b>Complete</b> is the canonical full-scope document; the 4 audience views are lenses (subsets) of it.</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Page builders — one per audience.
   Each returns React fragments (one per "page"). Page chrome (running
   head/foot + page-number gutter) is supplied by DocumentPreviewModal.
   ───────────────────────────────────────────────────────────────────────── */

function buildDocPages(audience, ctx) {
  if (audience === 'complete')  return completePages(ctx);
  if (audience === 'auditor')   return auditorPages(ctx);
  if (audience === 'analyst')   return analystPages(ctx);
  if (audience === 'executive') return executivePages(ctx);
  if (audience === 'engineer')  return engineerPages(ctx);
  return analystPages(ctx);
}

/* ── shared atoms ───────────────────────────────────────────────────────── */

function DocCover({ ctx, audienceLabel, audienceTone, subtitle, version }) {
  return (
    <div className="doc-cover">
      <div className="doc-cover-brand">
        {ctx.includeLogo && <div className="doc-cover-logo">LP</div>}
        <span className="doc-cover-brand-name">LayerPulse</span>
        <span className="doc-cover-brand-sep">·</span>
        <span className="doc-cover-brand-tenant">Contoso Fabric</span>
      </div>

      <div className="doc-cover-eyebrow-row">
        <div className="doc-cover-eyebrow" data-tone={audienceTone}>
          {audienceLabel} report
        </div>
        {ctx.sample.certification?.status && ctx.sample.certification.status !== 'None' && (
          <div className={'doc-cert-badge doc-cert-' + ctx.sample.certification.status.toLowerCase()}>
            <Icon name="shield-check" size={12}/>
            {ctx.sample.certification.status}
          </div>
        )}
      </div>

      <h1 className="doc-cover-title">{ctx.model}</h1>
      <div className="doc-cover-sub">{subtitle}</div>

      <div className="doc-cover-meta">
        <div><span className="doc-cover-k">Workspace</span><span className="doc-cover-v mono">{ctx.ws}</span></div>
        <div><span className="doc-cover-k">Environment</span><span className="doc-cover-v mono">{ctx.env}</span></div>
        <div><span className="doc-cover-k">Generated</span><span className="doc-cover-v">{ctx.generatedAt}</span></div>
        <div><span className="doc-cover-k">Version</span><span className="doc-cover-v mono">{version}</span></div>
        <div>
          <span className="doc-cover-k">Owner</span>
          <span className="doc-cover-v">
            {ctx.owner ? ctx.owner.name : <em style={{ color: '#b91c1c' }}>— Not yet assigned —</em>}
            {ctx.owner?.source === 'workspace' && <span style={{ fontSize: '9pt', color: '#94a3b8', marginLeft: 6 }}>(inherited from workspace)</span>}
          </span>
        </div>
        <div><span className="doc-cover-k">{ctx.domain ? 'Domain' : 'Source'}</span><span className="doc-cover-v">{ctx.domain ? ctx.domain.label : 'MS Fabric · semantic model'}</span></div>
      </div>

      <div className="doc-cover-foot">
        <span>Auto-generated by LayerPulse. For source-of-truth schema, open this model in {ctx.ws}.</span>
      </div>
    </div>
  );
}

function ExecKpiGrid({ kpis, narrative, big }) {
  return (
    <>
      <h2 className="doc-h2">Executive summary</h2>
      <p className="doc-p">{narrative}</p>
      <div className={'doc-kpi-grid' + (big ? ' big' : '')}>
        {kpis.map(k => (
          <div key={k.label} className="doc-kpi-tile">
            <div className="doc-kpi-l">{k.label}</div>
            <div className="doc-kpi-v mono">{k.value}</div>
            <div className="doc-kpi-s">{k.sub}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function TocList({ items }) {
  return (
    <>
      <h2 className="doc-h2">Table of contents</h2>
      <ol className="doc-toc">
        {items.map((it, i) => (
          <li key={i}><span>{it.title}</span><span className="doc-toc-dot"/><span className="mono doc-toc-p">{it.page}</span></li>
        ))}
      </ol>
    </>
  );
}

/* ── AUTOMATED sections (Fabric API + LP collectors) ─────────────────── */

function QualityScoreSection({ quality }) {
  if (!quality) return null;
  const barColor = (v) => v >= 8 ? '#16a34a' : v >= 6.5 ? '#ca8a04' : '#dc2626';
  return (
    <>
      <h2 className="doc-h2">Model maturity</h2>
      <p className="doc-p doc-p-sub">LayerPulse quality score · {quality.tier} tier · trending {quality.trend >= 0 ? '▲' : '▼'} {Math.abs(quality.trend).toFixed(1)} this quarter.</p>
      <div className="doc-quality">
        <div className="doc-quality-score">
          <div className="doc-quality-num mono" style={{ color: barColor(quality.score) }}>{quality.score.toFixed(1)}</div>
          <div className="doc-quality-out">/ 10</div>
        </div>
        <div className="doc-quality-bars">
          {quality.breakdown.map(b => (
            <div key={b.dim} className="doc-quality-row">
              <span className="doc-quality-dim">{b.dim}</span>
              <span className="doc-quality-track"><span className="doc-quality-fill" style={{ width: (b.val * 10) + '%', background: barColor(b.val) }}/></span>
              <span className="mono doc-quality-val">{b.val.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
      {quality.note && <p className="doc-p" style={{ marginTop: 10, fontSize: '10pt' }}><b>Weakest — {quality.weakest}.</b> {quality.note}</p>}
    </>
  );
}

function RefreshHistorySection({ refresh, incremental, audience }) {
  if (!refresh) return null;
  const wk = refresh.windows.find(w => w.window === 'Last 7d');
  const stale = wk && wk.failed > 0;
  const note = audience === 'analyst'
    ? 'Missed refreshes mean stale data — a model that fails to refresh is not trustworthy for analysis.'
    : audience === 'engineer'
      ? 'Recent failures + reasons below — first place to look when numbers go stale.'
      : 'Refresh reliability is part of the evidence pack — proves the data is current.';
  return (
    <>
      <h2 className="doc-h2">Refresh history</h2>
      <p className="doc-p doc-p-sub">Scheduled {refresh.schedule} · last refresh {refresh.lastRefresh} ({refresh.lastStatus}) · avg {refresh.avgDurationMin} min. {note}</p>
      <table className="doc-table">
        <thead><tr><th>Window</th><th>Runs</th><th>OK</th><th>Failed</th><th>Success rate</th></tr></thead>
        <tbody>
          {refresh.windows.map((w, i) => {
            const rate = Math.round((w.ok / w.runs) * 100);
            return (
              <tr key={i}>
                <td><b>{w.window}</b></td>
                <td className="mono doc-td-num">{w.runs}</td>
                <td className="mono doc-td-num">{w.ok}</td>
                <td className="mono doc-td-num">{w.failed > 0 ? <span style={{ color: '#b91c1c', fontWeight: 700 }}>{w.failed}</span> : '0'}</td>
                <td className="mono doc-td-num"><span style={{ color: rate >= 95 ? '#166534' : rate >= 85 ? '#92400e' : '#b91c1c', fontWeight: 700 }}>{rate}%</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {refresh.recentFailures?.length > 0 && (
        <>
          <h3 className="doc-h3">Recent failures</h3>
          {refresh.recentFailures.map((f, i) => (
            <div key={i} className="doc-finding doc-finding-warning" style={{ marginBottom: 8 }}>
              <div className="doc-finding-head">
                <span className="doc-finding-sev doc-finding-sev-warning">failed</span>
                <span className="doc-finding-title mono" style={{ fontSize: '10pt' }}>{f.date}</span>
              </div>
              <div className="doc-finding-body" style={{ marginTop: 4 }}>{f.reason}</div>
            </div>
          ))}
        </>
      )}
      {incremental?.enabled && (
        <>
          <h3 className="doc-h3">Incremental-refresh policy</h3>
          <table className="doc-table">
            <tbody>
              <tr><td><b>Range start</b></td><td className="mono">{incremental.rangeStart}</td></tr>
              <tr><td><b>Rolling window</b></td><td className="mono">{incremental.rollingWindow}</td></tr>
              <tr><td><b>Granularity</b></td><td className="mono">{incremental.refreshGranularity}</td></tr>
              <tr><td><b>Detect changes</b></td><td className="mono">{incremental.detectChanges}</td></tr>
            </tbody>
          </table>
          <p className="doc-p" style={{ fontSize: '10pt' }}>{incremental.note}</p>
        </>
      )}
    </>
  );
}

function AccessSection({ access, audience }) {
  if (!access || access.length === 0) return null;
  const note = audience === 'engineer'
    ? 'Use this to verify RLS scoping — each Read group should map to the intended RLS rule. A group with "No filter" sees all rows.'
    : 'Who can access this model and at what level. Read groups are scoped by the RLS rule shown.';
  return (
    <>
      <h2 className="doc-h2">Access</h2>
      <p className="doc-p doc-p-sub">{access.length} principals · {access.filter(a => a.role === 'Read').length} read-scoped groups. {note}</p>
      <table className="doc-table">
        <thead><tr><th>Principal</th><th>Type</th><th>Role</th><th>Members</th><th>RLS scope</th></tr></thead>
        <tbody>
          {access.map((a, i) => (
            <tr key={i}>
              <td className="mono"><b>{a.principal}</b></td>
              <td>{a.kind}</td>
              <td><span className={'doc-access-role doc-access-role-' + a.role.toLowerCase()}>{a.role}</span></td>
              <td className="mono doc-td-num">{a.members ?? '—'}</td>
              <td className="doc-td-desc">{a.rls}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function PowerQuerySection({ mQueries }) {
  if (!mQueries || mQueries.length === 0) return null;
  return (
    <>
      <h2 className="doc-h2">Power Query (M)</h2>
      <p className="doc-p doc-p-sub">The ingestion + transform layer — how each table is loaded and shaped before the DAX model sees it. Extracted from partition definitions.</p>
      {mQueries.map(q => (
        <div key={q.table} className="doc-mquery">
          <div className="doc-mquery-head">
            <span className="doc-mquery-table mono">{q.table}</span>
            <span className="doc-mquery-meta">{q.kind} · {q.source}</span>
          </div>
          <pre className="doc-mcode mono">{q.m}</pre>
        </div>
      ))}
    </>
  );
}

function ExecNoteBlock({ note, owner }) {
  if (!note) return null;
  return (
    <div className="doc-exec-note">
      <div className="doc-exec-note-eyebrow">Owner's note</div>
      <div className="doc-exec-note-body">{note}</div>
    </div>
  );
}

function OlsSection({ ols }) {
  if (!ols || ols.length === 0) return null;
  return (
    <>
      <h2 className="doc-h2">Object-level security (OLS)</h2>
      <p className="doc-p doc-p-sub">{ols.length} hide rules — columns/tables made invisible to a role (distinct from RLS, which filters rows). Pairs with the Access section.</p>
      <table className="doc-table">
        <thead><tr><th>Role</th><th>Object hidden</th><th>Access</th><th>Reason</th></tr></thead>
        <tbody>
          {ols.map((o, i) => (
            <tr key={i}>
              <td className="mono">{o.role}</td>
              <td className="mono">{o.object}</td>
              <td><span className="doc-rls-state off">{o.access}</span></td>
              <td className="doc-td-desc">{o.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function HierarchiesSection({ hierarchies }) {
  if (!hierarchies || hierarchies.length === 0) return null;
  return (
    <>
      <h2 className="doc-h2">Hierarchies</h2>
      <p className="doc-p doc-p-sub">{hierarchies.length} drill paths for dimensional navigation.</p>
      {hierarchies.map(h => (
        <div key={h.name} className="doc-hier">
          <div className="doc-hier-head">
            <span className="doc-hier-name">{h.name}</span>
            <span className="doc-hier-table mono">{h.table}</span>
          </div>
          <div className="doc-hier-levels">
            {h.levels.map((l, i) => (
              <React.Fragment key={l}>
                <span className="doc-hier-level mono">{l}</span>
                {i < h.levels.length - 1 && <span className="doc-hier-arrow">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function CalcGroupsSection({ calcGroups, perspectives, translations }) {
  if (!calcGroups || calcGroups.length === 0) return null;
  return (
    <>
      <h2 className="doc-h2">Calculation groups &amp; model objects</h2>
      <p className="doc-p doc-p-sub">{calcGroups.length} calculation groups · {perspectives?.length || 0} perspectives · {translations?.length || 0} translations.</p>
      {calcGroups.map(cg => (
        <div key={cg.name} className="doc-calcgroup">
          <div className="doc-calcgroup-head">
            <span className="doc-calcgroup-name">{cg.name}</span>
            <span className="doc-calcgroup-prec mono">precedence {cg.precedence}</span>
          </div>
          <div className="doc-chip-row">
            {cg.items.map(it => <span key={it} className="doc-mini-chip mono">{it}</span>)}
          </div>
        </div>
      ))}
      <div className="doc-objmeta">
        <div><span className="lp-eyebrow">Perspectives</span><span>{(perspectives || []).join(' · ')}</span></div>
        <div><span className="lp-eyebrow">Translations</span><span>{(translations || []).join(' · ')}</span></div>
      </div>
    </>
  );
}

function MeasureUsageSection({ usage }) {
  if (!usage) return null;
  return (
    <>
      <h2 className="doc-h2">Measure usage &amp; dormancy</h2>
      <p className="doc-p doc-p-sub">{usage.usedIn30d} of {usage.total} measures referenced by a report in the last 30 days · <b style={{ color: '#b45309' }}>{usage.dormant} dormant</b> (candidates for cleanup).</p>
      <h3 className="doc-h3">Top used</h3>
      <table className="doc-table">
        <thead><tr><th>Measure</th><th>Reports</th><th>Opens · 30d</th></tr></thead>
        <tbody>
          {usage.topUsed.map((m, i) => (
            <tr key={i}>
              <td className="mono">{m.measure}</td>
              <td className="mono doc-td-num">{m.reports}</td>
              <td className="mono doc-td-num">{m.opens30d.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3 className="doc-h3">Dormant — cleanup candidates</h3>
      {usage.dormantList.map((d, i) => (
        <div key={i} className="doc-finding doc-finding-info" style={{ marginBottom: 8 }}>
          <div className="doc-finding-head">
            <span className="doc-finding-sev doc-finding-sev-info">dormant</span>
            <span className="doc-finding-title mono" style={{ fontSize: '10pt' }}>{d.measure}</span>
            <span style={{ marginLeft: 'auto', fontSize: '9pt', color: '#94a3b8' }}>last used {d.lastUsed}</span>
          </div>
          <div className="doc-finding-body" style={{ marginTop: 4 }}>{d.note}</div>
        </div>
      ))}
    </>
  );
}

function StorageSection({ storage }) {
  if (!storage) return null;
  return (
    <>
      <h2 className="doc-h2">Storage &amp; size</h2>
      <p className="doc-p doc-p-sub">{storage.totalMB} MB in-memory · {storage.compressionRatio} VertiPaq compression. Largest tables drive refresh time + capacity cost.</p>
      <table className="doc-table">
        <thead><tr><th>Table</th><th>Size</th><th>Share</th><th>Highest-cardinality column</th></tr></thead>
        <tbody>
          {storage.byTable.map((t, i) => (
            <tr key={i}>
              <td className="mono"><b>{t.table}</b></td>
              <td className="mono doc-td-num">{t.mb} MB</td>
              <td className="mono doc-td-num">{t.pct}%</td>
              <td className="mono doc-td-desc">{t.cardinalityCol}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function CostAttributionSection({ cost, audience }) {
  if (!cost) return null;
  const note = audience === 'executive'
    ? 'What this model costs to run — its share of the capacity bill.'
    : audience === 'auditor'
      ? 'Capacity-cost evidence for chargeback / showback.'
      : 'CU consumption — refresh vs query split tells you where to optimize.';
  return (
    <>
      <h2 className="doc-h2">Capacity &amp; cost</h2>
      <p className="doc-p doc-p-sub">{note}</p>
      <div className="doc-kpi-grid">
        <div className="doc-kpi-tile"><div className="doc-kpi-l">Capacity</div><div className="doc-kpi-v mono" style={{ fontSize: '14pt' }}>{cost.sku}</div><div className="doc-kpi-s">{cost.capacity}</div></div>
        <div className="doc-kpi-tile"><div className="doc-kpi-l">CU · 30d</div><div className="doc-kpi-v mono">{cost.cuPer30d.toLocaleString()}</div><div className="doc-kpi-s">{cost.shareOfCapacityPct}% of capacity</div></div>
        <div className="doc-kpi-tile"><div className="doc-kpi-l">Est. cost · 30d</div><div className="doc-kpi-v mono">€{cost.estCostEur30d}</div><div className="doc-kpi-s">{cost.trend}</div></div>
        <div className="doc-kpi-tile"><div className="doc-kpi-l">Refresh / Query</div><div className="doc-kpi-v mono" style={{ fontSize: '15pt' }}>{cost.refreshCuPct}/{cost.querycuPct}</div><div className="doc-kpi-s">CU split %</div></div>
      </div>
      <p className="doc-p" style={{ fontSize: '10pt', marginTop: 8 }}>{cost.note}</p>
    </>
  );
}

function AdoptionSection({ adoption, lineage, audience }) {
  if (!adoption) return null;
  const top = [...(lineage?.downstream || [])].sort((a, b) => b.viewers - a.viewers).slice(0, 6);
  const note = audience === 'executive'
    ? 'Reach across the organization — this model is the load-bearing source for the surfaces below.'
    : audience === 'engineer'
      ? 'Consumer load — these are the reports that break if this model breaks.'
      : 'Where this model is used — open the top surfaces to see it in action.';
  return (
    <>
      <h2 className="doc-h2">Adoption</h2>
      <p className="doc-p doc-p-sub">{note}</p>
      <div className="doc-kpi-grid">
        <div className="doc-kpi-tile"><div className="doc-kpi-l">DAU</div><div className="doc-kpi-v mono">{adoption.dau}</div><div className="doc-kpi-s">daily readers</div></div>
        <div className="doc-kpi-tile"><div className="doc-kpi-l">WAU</div><div className="doc-kpi-v mono">{adoption.wau}</div><div className="doc-kpi-s">weekly readers</div></div>
        <div className="doc-kpi-tile"><div className="doc-kpi-l">MAU</div><div className="doc-kpi-v mono">{adoption.mau}</div><div className="doc-kpi-s">monthly readers</div></div>
        <div className="doc-kpi-tile"><div className="doc-kpi-l">Total opens · 30d</div><div className="doc-kpi-v mono">{adoption.totalOpens30d.toLocaleString()}</div><div className="doc-kpi-s">+{adoption.newReaders30d} new readers</div></div>
        <div className="doc-kpi-tile"><div className="doc-kpi-l">Unique readers</div><div className="doc-kpi-v mono">{adoption.totalViewers30d}</div><div className="doc-kpi-s">across all surfaces</div></div>
        <div className="doc-kpi-tile"><div className="doc-kpi-l">Dormant</div><div className="doc-kpi-v mono">{adoption.dormantReports}</div><div className="doc-kpi-s">zero opens in 30d</div></div>
      </div>
      {top.length > 0 && (
        <>
          <h3 className="doc-h3">Top downstream surfaces</h3>
          <table className="doc-table">
            <thead><tr><th>Surface</th><th>Kind</th><th>Workspace</th><th>30d viewers</th><th>Last view</th></tr></thead>
            <tbody>
              {top.map((d, i) => (
                <tr key={i}>
                  <td><b>{d.item}</b></td>
                  <td>{d.kind}</td>
                  <td className="mono">{d.ws}</td>
                  <td className="mono doc-td-num">{d.viewers}</td>
                  <td className="mono">{d.lastView}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}

function TablesOverview({ tables, dense }) {
  return (
    <>
      <h2 className="doc-h2">Tables</h2>
      <p className="doc-p doc-p-sub">{tables.length} tables · 1 fact · {tables.length - 1} dimensions.</p>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Name</th><th>Kind</th><th>Rows</th><th>Cols</th>{!dense && <th>Partition</th>}
          </tr>
        </thead>
        <tbody>
          {tables.map(t => {
            const gd = glossaryDescFor({ table: t.name });
            return (
              <tr key={t.name}>
                <td><span className={'doc-tname doc-tname-' + t.kind}>{t.name}</span></td>
                <td className="doc-td-tag">{t.kind}</td>
                <td className="mono doc-td-num">{t.rows}</td>
                <td className="mono doc-td-num">{t.cols}</td>
                {!dense && <td className="mono">{t.partition}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function ColumnsForTable({ table }) {
  return (
    <>
      <h3 className="doc-h3"><span className={'doc-tname doc-tname-' + table.kind}>{table.name}</span> <span className="doc-h3-sub mono">· {table.rows} rows · {table.cols} cols</span></h3>
      <table className="doc-table doc-table-cols">
        <thead><tr><th>Column</th><th>Type</th><th>Role</th><th>Description</th></tr></thead>
        <tbody>
          {table.columns.map(c => {
            // Operator rule: column description comes from an attached glossary
            // term (dimension / business term / acronym) — never invented prose.
            // Blank when nothing is attached.
            const gd = glossaryDescFor({ column: `${table.name}[${c.name}]` });
            return (
              <tr key={c.name}>
                <td className="mono">{c.name}</td>
                <td className="mono doc-td-type">{c.type}</td>
                <td><span className="doc-role">{c.role}</span></td>
                <td className="doc-td-desc">
                  {gd ? (
                    <><span className="doc-col-gloss-tag" data-tone={gd.tone}>{gd.term}</span> {gd.def}</>
                  ) : (
                    <span style={{ color: '#cbd5e1' }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function RelationshipsTable({ rels }) {
  return (
    <>
      <h2 className="doc-h2">Relationships</h2>
      <p className="doc-p doc-p-sub">{rels.length} active relationships. All single-direction cross-filter, fact→dim.</p>
      <table className="doc-table">
        <thead><tr><th>From</th><th>To</th><th>Cardinality</th><th>Cross-filter</th><th>State</th></tr></thead>
        <tbody>
          {rels.map((r, i) => (
            <tr key={i}>
              <td className="mono">{r.from}</td>
              <td className="mono">{r.to}</td>
              <td className="mono">{r.card}</td>
              <td className="mono">{r.cross}</td>
              <td><span className={'doc-rls-state ' + (r.active ? 'on' : 'off')}>{r.active ? 'Active' : 'Inactive'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function MeasuresList({ measures, withDax }) {
  return (
    <>
      <h2 className="doc-h2">Measures</h2>
      <p className="doc-p doc-p-sub">{measures.length} documented measures across {Array.from(new Set(measures.map(m => m.folder.split(' · ')[0]))).length} folders.</p>
      {measures.map(m => {
        // Pull description from the attached business-glossary term
        // (Metric / KPI) — operator rule: if no glossary term is attached,
        // the measure renders WITHOUT a description.
        const attached = DATA.glossary.items.filter(t =>
          (t.linkedTo?.measures || []).includes(m.name)
        );
        const businessTerm = attached[0] || null;
        const businessDef = businessTerm
          ? (businessTerm.definition || '').split('. ')[0] + '.'
          : null;
        const typeMeta = businessTerm
          ? DATA.glossary.types.find(t => t.key === businessTerm.type)
          : null;
        return (
          <div key={m.name} className="doc-measure">
            <div className="doc-measure-head">
              <span className="doc-measure-name mono">{m.name}</span>
              <span className="doc-measure-folder">{m.folder}</span>
            </div>
            <div className="doc-measure-meta">
              <span><b>Format:</b> {m.format}</span>
              <span className="sep">·</span>
              <span><b>Depends on:</b> {m.dependsOn.map((d, i) => <code key={i} className="mono">{d}</code>).reduce((acc, el, i) => i === 0 ? [el] : [...acc, ', ', el], [])}</span>
            </div>
            {businessTerm ? (
              <div className="doc-measure-desc">
                <span className="doc-measure-glossary-tag" data-tone={typeMeta?.tone || 'slate'}>
                  {typeMeta?.label || 'Glossary'} · {businessTerm.term}
                </span>
                <span>{businessDef}</span>
              </div>
            ) : null}
            {withDax && (
              <pre className="doc-dax mono">{m.dax}</pre>
            )}
          </div>
        );
      })}
    </>
  );
}

function RlsTable({ rls }) {
  return (
    <>
      <h2 className="doc-h2">Row-level security rules</h2>
      <p className="doc-p doc-p-sub">{rls.length} rules in effect. Evaluated at query time against the caller's AAD group membership.</p>
      <table className="doc-table">
        <thead><tr><th>Rule</th><th>Table</th><th>Filter (DAX)</th><th>Members</th></tr></thead>
        <tbody>
          {rls.map((r, i) => (
            <tr key={i}>
              <td><b>{r.rule}</b></td>
              <td className="mono">{r.table}</td>
              <td className="mono doc-td-dax">{r.filter}</td>
              <td className="mono doc-td-mail">{r.members}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function SensLabelsTable({ labels }) {
  return (
    <>
      <h2 className="doc-h2">Sensitivity labels</h2>
      <p className="doc-p doc-p-sub">Column-level Microsoft Information Protection labels currently applied.</p>
      <table className="doc-table">
        <thead><tr><th>Table</th><th>Column</th><th>Label</th></tr></thead>
        <tbody>
          {labels.map((l, i) => (
            <tr key={i}>
              <td className="mono">{l.table}</td>
              <td className="mono">{l.col}</td>
              <td><span className={'doc-sens doc-sens-' + (l.label.includes('Confidential') ? 'conf' : l.label.includes('Internal') ? 'int' : 'gen')}>{l.label}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function FindingsList({ findings }) {
  return (
    <>
      <h2 className="doc-h2">Governance findings</h2>
      <p className="doc-p doc-p-sub">{findings.length} findings evaluated against tenant policy on {(new Date()).toISOString().slice(0,10)}.</p>
      {findings.map((f, i) => (
        <div key={i} className={'doc-finding doc-finding-' + f.sev}>
          <div className="doc-finding-head">
            <span className={'doc-finding-sev doc-finding-sev-' + f.sev}>{f.sev}</span>
            <span className="doc-finding-title">{f.title}</span>
          </div>
          <div className="doc-finding-body"><b>Detail.</b> {f.detail}</div>
          <div className="doc-finding-rec"><b>Recommendation.</b> {f.rec}</div>
        </div>
      ))}
    </>
  );
}

/* OwnersTable — pulls Owner + SME + Stewards from the LP role taxonomy
   (resolved in ctx). Falls back to the sample.owners list when ctx lacks
   live roles (mockup-only path). */
function OwnersTable({ ctx }) {
  const rows = [];

  if (ctx?.owner) {
    rows.push({
      name: ctx.owner.name,
      role: 'Owner' + (ctx.owner.source === 'workspace' ? ' (inherited from workspace)' : ''),
      email: ctx.owner.email,
      last: ctx.owner.set || '—',
    });
  }
  if (ctx?.sme) {
    rows.push({ name: ctx.sme.name, role: 'SME', email: ctx.sme.userEmail, last: ctx.sme.set });
  } else if (ctx?.owner) {
    rows.push({ name: ctx.owner.name, role: 'SME (fallback to Owner — none assigned)', email: ctx.owner.email, last: ctx.owner.set, fallback: true });
  }
  (ctx?.stewards || []).forEach(s => {
    rows.push({ name: s.name, role: 'Steward', email: s.userEmail, last: s.set });
  });

  return (
    <>
      <h2 className="doc-h2">Owners &amp; stewards</h2>
      <p className="doc-p doc-p-sub">Captured in LayerPulse · {ctx?.domain ? `Domain: ${ctx.domain.label}` : 'Domain not tagged'}.</p>
      <table className="doc-table">
        <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Last touched</th></tr></thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan="4" style={{ color: '#94a3b8', fontStyle: 'italic' }}>No roles assigned in LayerPulse. Add via /ownership.</td></tr>
          ) : rows.map((r, i) => (
            <tr key={i} style={r.fallback ? { color: '#94a3b8', fontStyle: 'italic' } : undefined}>
              <td><b>{r.name}</b></td>
              <td>{r.role}</td>
              <td className="mono doc-td-mail">{r.email}</td>
              <td className="mono">{r.last}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function ChangelogTable({ entries, limit }) {
  const rows = limit ? entries.slice(0, limit) : entries;
  return (
    <>
      <h2 className="doc-h2">Change log {limit ? <span className="doc-h2-sub">· last {limit}</span> : <span className="doc-h2-sub">· last 90 days</span>}</h2>
      <table className="doc-table">
        <thead><tr><th>Date</th><th>By</th><th>Change</th></tr></thead>
        <tbody>
          {rows.map((c, i) => (
            <tr key={i}>
              <td className="mono">{c.date}</td>
              <td>{c.who}</td>
              <td>{c.change}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/* GlossaryList — pluggable title + subtitle. Now type-aware: if any term has
   a `type` field, terms are grouped by type into separate dt/dd blocks with
   subheadings (Metrics · KPIs · Acronyms · etc). */
function GlossaryList({ terms, title = 'Business glossary', subtitle }) {
  if (!terms || terms.length === 0) {
    return (
      <>
        <h2 className="doc-h2">{title}</h2>
        <p className="doc-p doc-p-sub">No glossary terms attached to this model yet — add them via LP /glossary.</p>
      </>
    );
  }
  // Group by type when present
  const hasTypes = terms.some(t => t.type);
  if (!hasTypes) {
    return (
      <>
        <h2 className="doc-h2">{title}</h2>
        {subtitle && <p className="doc-p doc-p-sub">{subtitle}</p>}
        <dl className="doc-glossary">
          {terms.map((t, i) => (
            <React.Fragment key={i}>
              <dt className="mono">{t.term}</dt>
              <dd>{t.def}</dd>
            </React.Fragment>
          ))}
        </dl>
      </>
    );
  }
  const order = ['metric', 'kpi', 'dimension', 'business', 'acronym', 'process'];
  const labels = { metric: 'Metrics', kpi: 'KPIs', dimension: 'Dimensions', business: 'Business terms', acronym: 'Acronyms', process: 'Processes' };
  const grouped = order
    .map(k => ({ type: k, items: terms.filter(t => t.type === k) }))
    .filter(g => g.items.length > 0);
  return (
    <>
      <h2 className="doc-h2">{title}</h2>
      {subtitle && <p className="doc-p doc-p-sub">{subtitle}</p>}
      {grouped.map(g => (
        <React.Fragment key={g.type}>
          <h3 className="doc-h3">{labels[g.type] || g.type}</h3>
          <dl className="doc-glossary">
            {g.items.map((t, i) => (
              <React.Fragment key={i}>
                <dt className="mono">{t.term}</dt>
                <dd>{t.def}</dd>
              </React.Fragment>
            ))}
          </dl>
        </React.Fragment>
      ))}
    </>
  );
}

function ErDiagram({ erd, rels }) {
  return (
    <>
      <h2 className="doc-h2">ER diagram</h2>
      <p className="doc-p doc-p-sub">Star schema · 1 fact · 4 dimensions · 4 active relationships.</p>
      <div className="doc-erd">
        <svg viewBox="0 0 720 460" className="doc-erd-svg">
          {/* relationship lines */}
          {erd.tables.filter(t => t.kind === 'dim').map((dim, i) => {
            const fact = erd.tables.find(t => t.kind === 'fact');
            return (
              <line
                key={i}
                x1={dim.x + 70}  y1={dim.y + 26}
                x2={fact.x + 60} y2={fact.y + 26}
                stroke="#94a3b8" strokeWidth="1.4" strokeDasharray="2 2"
              />
            );
          })}
          {erd.tables.map(t => (
            <g key={t.name} transform={`translate(${t.x},${t.y})`}>
              <rect width="140" height="56" rx="6" fill={t.kind === 'fact' ? '#0D3159' : '#fff'} stroke={t.kind === 'fact' ? '#0D3159' : '#cbd5e1'} strokeWidth="1.4"/>
              <text x="70" y="22" textAnchor="middle" fontSize="13" fontWeight="700" fill={t.kind === 'fact' ? '#FFBF3C' : '#0D3159'} fontFamily="DM Sans, sans-serif">{t.name}</text>
              <text x="70" y="40" textAnchor="middle" fontSize="10" fill={t.kind === 'fact' ? '#cbd5e1' : '#64748b'} fontFamily="JetBrains Mono, monospace">{t.kind === 'fact' ? 'fact · 1:* center' : 'dim'}</text>
            </g>
          ))}
        </svg>
      </div>
    </>
  );
}

function LineageBlocks({ lineage }) {
  return (
    <>
      <h2 className="doc-h2">Lineage</h2>

      <h3 className="doc-h3">Upstream sources <span className="doc-h3-sub">· {lineage.upstream.length} items feed this model</span></h3>
      <table className="doc-table">
        <thead><tr><th>Source</th><th>Kind</th><th>Layer</th><th>Refresh</th></tr></thead>
        <tbody>
          {lineage.upstream.map((u, i) => (
            <tr key={i}>
              <td className="mono">{u.item}</td>
              <td>{u.kind}</td>
              <td><span className={'doc-layer doc-layer-' + u.layer.toLowerCase()}>{u.layer}</span></td>
              <td className="mono">{u.refresh}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="doc-h3" style={{ marginTop: 20 }}>Downstream consumers <span className="doc-h3-sub">· {lineage.downstream.length} items depend on this model</span></h3>
      <table className="doc-table">
        <thead><tr><th>Item</th><th>Kind</th><th>Workspace</th><th>30d viewers</th><th>Last view</th></tr></thead>
        <tbody>
          {lineage.downstream.map((d, i) => (
            <tr key={i}>
              <td><b>{d.item}</b></td>
              <td>{d.kind}</td>
              <td className="mono">{d.ws}</td>
              <td className="mono doc-td-num">{d.viewers}</td>
              <td className="mono">{d.lastView}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/* ── audience-specific page sequences ─────────────────────────────────── */

function auditorPages(ctx) {
  const s = ctx.sample;
  return [
    // 1 — Cover
    <DocCover key="cov" ctx={ctx} audienceLabel="Auditor" audienceTone="rose"
              subtitle="Compliance evidence pack · schema, RLS, sensitivity, findings, owners."
              version="2026.05 · evidence build"/>,

    // 2 — Exec summary
    <>
      <ExecKpiGrid kpis={s.execSummary.kpis} narrative={s.execSummary.narrative + ' This document accompanies the source dataset as SOC 2 / ISO 27001 evidence.'} />
      <h2 className="doc-h2">Scope &amp; method</h2>
      <p className="doc-p">Evidence drawn from Microsoft Fabric Admin API: <code className="mono">/v1/admin/datasets</code>, Scanner <code className="mono">getInfo</code>, and <code className="mono">/v1/admin/tenantsettings</code>. Refresh evidence from <code className="mono">/admin/activityevents</code>. RLS rules pulled from model definition (.bim) via Scanner.</p>
      <p className="doc-p">Auditor sign-off block on the final page.</p>
    </>,

    // 2.5 — Model maturity
    <QualityScoreSection quality={s.quality} />,

    // 3 — Tables
    <>
      <TablesOverview tables={s.tables} />
      <ColumnsForTable table={s.tables[0]} />
    </>,

    // 4 — Columns continued
    <>
      <h2 className="doc-h2">Columns — dimensions</h2>
      {s.tables.slice(1).map(t => <ColumnsForTable key={t.name} table={t} />)}
    </>,

    // 5 — Relationships
    <RelationshipsTable rels={s.relationships} />,

    // 6 — RLS + Sensitivity + OLS
    <>
      <RlsTable rls={s.rls} />
      <OlsSection ols={s.ols} />
      <SensLabelsTable labels={s.sensLabels} />
    </>,

    // 6.5 — Access (who can read; RLS scoping evidence)
    <AccessSection access={s.access} audience="auditor" />,

    // 6.7 — Refresh reliability evidence (+ incremental policy)
    <RefreshHistorySection refresh={s.refresh} incremental={s.incremental} audience="auditor" />,

    // 6.9 — Capacity / cost evidence
    <CostAttributionSection cost={s.cost} audience="auditor" />,

    // 7 — Findings + measure hygiene
    <FindingsList findings={s.findings} />,

    // 7.2 — Measure usage / dormancy (governance hygiene)
    <MeasureUsageSection usage={s.measureUsage} />,

    // 7.5 — Compliance glossary appendix (Process + Acronym types)
    <>
      <GlossaryList
        terms={ctx.attachedGlossary.filter(t => t.type === 'process' || t.type === 'acronym')}
        title="Compliance terminology"
        subtitle="Processes and acronyms relevant to this evidence pack — attached to the model in LayerPulse."/>
    </>,

    // 8 — Owners + changelog + sign-off (pulls real roles from LP)
    <>
      <OwnersTable ctx={ctx} />
      <ChangelogTable entries={s.changelog} limit={8} />
      <div className="doc-signoff">
        <h3 className="doc-h3" style={{ marginTop: 22, marginBottom: 14 }}>Sign-off</h3>
        <p className="doc-p doc-p-sub">Signatures required from the LP-captured Owner and Stewards before submission.</p>
        <div className="doc-signoff-row">
          <div className="doc-signoff-cell">
            <div className="doc-signoff-label">Owner</div>
            <div style={{ fontSize: '10pt', fontWeight: 600, marginTop: 6 }}>{ctx.owner ? ctx.owner.name : <em style={{ color: '#b91c1c' }}>— not assigned —</em>}</div>
            <div className="doc-signoff-line"/>
            <div className="doc-signoff-sub">Signature · date</div>
          </div>
          {ctx.stewards.length === 0 ? (
            <div className="doc-signoff-cell">
              <div className="doc-signoff-label">Steward</div>
              <div style={{ fontSize: '9pt', color: '#b91c1c', fontStyle: 'italic', marginTop: 6 }}>No stewards assigned in LP.</div>
              <div className="doc-signoff-line"/>
              <div className="doc-signoff-sub">Add via /ownership</div>
            </div>
          ) : (
            ctx.stewards.slice(0, 2).map((st, i) => (
              <div key={st.userEmail} className="doc-signoff-cell">
                <div className="doc-signoff-label">Steward · {i + 1}</div>
                <div style={{ fontSize: '10pt', fontWeight: 600, marginTop: 6 }}>{st.name}</div>
                <div className="doc-signoff-line"/>
                <div className="doc-signoff-sub">Signature · date</div>
              </div>
            ))
          )}
        </div>
        {ctx.stewards.length > 2 && <div style={{ fontSize: '9pt', color: '#94a3b8', marginTop: 8 }}>+ {ctx.stewards.length - 2} additional steward(s) on file in LP.</div>}
        <div className="doc-signoff-row" style={{ marginTop: 22 }}>
          <div className="doc-signoff-cell">
            <div className="doc-signoff-label">External auditor</div>
            <div className="doc-signoff-line"/>
            <div className="doc-signoff-sub">Name · firm · date</div>
          </div>
        </div>
      </div>
    </>,
  ];
}

function analystPages(ctx) {
  const s = ctx.sample;
  return [
    <DocCover key="cov" ctx={ctx} audienceLabel="Analyst" audienceTone="sky"
              subtitle="Onboarding handoff · schema, measures, glossary, owners."
              version="2026.05 · handoff build"/>,

    <>
      <ExecKpiGrid kpis={s.execSummary.kpis} narrative={s.execSummary.narrative + ' Use this document as your starting point — most analyst questions are answered in the Measures and Glossary sections.'} />
      <ExecNoteBlock note={s.execNote}/>
      <ContactCard ctx={ctx}/>
      <TocList items={[
        { title: '1 · Tables &amp; columns',   page: 3 },
        { title: '2 · Relationships + hierarchies', page: 4 },
        { title: '3 · Measures (no DAX)',    page: 5 },
        { title: '4 · Glossary &amp; owners',   page: 6 },
      ]}/>
    </>,

    <>
      <TablesOverview tables={s.tables} />
      <ColumnsForTable table={s.tables[0]} />
    </>,

    <>
      <h2 className="doc-h2">Columns — dimensions</h2>
      {s.tables.slice(1).map(t => <ColumnsForTable key={t.name} table={t} />)}
      <RelationshipsTable rels={s.relationships} />
      <HierarchiesSection hierarchies={s.hierarchies} />
    </>,

    <MeasuresList measures={s.measures} withDax={false} />,

    // Model maturity — "is this trustworthy?"
    <QualityScoreSection quality={s.quality} />,

    // Refresh history — stale data = not trustworthy
    <RefreshHistorySection refresh={s.refresh} incremental={s.incremental} audience="analyst" />,

    // Adoption — where is this model used?
    <AdoptionSection adoption={s.adoption} lineage={s.lineage} audience="analyst" />,

    <>
      <GlossaryList terms={ctx.attachedGlossary} title="Business glossary" subtitle={`${ctx.attachedGlossary.length} terms attached to this model in LayerPulse · grouped by type`}/>
      <OwnersTable ctx={ctx} />
    </>,
  ];
}

/* ContactCard — "Questions? Contact:" block for Analyst preset.
   Uses SME if assigned in LP, otherwise falls back to Owner with an
   explicit indicator. Renders blanks visibly if neither is set. */
function ContactCard({ ctx }) {
  const person = ctx.sme || (ctx.owner ? { name: ctx.owner.name, userEmail: ctx.owner.email, title: '', fallback: true } : null);
  if (!person) {
    return (
      <div style={{ padding: '10px 14px', border: '0.75pt solid #cbd5e1', borderLeft: '3pt solid #b91c1c', borderRadius: 2, background: '#fef2f2', margin: '12px 0' }}>
        <div className="lp-eyebrow" style={{ color: '#b91c1c', fontSize: '8.5pt' }}>Questions? Contact:</div>
        <div style={{ fontSize: '10.5pt', fontStyle: 'italic', color: '#94a3b8', marginTop: 4 }}>No SME or Owner assigned. Add via LayerPulse /ownership before sharing this doc.</div>
      </div>
    );
  }
  return (
    <div style={{ padding: '10px 14px', border: '0.75pt solid #cbd5e1', borderLeft: '3pt solid #0D3159', borderRadius: 2, background: '#f8fafc', margin: '12px 0' }}>
      <div className="lp-eyebrow" style={{ fontSize: '8.5pt' }}>Questions? Contact:</div>
      <div style={{ fontSize: '11pt', fontWeight: 700, marginTop: 4 }}>
        {person.name}
        {person.fallback && <span style={{ fontSize: '8.5pt', fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>(SME not assigned — uses Owner)</span>}
      </div>
      <div className="mono" style={{ fontSize: '9.5pt', color: '#64748b' }}>{person.userEmail || person.email}</div>
      {person.title && <div style={{ fontSize: '9.5pt', color: '#64748b' }}>{person.title}</div>}
    </div>
  );
}

function executivePages(ctx) {
  const s = ctx.sample;
  return [
    <DocCover key="cov" ctx={ctx} audienceLabel="Executive" audienceTone="amber"
              subtitle="QBR-ready summary · 6 KPIs, narrative, top measures."
              version="2026.05 · QBR build"/>,

    <>
      <ExecKpiGrid kpis={s.execSummary.kpis} narrative={s.execSummary.narrative + ' Fed reports total ' + s.lineage.downstream.reduce((a, x) => a + x.viewers, 0) + '+ viewers in the last 30 days; this model is the load-bearing source for executive-tier dashboards.'} big />
      <ExecNoteBlock note={s.execNote}/>
      <h2 className="doc-h2">Top measures</h2>
      <div className="doc-exec-measures">
        {s.measures.slice(0, 4).map(m => {
          const attached = DATA.glossary.items.filter(t => (t.linkedTo?.measures || []).includes(m.name))[0];
          const def = attached ? (attached.definition || '').split('. ')[0] + '.' : null;
          return (
            <div key={m.name} className="doc-exec-measure">
              <div className="doc-exec-measure-name mono">{m.name}</div>
              {def
                ? <div className="doc-exec-measure-desc">{def}</div>
                : <div className="doc-exec-measure-desc" style={{ color: '#cbd5e1', fontStyle: 'italic' }}>No business term attached</div>}
              <div className="doc-exec-measure-fmt mono">{m.format}</div>
            </div>
          );
        })}
      </div>
    </>,

    // Adoption — reach for the QBR
    <AdoptionSection adoption={s.adoption} lineage={s.lineage} audience="executive" />,

    // Capacity / cost — what this model costs to run
    <CostAttributionSection cost={s.cost} audience="executive" />,

    <>
      <GlossaryList terms={ctx.attachedGlossary.filter(t => t.type === 'kpi' || t.type === 'metric').slice(0, 6)} title="KPI &amp; metric definitions" subtitle="Business-canonical definitions of every KPI on the cover" />
    </>,
  ];
}

function engineerPages(ctx) {
  const s = ctx.sample;
  return [
    <DocCover key="cov" ctx={ctx} audienceLabel="Engineer" audienceTone="violet"
              subtitle="Full technical detail · schema, DAX, lineage, calc-cols, change log."
              version="2026.05 · technical build"/>,

    <TocList items={[
      { title: '1 · Tables &amp; columns (full)',  page: 3 },
      { title: '2 · ER diagram',                page: 5 },
      { title: '3 · Power Query (M)',           page: 6 },
      { title: '4 · Measures + DAX',            page: 7 },
      { title: '5 · Relationships + calc cols', page: 9 },
      { title: '6 · Lineage · maturity · refresh · access · adoption', page: 10 },
      { title: '7 · Change log + technical glossary', page: 15 },
    ]}/>,

    <>
      <TablesOverview tables={s.tables} />
      <ColumnsForTable table={s.tables[0]} />
    </>,

    <>
      <h2 className="doc-h2">Columns — dimensions (full)</h2>
      {s.tables.slice(1).map(t => <ColumnsForTable key={t.name} table={t} />)}
    </>,

    <ErDiagram erd={s.erd} rels={s.relationships} />,

    // Hierarchies + calculation groups / perspectives / translations
    <>
      <HierarchiesSection hierarchies={s.hierarchies} />
      <CalcGroupsSection calcGroups={s.calcGroups} perspectives={s.perspectives} translations={s.translations} />
    </>,

    // Power Query (M) — ingestion/transform layer, before DAX
    <PowerQuerySection mQueries={s.mQueries} />,

    <MeasuresList measures={s.measures.slice(0, 4)} withDax />,

    <MeasuresList measures={s.measures.slice(4)} withDax />,

    // Measure usage / dormancy
    <MeasureUsageSection usage={s.measureUsage} />,

    <>
      <RelationshipsTable rels={s.relationships} />
      <h2 className="doc-h2">Calculated columns</h2>
      <p className="doc-p doc-p-sub">14 calculated columns in the model. Top 5 by storage:</p>
      <table className="doc-table">
        <thead><tr><th>Table</th><th>Column</th><th>Type</th><th>Approx storage</th></tr></thead>
        <tbody>
          <tr><td className="mono">FactSales</td><td className="mono">[NetAmountUSD]</td><td className="mono">Decimal(18,4)</td><td className="mono doc-td-num">82 MB</td></tr>
          <tr><td className="mono">DimCustomer</td><td className="mono">[FullName]</td><td className="mono">Text</td><td className="mono doc-td-num">14 MB</td></tr>
          <tr><td className="mono">DimProduct</td><td className="mono">[CategoryFull]</td><td className="mono">Text</td><td className="mono doc-td-num">3.2 MB</td></tr>
          <tr><td className="mono">FactSales</td><td className="mono">[OrderMonthKey]</td><td className="mono">Int64</td><td className="mono doc-td-num">2.8 MB</td></tr>
          <tr><td className="mono">DimDate</td><td className="mono">[FiscalQtrLabel]</td><td className="mono">Text</td><td className="mono doc-td-num">0.4 MB</td></tr>
        </tbody>
      </table>
    </>,

    // Storage / size breakdown (VertiPaq)
    <StorageSection storage={s.storage} />,

    // OLS — pairs with the Access section for full security picture
    <OlsSection ols={s.ols} />,

    <LineageBlocks lineage={s.lineage} />,

    // Model maturity — engineering scorecard
    <QualityScoreSection quality={s.quality} />,

    // Refresh history (+ incremental policy) — first place to look when numbers go stale
    <RefreshHistorySection refresh={s.refresh} incremental={s.incremental} audience="engineer" />,

    // Access — verify RLS scoping ("does my RLS work?")
    <AccessSection access={s.access} audience="engineer" />,

    // Capacity / cost — CU consumption + refresh/query split
    <CostAttributionSection cost={s.cost} audience="engineer" />,

    // Adoption — consumer load (what breaks if this model breaks)
    <AdoptionSection adoption={s.adoption} lineage={s.lineage} audience="engineer" />,

    <ChangelogTable entries={s.changelog} />,

    // Technical glossary appendix (Acronym + Dimension types) for engineer audience
    <GlossaryList
      terms={ctx.attachedGlossary.filter(t => t.type === 'acronym' || t.type === 'dimension')}
      title="Technical glossary"
      subtitle="Acronyms and dimensions used in this model — for engineers maintaining or extending it."/>,
  ];
}

/* ─────────────────────────────────────────────────────────────────────────
   COMPLETE document — the single maximum-value canonical render.
   Three tiers: fused cover scorecard → briefing body (group-led, source-tagged)
   → exhaustive appendices. See docs/plans/2026-05-22-complete-document-design.md.
   ───────────────────────────────────────────────────────────────────────── */

const SRC_META = {
  auto:    { lbl: 'Automated · Fabric API', color: '#16a34a' },
  manual:  { lbl: 'Manual · LayerPulse',    color: '#7c3aed' },
  derived: { lbl: 'Derived',                color: '#0891b2' },
};

function GroupLead({ n, title, source = 'auto' }) {
  const m = SRC_META[source];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0 14px', paddingBottom: 8, borderBottom: '2px solid #e5e8ec' }}>
      <span className="mono" style={{ fontSize: '10pt', fontWeight: 700, color: '#94a3b8' }}>{n}</span>
      <h2 className="doc-h2" style={{ margin: 0, border: 'none', padding: 0, flex: 1 }}>{title}</h2>
      <span style={{ fontSize: '7.5pt', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: m.color, background: m.color + '1a', padding: '3px 9px', borderRadius: 5, whiteSpace: 'nowrap' }}>{m.lbl}</span>
    </div>
  );
}

function TierDivider({ label, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div className="mono" style={{ fontSize: '9pt', letterSpacing: '.18em', color: '#94a3b8', fontWeight: 700 }}>{label}</div>
      {sub && <div style={{ fontSize: '9.5pt', color: '#64748b', marginTop: 6, maxWidth: 460, margin: '6px auto 0' }}>{sub}</div>}
    </div>
  );
}

function SignOffBlock({ ctx }) {
  return (
    <div className="doc-signoff">
      <h3 className="doc-h3" style={{ marginTop: 22, marginBottom: 14 }}>Sign-off</h3>
      <p className="doc-p doc-p-sub">Signatures from the LP-captured Owner and Stewards.</p>
      <div className="doc-signoff-row">
        <div className="doc-signoff-cell">
          <div className="doc-signoff-label">Owner</div>
          <div style={{ fontSize: '10pt', fontWeight: 600, marginTop: 6 }}>{ctx.owner ? ctx.owner.name : <em style={{ color: '#b91c1c' }}>— not assigned —</em>}</div>
          <div className="doc-signoff-line"/>
          <div className="doc-signoff-sub">Signature · date</div>
        </div>
        {ctx.stewards.length === 0 ? (
          <div className="doc-signoff-cell">
            <div className="doc-signoff-label">Steward</div>
            <div style={{ fontSize: '9pt', color: '#b91c1c', fontStyle: 'italic', marginTop: 6 }}>No stewards assigned in LP.</div>
            <div className="doc-signoff-line"/>
            <div className="doc-signoff-sub">Add via /ownership</div>
          </div>
        ) : (
          ctx.stewards.slice(0, 2).map((st, i) => (
            <div key={st.userEmail} className="doc-signoff-cell">
              <div className="doc-signoff-label">Steward · {i + 1}</div>
              <div style={{ fontSize: '10pt', fontWeight: 600, marginTop: 6 }}>{st.name}</div>
              <div className="doc-signoff-line"/>
              <div className="doc-signoff-sub">Signature · date</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CompleteCover({ ctx }) {
  const s = ctx.sample;
  const q = s.quality;
  const cert = s.certification;
  const purpose = (s.execSummary.narrative || '').split('. ')[0] + '.';
  const barColor = (v) => v >= 8 ? '#16a34a' : v >= 6.5 ? '#ca8a04' : '#dc2626';
  const glossN = ctx.attachedGlossary.length;
  const procN = ctx.attachedGlossary.filter(t => t.type === 'process').length;
  const meter = [
    { k: 'Owner', ok: !!ctx.owner },
    { k: 'SME', ok: !!ctx.sme },
    { k: `Stewards (${ctx.stewards.length})`, ok: ctx.stewards.length > 0 },
    { k: `Glossary (${glossN})`, ok: glossN > 0 },
    { k: 'Processes', ok: procN > 0 },
  ];

  // KEEP / OPTIMIZE / RETIRE verdict — deterministic RAG over 4 axes (matches LP T1.18 Model Scorecard).
  const rag = (good, amber) => (good ? 'g' : amber ? 'a' : 'r');
  const r90 = s.refresh.windows.find(w => /90d/.test(w.window)) || { ok: 1, runs: 1 };
  const refreshOk = r90.ok / r90.runs;
  const dormantPct = s.measureUsage.dormant / s.measureUsage.total;
  const verdictAxes = [
    { name: 'Adoption', rag: rag(s.adoption.mau >= 100 && dormantPct < 0.4, s.adoption.mau >= 30) },
    { name: 'Cost',     rag: rag(s.cost.shareOfCapacityPct <= 20, s.cost.shareOfCapacityPct <= 40) },
    { name: 'Quality',  rag: rag(q.score >= 8, q.score >= 6.5) },
    { name: 'Refresh',  rag: rag(refreshOk >= 0.95, refreshOk >= 0.85) },
  ];
  const reds = verdictAxes.filter(a => a.rag === 'r').length;
  const ambers = verdictAxes.filter(a => a.rag === 'a').length;
  const verdict = verdictAxes[0].rag === 'r'
    ? { label: 'RETIRE', tone: '#e11d48', why: 'Barely used — candidate to retire or consolidate.' }
    : (reds > 0 || ambers >= 2)
      ? { label: 'OPTIMIZE', tone: '#f59e0b', why: 'High value with fixable weak spots — optimize before it drifts.' }
      : { label: 'KEEP', tone: '#16a34a', why: 'Heavily used, healthy, and earning its CU — keep as the canonical source.' };
  const RAG_C = { g: '#16a34a', a: '#f59e0b', r: '#e11d48' };

  return (
    <div className="doc-cover">
      <div className="doc-cover-brand">
        {ctx.includeLogo && <div className="doc-cover-logo">LP</div>}
        <span className="doc-cover-brand-name">LayerPulse</span>
        <span className="doc-cover-brand-sep">·</span>
        <span className="doc-cover-brand-tenant">Contoso Fabric</span>
      </div>

      <div className="doc-cover-eyebrow-row">
        <div className="doc-cover-eyebrow" data-tone="emerald">Complete document · full scope</div>
        {cert?.status && cert.status !== 'None' && (
          <div className={'doc-cert-badge doc-cert-' + cert.status.toLowerCase()}>
            <Icon name="shield-check" size={12}/>{cert.status} · {cert.by}
          </div>
        )}
      </div>

      <h1 className="doc-cover-title">{ctx.model}</h1>
      <div className="doc-cover-sub">{purpose}</div>

      {/* KEEP / OPTIMIZE / RETIRE verdict band (LP T1.18 Model Scorecard) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16, padding: '12px 16px', border: '1px solid #e5e8ec', borderLeft: '5px solid ' + verdict.tone, borderRadius: 10, background: '#f8fafc' }}>
        <div style={{ fontSize: '14pt', fontWeight: 700, letterSpacing: '.04em', color: '#fff', background: verdict.tone, padding: '6px 16px', borderRadius: 8, whiteSpace: 'nowrap' }}>{verdict.label}</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', flex: 1 }}>
          {verdictAxes.map(a => (
            <span key={a.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '9.5pt', fontWeight: 600, color: '#334155' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: RAG_C[a.rag], display: 'inline-block' }}/>{a.name}
            </span>
          ))}
        </div>
      </div>
      <div style={{ fontSize: '9pt', color: '#64748b', marginTop: 6, fontStyle: 'italic' }}>Verdict: {verdict.why}</div>

      {/* Scorecard: health + dimensions */}
      <div style={{ display: 'flex', gap: 20, marginTop: 18, alignItems: 'stretch' }}>
        <div style={{ flex: '0 0 124px', border: '1px solid #e5e8ec', borderRadius: 10, padding: '14px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="mono" style={{ fontSize: '30pt', fontWeight: 700, lineHeight: 1, color: barColor(q.score) }}>{q.score.toFixed(1)}</div>
          <div style={{ fontSize: '8.5pt', color: '#64748b', marginTop: 2 }}>/ 10 · {q.tier}</div>
          <div style={{ fontSize: '8pt', color: '#94a3b8', marginTop: 6 }}>Health score</div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="doc-quality-bars">
            {q.breakdown.map(b => (
              <div key={b.dim} className="doc-quality-row">
                <span className="doc-quality-dim">{b.dim}</span>
                <span className="doc-quality-track"><span className="doc-quality-fill" style={{ width: (b.val * 10) + '%', background: barColor(b.val) }}/></span>
                <span className="mono doc-quality-val">{b.val.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Headline KPIs */}
      <div className="doc-kpi-grid" style={{ marginTop: 16 }}>
        {s.execSummary.kpis.slice(0, 4).map(k => (
          <div key={k.label} className="doc-kpi-tile">
            <div className="doc-kpi-l">{k.label}</div>
            <div className="doc-kpi-v mono">{k.value}</div>
            <div className="doc-kpi-s">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Identity + ownership meta */}
      <div className="doc-cover-meta" style={{ marginTop: 16 }}>
        <div><span className="doc-cover-k">Workspace</span><span className="doc-cover-v mono">{ctx.ws}</span></div>
        <div><span className="doc-cover-k">Environment</span><span className="doc-cover-v mono">{ctx.env}</span></div>
        <div><span className="doc-cover-k">Domain</span><span className="doc-cover-v">{ctx.domain ? ctx.domain.label : '— not set —'}</span></div>
        <div><span className="doc-cover-k">Owner</span><span className="doc-cover-v">{ctx.owner ? ctx.owner.name : <em style={{ color: '#b91c1c' }}>— not assigned —</em>}{ctx.owner?.source === 'workspace' && <span style={{ fontSize: '8pt', color: '#94a3b8', marginLeft: 5 }}>(inherited)</span>}</span></div>
        <div><span className="doc-cover-k">SME</span><span className="doc-cover-v">{ctx.sme ? ctx.sme.name : <em style={{ color: '#94a3b8' }}>— not set —</em>}</span></div>
        <div><span className="doc-cover-k">Generated</span><span className="doc-cover-v">{ctx.generatedAt}</span></div>
      </div>

      {/* Manual-layer completeness meter */}
      <div style={{ marginTop: 16, padding: '12px 14px', background: '#f8fafc', border: '1px solid #e5e8ec', borderRadius: 10 }}>
        <div style={{ fontSize: '8pt', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>Manual layer completeness</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {meter.map(m => (
            <span key={m.k} style={{ fontSize: '8.5pt', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 6, background: m.ok ? '#dcfce7' : '#fee2e2', color: m.ok ? '#166534' : '#991b1b' }}>
              {m.ok ? '✓' : '✗'} {m.k}
            </span>
          ))}
        </div>
      </div>

      {/* Source legend */}
      <div className="doc-cover-foot" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span><b style={{ color: '#16a34a' }}>● Automated</b> — Fabric Scanner / Admin API / Metrics App</span>
        <span><b style={{ color: '#7c3aed' }}>● Manual</b> — captured in LayerPulse (ownership, glossary)</span>
      </div>
    </div>
  );
}

function completePages(ctx) {
  const s = ctx.sample;
  const g = ctx.attachedGlossary;
  return [
    <CompleteCover key="cov" ctx={ctx} />,

    <TocList items={[
      { title: 'Tier 1 · Cover scorecard',              page: 1 },
      { title: '1 · Executive summary + owner note',    page: 3 },
      { title: '2 · Trust &amp; health',                page: 4 },
      { title: '3 · Schema (tables · relationships · ER · hierarchies)', page: 5 },
      { title: '4 · Logic (measures · calc groups)',    page: 7 },
      { title: '5 · Governance &amp; security',         page: 8 },
      { title: '6 · Lineage &amp; usage',               page: 10 },
      { title: '7 · Business context (glossary)',       page: 12 },
      { title: '8 · Ownership &amp; sign-off',          page: 13 },
      { title: 'Appendix A–D · exhaustive reference',   page: 14 },
    ]}/>,

    // ── Tier 2 · body ──
    <>
      <GroupLead n="1" title="Executive summary" source="auto"/>
      <ExecKpiGrid kpis={s.execSummary.kpis} narrative={s.execSummary.narrative}/>
      <ExecNoteBlock note={s.execNote}/>
    </>,

    <>
      <GroupLead n="2" title="Trust & health" source="auto"/>
      <QualityScoreSection quality={s.quality}/>
      <RefreshHistorySection refresh={s.refresh} incremental={s.incremental} audience="engineer"/>
      <FindingsList findings={s.findings}/>
    </>,

    <>
      <GroupLead n="3" title="Schema — tables & relationships" source="auto"/>
      <TablesOverview tables={s.tables}/>
      <RelationshipsTable rels={s.relationships}/>
    </>,
    <>
      <ErDiagram erd={s.erd} rels={s.relationships}/>
      <HierarchiesSection hierarchies={s.hierarchies}/>
    </>,

    <>
      <GroupLead n="4" title="Logic — measures & calc groups" source="auto"/>
      <p className="doc-p doc-p-sub">Descriptions are drawn from attached business-glossary terms; measures with no term attached show no description (see Appendix B for full DAX).</p>
      <MeasuresList measures={s.measures.slice(0, 8)}/>
      <CalcGroupsSection calcGroups={s.calcGroups} perspectives={s.perspectives} translations={s.translations}/>
    </>,

    <>
      <GroupLead n="5" title="Governance & security" source="auto"/>
      <RlsTable rls={s.rls}/>
      <OlsSection ols={s.ols}/>
      <SensLabelsTable labels={s.sensLabels}/>
    </>,
    <AccessSection access={s.access} audience="auditor"/>,

    <>
      <GroupLead n="6" title="Lineage & usage" source="auto"/>
      <LineageBlocks lineage={s.lineage}/>
      <AdoptionSection adoption={s.adoption} lineage={s.lineage} audience="engineer"/>
    </>,
    <>
      <StorageSection storage={s.storage}/>
      <CostAttributionSection cost={s.cost} audience="engineer"/>
    </>,

    <>
      <GroupLead n="7" title="Business context" source="manual"/>
      <GlossaryList terms={g} title="Business glossary"
        subtitle="Every term attached to this model in LayerPulse, grouped by type. Measure, column, and table descriptions throughout this document are drawn from these definitions — nothing is invented."/>
    </>,

    <>
      <GroupLead n="8" title="Ownership & sign-off" source="manual"/>
      <OwnersTable ctx={ctx}/>
      <ChangelogTable entries={s.changelog} limit={8}/>
      <SignOffBlock ctx={ctx}/>
    </>,

    // ── Tier 3 · appendices ──
    <TierDivider label="A P P E N D I C E S" sub="Exhaustive reference — the full inventories that would bloat the briefing body above."/>,

    <>
      <GroupLead n="A" title="Appendix A — full column inventory" source="auto"/>
      {s.tables.map(t => <ColumnsForTable key={t.name} table={t}/>)}
    </>,

    <>
      <GroupLead n="B" title="Appendix B — full DAX" source="auto"/>
      <MeasuresList measures={s.measures} withDax/>
    </>,

    <>
      <GroupLead n="C" title="Appendix C — Power Query (M)" source="auto"/>
      <PowerQuerySection mQueries={s.mQueries}/>
    </>,

    <>
      <GroupLead n="D" title="Appendix D — measure usage & dormancy" source="derived"/>
      <MeasureUsageSection usage={s.measureUsage}/>
    </>,
  ];
}

export function Governance() {
  const [filter, setFilter] = React.useState('all');
  const [open, setOpen] = React.useState({});
  const g = DATA.governance;
  const counts = {
    all: g.findings.length,
    critical: g.findings.filter(f => f.sev === 'critical').length,
    warning:  g.findings.filter(f => f.sev === 'warning').length,
    info:     g.findings.filter(f => f.sev === 'info').length,
  };
  const findings = filter === 'all' ? g.findings : g.findings.filter(f => f.sev === filter);

  const R = 46, C = 2 * Math.PI * R;

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Governance</h1>
          <p className="lp-page-sub">Tenant compliance against your governance policy. Evaluated hourly against {g.settingsCount} admin settings.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="external" size={14}/>Open Fabric admin</button>
          <button className="btn btn-sm"><Icon name="refresh" size={14}/>Re-evaluate</button>
        </div>
      </div>

      <div className="gov-hero fade-in">
        <div className="gov-score">
          <svg width="140" height="140" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--muted)" strokeWidth="10"/>
            <circle cx="60" cy="60" r={R} fill="none"
              stroke="oklch(0.65 0.18 45)" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - g.score / 100)}
              transform="rotate(-90 60 60)"
            />
            <text x="60" y="58" textAnchor="middle" fontSize="28" fontWeight="700" fontFamily="JetBrains Mono" fill="var(--foreground)">{g.score}</text>
            <text x="60" y="76" textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono" fill="var(--muted-foreground)">/ 100</text>
          </svg>
        </div>
        <div className="gov-hero-meta">
          <div className="lp-eyebrow">Compliance score</div>
          <div className="gov-hero-line">
            <b>{g.compliantRules}</b> of <b>{g.totalRules}</b> rules compliant · evaluating <b>{g.settingsCount}</b> settings
          </div>
          <div className="gov-pill-row">
            <span className="gov-pill gov-pill-crit"><b>{counts.critical}</b> critical</span>
            <span className="gov-pill gov-pill-warn"><b>{counts.warning}</b> warning</span>
            <span className="gov-pill gov-pill-info"><b>{counts.info}</b> info</span>
          </div>
          <div className="gov-bar">
            <div className="gov-bar-seg crit" style={{ width: (counts.critical / counts.all * 100) + '%' }} title={`${counts.critical} critical`}/>
            <div className="gov-bar-seg warn" style={{ width: (counts.warning / counts.all * 100) + '%' }} title={`${counts.warning} warning`}/>
            <div className="gov-bar-seg info" style={{ width: (counts.info / counts.all * 100) + '%' }} title={`${counts.info} info`}/>
          </div>
        </div>
      </div>

      <div className="lp-section-head">
        <h2>Findings <span className="count">{findings.length}</span></h2>
        <span className="seg-tabs">
          {[['all','All ' + counts.all],['critical','Critical ' + counts.critical],['warning','Warning ' + counts.warning],['info','Info ' + counts.info]].map(([k,l]) => (
            <button key={k} className={'seg-tab' + (filter === k ? ' active' : '')} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </span>
      </div>

      <div className="lp-card lp-card-flush fade-in d2">
        {findings.map(f => (
          <div key={f.id} className={'gov-row gov-sev-' + f.sev}>
            <button className="gov-row-main" onClick={() => setOpen(o => ({ ...o, [f.id]: !o[f.id] }))}>
              <span className={'sev-mark sev-' + f.sev} aria-hidden/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="gov-row-title">{f.title}</div>
                <div className="gov-row-meta">
                  <span className="mono">{f.id}</span>
                  <span className="sep">·</span>
                  <span>{f.cat}</span>
                  <span className="sep">·</span>
                  <span className={'sev-label ' + f.sev}>{f.sev}</span>
                </div>
              </div>
              <Icon name={open[f.id] ? 'chevron-up' : 'chevron-down'} size={14}/>
            </button>
            {open[f.id] && (
              <div className="gov-row-detail">
                <div className="lp-eyebrow">Detail</div>
                <div className="gov-detail-text">{f.detail}</div>
                <div className="lp-eyebrow" style={{ marginTop: 10 }}>Recommendation</div>
                <div className="gov-recommend"><Icon name="wand" size={13}/>{f.recommend}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn btn-sm"><Icon name="external" size={12}/>Fix in admin portal</button>
                  <button className="btn btn-outline btn-sm">Mark as accepted risk</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="lp-section-head">
        <h2>All settings <span className="count">{g.settingsCount} in {g.categories.length} categories</span></h2>
        <div className="actions">
          <button className="btn btn-ghost btn-sm">Expand all</button>
        </div>
      </div>

      <div className="lp-card lp-card-flush fade-in d3">
        {g.categories.map(cat => (
          <div key={cat.name} className="gov-cat">
            <Icon name="chevron-right" size={14}/>
            <div className="gov-cat-name">{cat.name}</div>
            <div className="gov-cat-bar">
              <div className="gov-cat-fill" style={{ width: (cat.enabled / cat.total * 100) + '%' }}/>
            </div>
            <div className="gov-cat-count mono">{cat.enabled}/{cat.total} enabled</div>
          </div>
        ))}
      </div>
    </>
  );
}

export function Activity() {
  const [filter, setFilter] = React.useState('all');
  const s = DATA.activity.stats;

  const typeIcon = { scan: 'refresh', doc: 'file-text', ai: 'wand', alert: 'alert-triangle', resolve: 'check' };
  const allItems = DATA.activity.items.map(day => ({
    ...day,
    day: day.day.filter(i => filter === 'all' || i.type === filter),
  })).filter(day => day.day.length > 0);

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Activity</h1>
          <p className="lp-page-sub">Audit log of every scan, doc generation, AI analysis, and resolution across your environment.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="external" size={14}/>Export CSV</button>
        </div>
      </div>

      <div className="lp-grid-4 fade-in">
        <StatCard label="Scans this week"  value={s.scans}    icon="refresh"   tone="sky"/>
        <StatCard label="Documents"        value={s.docs}     icon="file-text" tone="emerald"/>
        <StatCard label="AI analyses"      value={s.ai}       icon="wand"      tone="violet"/>
        <StatCard label="Issues resolved"  value={s.resolved} icon="check"     tone="amber"/>
      </div>

      <div className="lp-section-head">
        <h2>Timeline</h2>
        <span className="seg-tabs">
          {[['all','All'],['scan','Scans'],['doc','Documents'],['ai','AI'],['resolve','Resolved']].map(([k,l]) => (
            <button key={k} className={'seg-tab' + (filter === k ? ' active' : '')} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </span>
      </div>

      <div className="fade-in d2">
        {allItems.map(day => (
          <div key={day.date} className="act-day">
            <div className="act-day-head">
              <div className="act-day-date">{day.date}</div>
              <div className="act-day-count">{day.day.length}</div>
              <div className="act-day-line"/>
            </div>
            <div className="act-items">
              {day.day.map((it, idx) => (
                <div key={idx} className="act-item">
                  <span className={'act-dot tone-' + it.tone}>
                    <Icon name={typeIcon[it.type] || 'activity'} size={12}/>
                  </span>
                  <div className="act-text">
                    <span className="act-actor">{it.actor}</span>
                    <span>{it.verb.toLowerCase()}</span>
                    <span className="act-target">{it.target}</span>
                  </div>
                  <span className="act-meta mono">{it.meta}</span>
                  <span className="act-ago">{it.ago}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {allItems.length === 0 && <div className="empty">No activity of that type yet.</div>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
        <button className="btn btn-outline btn-sm">Load more</button>
      </div>
    </>
  );
}
