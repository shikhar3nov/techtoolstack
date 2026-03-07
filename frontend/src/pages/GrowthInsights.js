import React, { useMemo, useState } from 'react';
import {
  clearStoredEvents,
  exportStoredEventsCsv,
  getAttributionData,
  getStoredEvents
} from '../lib/analytics';

const STAGE_ORDER = [
  { key: 'landing_home', label: 'Home Landing' },
  { key: 'content_blog', label: 'Blog Content' },
  { key: 'content_solution', label: 'Solution Content' },
  { key: 'workflow_hub', label: 'Workflow Hub' },
  { key: 'problem_playbook', label: 'Problem Playbooks' },
  { key: 'tool_usage', label: 'Tool Usage' },
  { key: 'workspace', label: 'Workspace Studio' },
  { key: 'engagement_library', label: 'My Library' }
];

const countBy = (items, keyGetter) =>
  items.reduce((acc, item) => {
    const key = keyGetter(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

const toRows = (mapObject) =>
  Object.entries(mapObject)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }));

const toPercent = (value, total) => (total > 0 ? Math.round((value / total) * 100) : 0);

const stageSessionCounts = (events) => {
  const map = STAGE_ORDER.reduce((acc, stage) => {
    acc[stage.key] = new Set();
    return acc;
  }, {});

  events.forEach((event) => {
    if (event.name !== 'funnel_stage_hit') return;
    const stage = event.params?.stage;
    if (!stage || !map[stage]) return;
    const sessionId = event.params?.session_id || 'unknown';
    map[stage].add(sessionId);
  });

  return STAGE_ORDER.map((stage) => ({
    ...stage,
    sessions: map[stage.key].size
  }));
};

const kpiData = (events) => {
  const sessionIds = new Set(events.map((event) => event.params?.session_id || 'unknown'));
  return {
    totalEvents: events.length,
    sessions: sessionIds.size,
    pageViews: events.filter((event) => event.name === 'page_view').length,
    toolPageViews: events.filter((event) => event.name === 'tool_page_view').length,
    workspaceCreated: events.filter((event) => event.name === 'workspace_created').length,
    compareRuns: events.filter((event) => event.name === 'file_compare_run').length,
    savedItems: events.filter(
      (event) => event.name === 'saved_content_toggle' && event.params?.action === 'save'
    ).length
  };
};

const daysTrendRows = (events) => {
  const rows = toRows(
    countBy(events, (event) => {
      if (!event.timestamp) return 'unknown';
      return event.timestamp.slice(0, 10);
    })
  )
    .filter((row) => row.label !== 'unknown')
    .reverse()
    .slice(-14);

  const max = rows.reduce((acc, row) => Math.max(acc, row.count), 1);
  return rows.map((row) => ({
    ...row,
    width: `${Math.max(8, Math.round((row.count / max) * 100))}%`
  }));
};

