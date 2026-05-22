# Session — 2026-05-21 · Review hub goes 3-up + section-source column

Append-only delta log. Prior frozen log: `2026-05-18-mockup-overhaul.md`. Read CLAUDE.md first, then this.

## What shipped this session (branch `claude/doc-complete-sections`, → PR #13)

1. **Section-source column added to BOTH deliverables** (operator: "yes, add it to both"):
   - `docs/documents-section-catalogue.md` → new "## Section sources — API call (auto) or LP screen (manual)" table mapping every section to its Scanner / Admin-API / Graph / Metrics-App-DAX / DMV call **or** its LP screen.
   - `public/review/documents.html` → new SOURCES `<section>` ("Where it comes from") with the same mapping as a styled HTML table.

2. **Two new review pages** (operator: "generate the Glossary + Ownership review pages now so the hub has all three live"):
   - `public/review/glossary.html` — plain-language, 6 term types, attach→flows-into-docs payoff, A–Z vs cards, 3 decision asks.
   - `public/review/ownership.html` — 4 roles (Owner/SME/Stewards/Domain), workspace-default→model-override, role-coverage dot legend, sign-off-block tie-in, 3 decision asks.

3. **Hub `public/review/index.html`** — Glossary + Ownership cards flipped from `s-draft` "Review page pending" → `s-ready` "Reviewed-ready" with `./glossary.html` / `./ownership.html` Review links. All three cards now live.

## Gotchas locked this session

- **`docs/prds/ownership.md` now exists** (written this session, after the review pages — operator asked for symmetry). All three bundles now have screen.md + prd.md + review.html + screenshots + live route. Hub Spec link + ownership.html footer point to the PRD (+ screen narrative), matching Glossary.
- Confirmed present: `docs/prds/{documents,glossary,ownership}.md`, `docs/screens/{glossary,ownership}.md`, `docs/analysis/fabric-artifact-ownership-conventions.md`.
- Static `public/review/*.html` is served by Vercel before the SPA catch-all rewrite — `/review/glossary.html` resolves directly, no vercel.json change.

## Open threads

- **Screenshots** for the handover bundle (`docs/handover/screenshots/<screen>/`) — still NOT captured; Chrome extension was disconnected. Conditional on reconnect.
- Documents PRD already fed to LP-side by operator (awaiting their read).
- Glossary still needs a BACKLOG.md Tier row (not yet in backlog — flagged prior session).
