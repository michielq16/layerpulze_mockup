import React from 'react';
import Icon from './Icon';

// LayerPulse subscription tiers. Promoted out of Settings → its own /billing route
// (operator decision 2026-05-18) — partners check billing monthly, doesn't belong
// behind a Settings sub-tab.
const LP_TIERS = [
  {
    id: 'free', name: 'Free', price: 0, period: '/forever',
    blurb: 'For exploration and personal use.',
    limits: { models: 3, ai: 100, docs: 100, capacities: 1, retention: '7 days' },
    features: ['1 partner seat', 'Up to 3 semantic models', 'Daily ingest only', 'No multi-tenant'],
  },
  {
    id: 'pro', name: 'Pro', price: 49, period: '/mo · per seat', recommended: true,
    blurb: 'For Microsoft partners managing 10–50 customer tenants.',
    limits: { models: 'Unlimited', ai: 5000, docs: 'Unlimited', capacities: 10, retention: '90 days' },
    features: ['Multi-tenant partner portal (F-2)', 'Unlimited semantic models', 'Hourly ingest available', 'Tenant Activity forensic search', 'Documents auto-Word (all audiences)', 'Email digests + standing subscriptions'],
  },
  {
    id: 'enterprise', name: 'Enterprise', price: null, period: 'Contact sales',
    blurb: 'For enterprise direct customers & MSP partners with > 50 tenants.',
    limits: { models: 'Unlimited', ai: 'Unlimited', docs: 'Unlimited', capacities: 'Unlimited', retention: '7 years' },
    features: ['Everything in Pro', 'SOC 2 evidence pack export', '7-year activity retention', 'SSO + custom auth', 'Dedicated success engineer', 'SLA-backed uptime'],
  },
];

export function Billing() {
  const currentTier = 'free';
  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Billing</h1>
          <p className="lp-page-sub">Your LayerPulse plan, usage, and invoices. For your Microsoft contract pricing (capacity + license $$), see <a onClick={() => { if (typeof window !== 'undefined') window.history.pushState({}, '', '/settings'); window.dispatchEvent(new PopStateEvent('popstate')); }} style={{ color: 'oklch(0.50 0.17 237)', cursor: 'pointer', fontWeight: 500 }}>Settings → Pricing</a>.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-outline btn-sm"><Icon name="external" size={12}/>Open billing portal</button>
          <button className="btn btn-sm doc-gen-cta"><Icon name="zap" size={12}/>Upgrade to Pro</button>
        </div>
      </div>

      <div className="settings-tab fade-in d2" style={{ maxWidth: 980 }}>
        <div className="lp-card plan-current">
          <div className="lp-card-header">
            <div>
              <div className="lp-card-title">Your plan · <b>Free</b></div>
              <div className="lp-card-sub">Upgrade to unlock unlimited models, hourly ingest, and the auto-Word Documents flow.</div>
            </div>
          </div>
          <div className="plan-usage">
            {[
              { l: 'Semantic models tracked', v: 3,  max: 3,   over: true },
              { l: 'AI analyses · 30d',       v: 44, max: 100 },
              { l: 'Docs generated · 30d',    v: 18, max: 100 },
              { l: 'Capacities connected',    v: 1,  max: 1,   over: true },
            ].map(r => (
              <div key={r.l} className="plan-usage-row">
                <div className="plan-usage-label">{r.l}</div>
                <div className="plan-usage-bar">
                  <div className="plan-usage-fill" style={{ width: (r.v / r.max * 100) + '%', background: r.v >= r.max ? 'oklch(0.55 0.22 25)' : 'oklch(0.69 0.17 237)' }}/>
                </div>
                <div className="plan-usage-val mono">{r.v}/{r.max}</div>
                {r.over && <span className="badge tone-rose-soft" style={{ fontSize: 9.5 }}>at cap</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="lp-section-head"><h2>Compare tiers</h2></div>

        <div className="plan-tier-grid">
          {LP_TIERS.map(t => (
            <div key={t.id} className={'plan-tier' + (t.id === currentTier ? ' plan-tier-current' : '') + (t.recommended ? ' plan-tier-recommended' : '')}>
              {t.recommended && <div className="plan-tier-recommended-badge">RECOMMENDED FOR PARTNERS</div>}
              <div className="plan-tier-head">
                <div className="plan-tier-name">{t.name}</div>
                <div className="plan-tier-price">
                  {t.price === null ? <span style={{ fontSize: 16 }}>Custom</span> : <><span className="plan-tier-price-num mono">${t.price}</span><span className="plan-tier-price-period">{t.period}</span></>}
                </div>
                <div className="plan-tier-blurb">{t.blurb}</div>
              </div>
              <ul className="plan-tier-features">
                {t.features.map(f => (
                  <li key={f}><Icon name="check" size={11}/> {f}</li>
                ))}
              </ul>
              <div className="plan-tier-limits">
                <div className="plan-tier-limits-grid">
                  <div><span className="muted">Models</span><b>{t.limits.models}</b></div>
                  <div><span className="muted">AI / mo</span><b>{t.limits.ai}</b></div>
                  <div><span className="muted">Docs / mo</span><b>{t.limits.docs}</b></div>
                  <div><span className="muted">Capacities</span><b>{t.limits.capacities}</b></div>
                  <div><span className="muted">Retention</span><b>{t.limits.retention}</b></div>
                </div>
              </div>
              <div className="plan-tier-cta">
                {t.id === currentTier
                  ? <button className="btn btn-outline btn-sm" disabled>Current plan</button>
                  : t.id === 'enterprise'
                    ? <button className="btn btn-outline btn-sm"><Icon name="external" size={12}/>Talk to sales</button>
                    : <button className="btn btn-sm doc-gen-cta"><Icon name="zap" size={12}/>Upgrade to {t.name}</button>}
              </div>
            </div>
          ))}
        </div>

        <div className="lp-card plan-history">
          <div className="lp-card-header">
            <div>
              <div className="lp-card-title">Billing history</div>
              <div className="lp-card-sub">Charges, invoices, and receipts. Available once you upgrade to Pro.</div>
            </div>
            <button className="btn btn-outline btn-sm" disabled><Icon name="external" size={12}/>Open billing portal</button>
          </div>
          <div className="empty" style={{ padding: 18, textAlign: 'center', fontSize: 12.5 }}>
            No invoices yet — Free plan has no charges.
          </div>
        </div>
      </div>
    </>
  );
}