const GrowthInsights = () => {
  const [events, setEvents] = useState(getStoredEvents());
  const attribution = useMemo(() => getAttributionData(), [events]);

  const kpis = useMemo(() => kpiData(events), [events]);
  const eventTypeRows = useMemo(() => toRows(countBy(events, (event) => event.name)), [events]);
  const stageRows = useMemo(() => stageSessionCounts(events), [events]);
  const trendRows = useMemo(() => daysTrendRows(events), [events]);

  const blogToToolRows = useMemo(
    () =>
      toRows(
        countBy(events, (event) => {
          if (event.name !== 'blog_to_tool_click') return 'Other';
          return `${event.params?.source_blog || 'unknown'} -> ${event.params?.target_tool || 'unknown'}`;
        })
      ).filter((row) => row.label !== 'Other'),
    [events]
  );

  const solutionToToolRows = useMemo(
    () =>
      toRows(
        countBy(events, (event) => {
          if (event.name !== 'solution_to_tool_click') return 'Other';
          return `${event.params?.source_solution || 'unknown'} -> ${event.params?.target_tool || 'unknown'}`;
        })
      ).filter((row) => row.label !== 'Other'),
    [events]
  );

  const workflowToToolRows = useMemo(
    () =>
      toRows(
        countBy(events, (event) => {
          if (event.name !== 'workflow_step_tool_open') return 'Other';
          return `${event.params?.workflow_slug || 'unknown'} -> ${event.params?.target_tool || 'unknown'}`;
        })
      ).filter((row) => row.label !== 'Other'),
    [events]
  );

  const roleEntryRows = useMemo(
    () =>
      toRows(
        countBy(events, (event) => {
          if (event.name === 'role_quick_start_click') return event.params?.role || 'unknown';
          if (event.name === 'tool_role_quick_launch_click') return event.params?.target_role || 'unknown';
          return 'Other';
        })
      ).filter((row) => row.label !== 'Other'),
    [events]
  );

  const topToolViewRows = useMemo(
    () =>
      toRows(
        countBy(events, (event) => {
          if (event.name !== 'tool_page_view') return 'Other';
          return event.params?.target_tool || 'unknown';
        })
      )
        .filter((row) => row.label !== 'Other')
        .slice(0, 8),
    [events]
  );

  const signalRows = useMemo(() => {
    const counts = eventTypeRows.reduce((acc, row) => {
      acc[row.label] = row.count;
      return acc;
    }, {});

    const signals = [
      { key: 'page_view', label: 'Page Views' },
      { key: 'funnel_stage_hit', label: 'Funnel Stage Hits' },
      { key: 'tool_page_view', label: 'Tool Page Views' },
      { key: 'file_compare_run', label: 'File Compare Runs' },
      { key: 'workspace_created', label: 'Workspace Created' },
      { key: 'saved_content_toggle', label: 'Saved Content Actions' },
      { key: 'role_quick_start_click', label: 'Role Quick Start Clicks' }
    ];

    return signals.map((signal) => ({
      ...signal,
      count: counts[signal.key] || 0
    }));
  }, [eventTypeRows]);

  const contentSessions = useMemo(() => {
    const contentStages = ['content_blog', 'content_solution', 'workflow_hub', 'problem_playbook'];
    const sessions = new Set();

    events.forEach((event) => {
      if (event.name !== 'funnel_stage_hit') return;
      if (!contentStages.includes(event.params?.stage)) return;
      sessions.add(event.params?.session_id || 'unknown');
    });

    return sessions.size;
  }, [events]);

  const toolSessions = useMemo(() => {
    const sessions = new Set();
    events.forEach((event) => {
      if (event.name !== 'funnel_stage_hit') return;
      if (event.params?.stage !== 'tool_usage') return;
      sessions.add(event.params?.session_id || 'unknown');
    });
    return sessions.size;
  }, [events]);

  const workspaceSessions = useMemo(() => {
    const sessions = new Set();
    events.forEach((event) => {
      if (event.name !== 'funnel_stage_hit') return;
      if (event.params?.stage !== 'workspace') return;
      sessions.add(event.params?.session_id || 'unknown');
    });
    return sessions.size;
  }, [events]);

  const handleClear = () => {
    clearStoredEvents();
    setEvents([]);
  };

  const handleRefresh = () => {
    setEvents(getStoredEvents());
  };

  const handleExport = () => {
    exportStoredEventsCsv();
  };

  return (
    <div className="bg-gray-100 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200 p-6">
          <header className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
              Growth & SEO Insights
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-300 max-w-3xl">
              Product telemetry dashboard for funnel validation, content-to-tool conversion, and engagement signal quality.
            </p>
          </header>

          <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <article className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Sessions</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{kpis.sessions}</p>
            </article>
            <article className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Page Views</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{kpis.pageViews}</p>
            </article>
            <article className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Tool Views</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{kpis.toolPageViews}</p>
            </article>
            <article className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Workspace Created</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{kpis.workspaceCreated}</p>
            </article>
            <article className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Compare Runs</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{kpis.compareRuns}</p>
            </article>
            <article className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Saved Items</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{kpis.savedItems}</p>
            </article>
            <article className="rounded-lg border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 p-4">
              <p className="text-xs uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Content -> Tool</p>
              <p className="mt-1 text-2xl font-bold text-indigo-900 dark:text-indigo-300">
                {toPercent(toolSessions, contentSessions)}%
              </p>
              <p className="mt-1 text-xs text-indigo-800 dark:text-indigo-300">
                {toolSessions} / {contentSessions || 0} sessions
              </p>
            </article>
            <article className="rounded-lg border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Tool -> Workspace</p>
              <p className="mt-1 text-2xl font-bold text-emerald-900 dark:text-emerald-300">
                {toPercent(workspaceSessions, toolSessions)}%
              </p>
              <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
                {workspaceSessions} / {toolSessions || 0} sessions
              </p>
            </article>
          </section>

          <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-5">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Funnel Stage Reach (Sessions)</h2>
              <div className="mt-4 space-y-2">
                {stageRows.map((row) => (
                  <div
                    key={row.key}
                    className="flex items-center justify-between text-sm rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2"
                  >
                    <span className="text-gray-700 dark:text-gray-300">{row.label}</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{row.sessions}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-5">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Event Trend (Last 14 Days)</h2>
              <div className="mt-4 space-y-2">
                {trendRows.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No timestamped events available yet.</p>
                )}
                {trendRows.map((row) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                      <span>{row.label}</span>
                      <span>{row.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div className="h-full bg-blue-600 dark:bg-blue-400 rounded-full" style={{ width: row.width }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Tool Views</h2>
              <div className="mt-3 space-y-2">
                {topToolViewRows.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No tool view events yet.</p>
                )}
                {topToolViewRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between text-sm rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2"
                  >
                    <span className="text-gray-700 dark:text-gray-300">{row.label}</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{row.count}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Role Entry Distribution</h2>
              <div className="mt-3 space-y-2">
                {roleEntryRows.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No role entry events yet.</p>
                )}
                {roleEntryRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between text-sm rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2"
                  >
                    <span className="text-gray-700 dark:text-gray-300">{row.label}</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{row.count}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Blog -> Tool</h2>
              <div className="mt-3 space-y-2">
                {blogToToolRows.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No blog conversion events yet.</p>
                )}
                {blogToToolRows.map((row) => (
                  <div key={row.label} className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                    <p className="text-gray-700 dark:text-gray-300">{row.label}</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{row.count}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Solutions -> Tool</h2>
              <div className="mt-3 space-y-2">
                {solutionToToolRows.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No solution conversion events yet.</p>
                )}
                {solutionToToolRows.map((row) => (
                  <div key={row.label} className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                    <p className="text-gray-700 dark:text-gray-300">{row.label}</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{row.count}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Workflow -> Tool</h2>
              <div className="mt-3 space-y-2">
                {workflowToToolRows.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No workflow conversion events yet.</p>
                )}
                {workflowToToolRows.map((row) => (
                  <div key={row.label} className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                    <p className="text-gray-700 dark:text-gray-300">{row.label}</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{row.count}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Signal Coverage</h2>
              <div className="mt-3 space-y-2">
                {signalRows.map((row) => (
                  <div
                    key={row.key}
                    className={`flex items-center justify-between text-sm rounded-lg border px-3 py-2 ${
                      row.count > 0
                        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'
                    }`}
                  >
                    <span className="text-gray-700 dark:text-gray-300">{row.label}</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{row.count}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 p-5">
              <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-300">Attribution + Ops Checklist</h2>
              <ol className="mt-3 space-y-2 text-sm text-blue-800 dark:text-blue-300">
                <li>1. Submit `sitemap.xml` in Google Search Console and Bing Webmaster Tools.</li>
                <li>2. Configure verification vars: `REACT_APP_GOOGLE_SITE_VERIFICATION` and `REACT_APP_BING_SITE_VERIFICATION`.</li>
                <li>3. Configure analytics vars: `REACT_APP_GA4_MEASUREMENT_ID` and/or `REACT_APP_GTM_CONTAINER_ID`.</li>
                <li>4. Mark conversion events (`tool_page_view`, `workspace_created`, `saved_content_toggle`) in GA4.</li>
                <li>5. Track role-entry performance using `role_quick_start_click` and `tool_role_quick_launch_click`.</li>
              </ol>

              {attribution && (
                <div className="mt-4 space-y-2 text-sm">
                  <div className="rounded-lg border border-blue-300 dark:border-blue-700 px-3 py-2">
                    <p className="font-semibold text-blue-900 dark:text-blue-300">First Touch Source</p>
                    <p className="text-blue-800 dark:text-blue-300">{attribution.firstTouch?.utm_source || 'direct'}</p>
                  </div>
                  <div className="rounded-lg border border-blue-300 dark:border-blue-700 px-3 py-2">
                    <p className="font-semibold text-blue-900 dark:text-blue-300">Last Touch Source</p>
                    <p className="text-blue-800 dark:text-blue-300">{attribution.lastTouch?.utm_source || 'direct'}</p>
                  </div>
                  <div className="rounded-lg border border-blue-300 dark:border-blue-700 px-3 py-2">
                    <p className="font-semibold text-blue-900 dark:text-blue-300">First Landing Path</p>
                    <p className="text-blue-800 dark:text-blue-300">{attribution.firstLandingPath || '/'}</p>
                  </div>
                </div>
              )}
            </article>
          </section>

          <section className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Event Snapshot</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {kpis.totalEvents} events captured in this browser.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {eventTypeRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between text-sm rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 bg-white dark:bg-slate-800"
                >
                  <span className="text-gray-700 dark:text-gray-300">{row.label}</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{row.count}</span>
                </div>
              ))}
              {eventTypeRows.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">No events captured yet.</p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-800 text-white text-sm font-semibold"
              >
                Clear Local Events
              </button>
            </div>
          </section>
        </section>
      </div>
    </div>
  );
};

export default GrowthInsights;
