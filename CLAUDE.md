# LayerPulse mockup — Claude memory

## PostHog MCP server (available in web sessions)

Server ID: `69da6aa2-a3df-4104-9a26-fdc28f53eacf` (PostHog).

**Active scope (do not re-ask):**
- Organization: `LayerPulse` (id `019dcb6d-e5d2-0000-b7e0-327631854c1d`)
- Project: `Default project` (id `167104`)
- Project timezone: UTC
- User: Michiel (`michielq@gmail.com`)
- `person.properties.*` on the events table returns the person's *current* value (query-time), regardless of when the event occurred.

**Tool domains exposed** (prefix `mcp__69da6aa2-a3df-4104-9a26-fdc28f53eacf__exec` + domain):
action, activity-log, advanced-activity-logs, alert, annotation, approval-policies, approval-policy, cdp-function-templates, cdp-functions, change-request, cohorts, comment, conversations-tickets, dashboard, docs-search, early-access-feature, endpoint, error-tracking, event-definition, execute-sql, experiment, external-data-schemas, external-data-sources, external-data-sync-logs, feature-flag, hog-flows-logs, hog-flows-metrics, inbox, insight, integration, llm, llma-evaluation-*, llma-prompt-duplicate, llma-score-definition-new-version, llma-skill-*, logs, notebooks, org-members, organization, persons, project, proxy, read-data-schema, read-data-warehouse-schema, role, scheduled-changes, sdk-doctor, session-recording, sql-variables, subscriptions, survey, switch-organization, switch-project, usage-metrics, user, view, web-analytics-weekly-digest, workflows.

**Query-* domains:** error-tracking-issue(s)(-events)(-list), funnel, lifecycle(-actors), llm-trace(s-list), logs, paths, retention, session-recordings-list, stickiness, trends(-actors).

Per the MCP instructions: **prioritize skills over tools** when both apply.

The tool schemas are deferred — load them with `ToolSearch` (e.g. `select:mcp__69da6aa2-a3df-4104-9a26-fdc28f53eacf__exec`) before invoking.

## Product context

Source of truth for product vision/strategy: the `productvision.md` doc (LayerPulse — Unified Fabric intelligence platform, partner-portal model, 3 pillars FinOps / Semantic Model Quality / Governance + emerging Agentic). When designing mockup screens, anchor on **pillar + persona (partner vs direct) + value-loop quadrant (Ingest / Join / Validate / Render)**.

Mockup screen priority order (from the vision doc, §12):
1. C2d Documents pillar (auto-Word) — biggest single differentiator bet
2. Users page (UPN-first)
3. Tenant Activity (forensic search)
4. Audit & Compliance (SOC 2 evidence pack)
5. Lineage Explorer (env-wide 6-column graph)
6. Reports & Apps (dormant detection)
7. D-pillar Intelligence sidebar (cards, not chat)
