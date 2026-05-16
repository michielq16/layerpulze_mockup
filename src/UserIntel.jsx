import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { StatCard, Sparkline } from './components';

function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h) + name.charCodeAt(i) | 0;
  const hues = [220, 145, 280, 35, 12, 195];
  return hues[Math.abs(h) % hues.length];
}
function initials(name) {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
}
export function Avatar({ name, size = 36 }) {
  const hue = avatarColor(name);
  return (
    <div className="ui-avatar" style={{
      width: size, height: size,
      background: `oklch(0.94 0.05 ${hue})`,
      color:      `oklch(0.42 0.13 ${hue})`,
      fontSize: size * 0.40,
    }}>{initials(name)}</div>
  );
}

export function Users({ onOpenUser }) {
  const [q, setQ] = React.useState('');
  const [dept, setDept] = React.useState('all');
  const [sort, setSort] = React.useState('cost');

  const u = DATA.users;
  const depts = ['all', ...u.departments.map(d => d.name)];

  const filtered = u.top
    .filter(x => (dept === 'all' || x.dept === dept) && (q === '' || (x.name + x.email).toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => sort === 'queries' ? b.queries - a.queries : sort === 'copilot' ? b.copilot - a.copilot : b.cu - a.cu);

  const maxCU = Math.max(...u.top.map(x => x.cu));

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Users</h1>
          <p className="lp-page-sub">Who consumes your capacity. Cost-attribution by user, department, and team — translated through capacity pricing.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="external" size={14}/>Export CSV</button>
          <button className="btn btn-outline btn-sm"><Icon name="settings" size={14}/>Configure mapping</button>
          <button className="btn btn-sm"><Icon name="bell" size={14}/>New alert</button>
        </div>
      </div>

      <div className="lp-grid-4 fade-in">
        <StatCard label="Active this month"   value={DATA.userIntel.summary.activeMTD} sub="64% of seats" icon="activity" tone="sky"/>
        <StatCard label="Monthly spend"        value={'€' + DATA.userIntel.summary.monthlySpend.toLocaleString()} delta={6} icon="dollar" tone="emerald"/>
        <StatCard label="Power users"          value={u.top.filter(x => x.status === 'power').length} sub="top 5% of consumers" icon="star" tone="amber"/>
        <StatCard label="Copilot users"        value={DATA.userIntel.summary.copilotUsers} unit={' / ' + DATA.userIntel.summary.totalUsers} sub="9% adoption" icon="wand" tone="violet"/>
      </div>

      <div className="lp-section-head">
        <h2>Department breakdown <span className="count">€{u.departments.reduce((s, d) => s + d.cost, 0).toLocaleString()}/mo · 6 departments</span></h2>
      </div>

      <div className="lp-card fade-in d2">
        <div className="dept-ribbon">
          {u.departments.map(d => (
            <div key={d.name} className={'dept-slice tone-' + d.tone} style={{ flex: d.share }} title={`${d.name} · ${d.share}%`}>
              <div className="dept-slice-label">{d.name}</div>
              <div className="dept-slice-val">{d.share}<span className="pct">%</span></div>
            </div>
          ))}
        </div>
        <div className="dept-grid">
          {u.departments.map(d => (
            <div key={d.name} className="dept-card">
              <div className={'dept-dot tone-' + d.tone}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="dept-card-name">{d.name}</div>
                <div className="dept-card-meta">{d.headcount} people · {(d.cu / 1000).toFixed(0)}k CU</div>
              </div>
              <div className="dept-card-cost mono">€{d.cost.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="lp-section-head">
        <h2>Leaderboard <span className="count">Top consumers · {filtered.length} of {u.top.length}</span></h2>
        <span className="seg-tabs">
          {[['cost','By cost'],['queries','By queries'],['copilot','By Copilot']].map(([k,l]) => (
            <button key={k} className={'seg-tab' + (sort === k ? ' active' : '')} onClick={() => setSort(k)}>{l}</button>
          ))}
        </span>
      </div>

      <div className="lp-card lp-card-flush" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="lp-search" style={{ flex: 1, minWidth: 240 }}>
            <Icon name="search" size={14}/>
            <input placeholder="Search by name or email…" value={q} onChange={e => setQ(e.target.value)}/>
          </div>
          <select className="input input-sm" value={dept} onChange={e => setDept(e.target.value)}>
            {depts.map(d => <option key={d} value={d}>{d === 'all' ? 'All departments' : d}</option>)}
          </select>
        </div>
      </div>

      <div className="lp-card lp-card-flush fade-in d3">
        <div className="leader-head">
          <div>User</div>
          <div>Consumption (last 30d)</div>
          <div>Capacity cost</div>
          <div>License</div>
          <div>TCO</div>
          <div>Queries</div>
          <div>Copilot</div>
        </div>
        {filtered.map((user, i) => {
          const tco = user.cost + (user.licenseCost || 0);
          return (
          <button key={user.id} className="leader-row leader-row-tco" onClick={() => onOpenUser(user.id)}>
            <div className="leader-rank mono">{i + 1}</div>
            <div className="leader-user">
              <Avatar name={user.name}/>
              <div style={{ minWidth: 0 }}>
                <div className="leader-name">
                  {user.name}
                  {user.status === 'power' && <span className="pill-power">POWER</span>}
                </div>
                <div className="leader-meta">{user.role} · {user.dept}</div>
              </div>
            </div>
            <div className="leader-bar">
              <div className="leader-bar-track">
                <div className="leader-bar-fill" style={{ width: (user.cu / maxCU * 100) + '%' }}/>
              </div>
              <div className="leader-bar-val mono">{(user.cu / 1000).toFixed(0)}k</div>
              <Sparkline data={user.spark} tone="sky" w={56} h={20}/>
            </div>
            <div className="leader-cost mono">€{user.cost}</div>
            <div>
              <span className="badge badge-outline" style={{ fontSize: 10 }}>{user.licenseSku || '—'}</span>
              <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>€{user.licenseCost || 0}/mo</div>
            </div>
            <div className="leader-cost mono" style={{ color: 'var(--foreground)', fontWeight: 700 }}>€{tco}</div>
            <div className="leader-num mono">{user.queries.toLocaleString()}</div>
            <div className="leader-copilot">
              {user.copilot > 0 ? (
                <>
                  <span className="copilot-dot"><Icon name="wand" size={10}/></span>
                  <span className="mono">{user.copilot}</span>
                </>
              ) : <span className="muted">—</span>}
            </div>
            <Icon name="chevron-right" size={14} className="leader-arrow"/>
          </button>
        );})}
        {filtered.length === 0 && <div className="empty">No users match your filters.</div>}
      </div>
    </>
  );
}

export function UserDetail({ userId, onBack }) {
  const user = DATA.users.top.find(u => u.id === userId) || DATA.users.top[0];
  const d = DATA.userDetail;
  const [tab, setTab] = React.useState('activity');
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const maxHeat = Math.max(...d.heatmap.flat());
  const access = DATA.userAccess?.[userId] || DATA.userAccess?.default;
  const risks = [...(access?.direct || []), ...(access?.viaGroups || []).flatMap(g => g.grants)].filter(r => r.risk);

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar name={user.name} size={56}/>
          <div>
            <h1 className="lp-page-title" style={{ margin: 0 }}>
              {user.name}
              {user.status === 'power' && <span className="pill-power" style={{ marginLeft: 10 }}>POWER USER</span>}
              {user.copilotRate > 0.3 && <span className="pill-copilot" style={{ marginLeft: 6 }}><Icon name="wand" size={10}/>COPILOT POWER</span>}
              {risks.length > 0 && <span className="pill-risk" style={{ marginLeft: 6 }}><Icon name="alert" size={10}/>{risks.length} access risk{risks.length > 1 ? 's' : ''}</span>}
            </h1>
            <p className="lp-page-sub">{user.role} · {user.dept} · {user.email}</p>
          </div>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={onBack}>Back</button>
          <button className="btn btn-outline btn-sm"><Icon name="bell" size={14}/>Watch user</button>
          <button className="btn btn-sm"><Icon name="external" size={14}/>Open in Entra</button>
        </div>
      </div>

      <div className="lp-grid-4 fade-in">
        <StatCard label="Capacity this month" value={(user.cu / 1000).toFixed(0)} unit="k CU" sub={`€${user.cost}`} icon="zap" tone="amber" spark={user.spark}/>
        <StatCard label="Queries"             value={user.queries.toLocaleString()} sub={`${(user.queries / 30 | 0)}/day avg`} icon="bar-chart" tone="sky"/>
        <StatCard label="Datasets touched"    value={user.datasets} sub={`${user.refreshes} refreshes`} icon="database" tone="emerald"/>
        <StatCard label="Copilot sessions"    value={user.copilot} sub={`${Math.round(user.copilotRate * 100)}% of activity`} icon="wand" tone="violet"/>
      </div>

      <div className="model-tabs fade-in d2">
        <button className={'model-tab' + (tab === 'activity' ? ' active' : '')} onClick={() => setTab('activity')}>Activity</button>
        <button className={'model-tab' + (tab === 'access' ? ' active' : '')} onClick={() => setTab('access')}>
          Access & Permissions
          {risks.length > 0 && <span style={{ marginLeft: 5, background: 'oklch(0.55 0.22 25)', color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 5px' }}>{risks.length}</span>}
        </button>
      </div>

      <div key={tab} className="fade-in">
      {tab === 'activity' && <>
        <div className="lp-grid-money">
          <div className="lp-card">
            <div className="lp-card-header">
              <div>
                <div className="lp-card-title">Activity heatmap</div>
                <div className="lp-card-sub">Last 7 days × 24 hours · darker = more events</div>
              </div>
              <span className="lp-eyebrow">Local time (CET)</span>
            </div>
            <div className="heatmap">
              <div className="heatmap-cols">
                <div style={{ width: 40 }}/>
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className="heatmap-hr" style={{ visibility: h % 4 === 0 ? 'visible' : 'hidden' }}>{String(h).padStart(2, '0')}</div>
                ))}
              </div>
              {d.heatmap.map((row, di) => (
                <div key={di} className="heatmap-row">
                  <div className="heatmap-day">{days[di]}</div>
                  {row.map((v, hi) => {
                    const intensity = v / maxHeat;
                    const offHours = hi < 7 || hi > 19 || di >= 5;
                    return (
                      <div key={hi} className={'heatmap-cell' + (offHours && v > 2 ? ' off-hours' : '')} style={{
                        background: v === 0 ? 'var(--muted)' : `oklch(${0.95 - intensity * 0.55} ${0.05 + intensity * 0.15} 237)`,
                      }} title={`${days[di]} ${String(hi).padStart(2, '0')}:00 — ${v} events`}/>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="heatmap-legend">
              <span>less</span>
              <div className="scale">
                {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
                  <div key={v} style={{ background: `oklch(${0.95 - v * 0.55} ${0.05 + v * 0.15} 237)` }}/>
                ))}
              </div>
              <span>more</span>
              <span className="lp-eyebrow" style={{ marginLeft: 'auto' }}>
                <span className="off-hr-mark"/> 7 off-hours sessions
              </span>
            </div>
          </div>

          <div className="lp-card">
            <div className="lp-card-header">
              <div>
                <div className="lp-card-title">Datasets touched</div>
                <div className="lp-card-sub">By query count</div>
              </div>
            </div>
            {d.datasets.map(ds => (
              <div key={ds.name} className="ds-row">
                <div className="ds-row-name">
                  <Icon name="database" size={12}/>
                  <span>{ds.name}</span>
                  <span className="badge badge-outline">{ds.ws}</span>
                </div>
                <div className="ds-row-bar">
                  <div className="ds-row-bar-fill" style={{ width: ds.share + '%' }}/>
                </div>
                <div className="ds-row-val mono">{ds.queries.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lp-section-head"><h2>Recent activity <span className="count">7 events · today</span></h2></div>
        <div className="lp-card lp-card-flush">
          {d.recent.map((r, i) => (
            <div key={i} className="recent-row">
              <span className={'act-dot tone-' + r.tone}>
                <Icon name={({
                  ViewReport: 'bar-chart', AskCopilot: 'wand', ExportData: 'external',
                  EditDataset: 'settings', RefreshDataset: 'refresh',
                })[r.op] || 'activity'} size={12}/>
              </span>
              <span className="recent-op mono">{r.op}</span>
              <span className="recent-target">{r.target}</span>
              <span className="recent-at mono">{r.at}</span>
            </div>
          ))}
        </div>
      </>}

      {tab === 'access' && <UserAccessTab access={access} risks={risks}/>}
      </div>
    </>
  );
}

const ROLE_TONE = { Admin: 'rose', Contributor: 'amber', Member: 'sky', Viewer: 'slate' };
const TYPE_ICON = { workspace: 'layers', app: 'boxes', report: 'bar-chart', dataset: 'database' };

function AccessGrantRow({ grant, depth = 0 }) {
  const [open, setOpen] = React.useState(false);
  const hasReports = (grant.reports?.length > 0) || (grant.datasets?.length > 0);
  const isRisky = !!grant.risk;
  const roleTone = ROLE_TONE[grant.role] || 'slate';

  return (
    <div className={'acc-grant-row' + (isRisky ? ' acc-risk' : '')} style={{ paddingLeft: depth * 20 }}>
      <div className="acc-grant-main" onClick={() => hasReports && setOpen(o => !o)} style={{ cursor: hasReports ? 'pointer' : undefined }}>
        <div className="acc-grant-icon" style={{ background: `var(--modern-icon-bg-${grant.type === 'workspace' ? 'sky' : grant.type === 'app' ? 'violet' : 'emerald'})`, color: `var(--modern-icon-fg-${grant.type === 'workspace' ? 'sky' : grant.type === 'app' ? 'violet' : 'emerald'})` }}>
          <Icon name={TYPE_ICON[grant.type] || 'layers'} size={14}/>
        </div>
        <div className="acc-grant-body">
          <div className="acc-grant-name">{grant.name}</div>
          {isRisky && <div className="acc-risk-label"><Icon name="alert" size={10}/>{grant.risk}</div>}
        </div>
        <div className="acc-grant-meta">
          <span className={'badge tone-' + roleTone + '-soft'}>{grant.role}</span>
          <span className="badge badge-outline">{grant.type}</span>
          {grant.lastUsed && <span className={'acc-last-used mono ' + (grant.lastUsed === 'never' || parseInt(grant.lastUsed) > 30 ? 'val-amber' : '')}>{grant.lastUsed === 'never' ? 'never used' : 'used ' + grant.lastUsed}</span>}
          {hasReports && <Icon name={open ? 'chevron-down' : 'chevron-right'} size={12} style={{ color: 'var(--muted-foreground)' }}/>}
        </div>
      </div>
      {open && (
        <div className="acc-children fade-in">
          {grant.reports?.map(r => (
            <div key={r} className="acc-child-row">
              <Icon name="bar-chart" size={11}/>
              <span>{r}</span>
              <span className="badge badge-outline" style={{ fontSize: 10 }}>Report</span>
            </div>
          ))}
          {grant.datasets?.map(ds => (
            <div key={ds} className="acc-child-row">
              <Icon name="database" size={11}/>
              <span>{ds}</span>
              <span className="badge badge-outline" style={{ fontSize: 10 }}>Dataset</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UserAccessTab({ access, risks }) {
  const [groupOpen, setGroupOpen] = React.useState({});
  const totalDirect = access?.direct?.length || 0;
  const totalGroups = access?.viaGroups?.length || 0;
  const totalGrants = access?.viaGroups?.reduce((s, g) => s + g.grants.length, 0) || 0;
  const totalWorkspaces = new Set([
    ...(access?.direct?.filter(d => d.type === 'workspace').map(d => d.name) || []),
    ...(access?.viaGroups?.flatMap(g => g.grants.filter(gr => gr.type === 'workspace').map(gr => gr.name)) || []),
  ]).size;
  const totalApps = new Set([
    ...(access?.viaGroups?.flatMap(g => g.grants.filter(gr => gr.type === 'app').map(gr => gr.name)) || []),
  ]).size;

  return (
    <>
      {risks.length > 0 && (
        <div className="acc-risk-banner">
          <Icon name="alert" size={15}/>
          <div>
            <b>{risks.length} access risk{risks.length > 1 ? 's' : ''} detected.</b>
            {' '}{risks.map(r => r.risk || r.name).join(' · ')}
          </div>
          <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto', flexShrink: 0 }}>Review access</button>
        </div>
      )}

      <div className="acc-summary-strip">
        {[
          { l: 'Direct assignments', v: totalDirect, icon: 'user' },
          { l: 'Security groups',    v: totalGroups, icon: 'users' },
          { l: 'Workspaces',         v: totalWorkspaces, icon: 'layers' },
          { l: 'Apps',               v: totalApps,   icon: 'boxes' },
          { l: 'Risk flags',         v: risks.length, icon: 'alert', rose: risks.length > 0 },
        ].map(s => (
          <div key={s.l} className="acc-summary-cell">
            <div className={'acc-summary-val mono' + (s.rose ? ' val-rose' : '')}>{s.v}</div>
            <div className="acc-summary-lbl">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Direct assignments */}
      <div className="lp-section-head" style={{ marginTop: 16 }}>
        <h2>Direct assignments <span className="count">{totalDirect}</span></h2>
        <span className="lp-eyebrow">Granted by name to this user</span>
      </div>
      <div className="lp-card lp-card-flush">
        {access?.direct?.length === 0 && <div className="empty">No direct workspace or app assignments.</div>}
        {access?.direct?.map(grant => <AccessGrantRow key={grant.id} grant={grant}/>)}
      </div>

      {/* Via security groups */}
      <div className="lp-section-head" style={{ marginTop: 16 }}>
        <h2>Via security groups <span className="count">{totalGroups} groups · {totalGrants} grants</span></h2>
        <span className="lp-eyebrow">Inherited through AAD group membership</span>
      </div>
      <div className="lp-card lp-card-flush">
        {access?.viaGroups?.map(g => (
          <div key={g.id} className="acc-group-block">
            <button className="acc-group-header" onClick={() => setGroupOpen(o => ({ ...o, [g.id]: !o[g.id] }))}>
              <div className="acc-group-icon">
                <Icon name="users" size={14}/>
              </div>
              <div className="acc-group-name">
                {g.group}
                <span className="acc-group-type badge badge-outline">{g.groupType}</span>
              </div>
              <div className="acc-group-meta">
                <span className="muted" style={{ fontSize: 12 }}>Member since {g.memberSince}</span>
                <span className="badge badge-outline">{g.grants.length} grant{g.grants.length > 1 ? 's' : ''}</span>
                <Icon name={groupOpen[g.id] ? 'chevron-down' : 'chevron-right'} size={13} style={{ color: 'var(--muted-foreground)' }}/>
              </div>
            </button>

            {/* Show grants inline even when collapsed — just less prominent */}
            <div className={'acc-group-grants' + (groupOpen[g.id] ? ' open' : '')}>
              {g.grants.map(grant => (
                <div key={grant.id} className="acc-group-grant-row">
                  <div className="acc-chain-line"/>
                  <div className={'acc-grant-icon sm'} style={{ background: `var(--modern-icon-bg-${grant.type === 'workspace' ? 'sky' : 'violet'})`, color: `var(--modern-icon-fg-${grant.type === 'workspace' ? 'sky' : 'violet'})` }}>
                    <Icon name={TYPE_ICON[grant.type] || 'layers'} size={12}/>
                  </div>
                  <div className="acc-grant-body">
                    <div className="acc-grant-name">{grant.name}</div>
                    {grant.reports?.length > 0 && (
                      <div className="acc-inline-reports">
                        {grant.reports.map(r => (
                          <span key={r} className="acc-report-chip"><Icon name="bar-chart" size={9}/>{r}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="acc-grant-meta">
                    <span className={'badge tone-' + (ROLE_TONE[grant.role] || 'slate') + '-soft'}>{grant.role}</span>
                    <span className="badge badge-outline">{grant.type}</span>
                    {grant.lastUsed && <span className={'acc-last-used mono ' + (grant.lastUsed === 'never' || parseInt(grant.lastUsed) > 30 ? 'val-amber' : '')}>{grant.lastUsed === 'never' ? 'never used' : 'used ' + grant.lastUsed}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
