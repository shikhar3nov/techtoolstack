import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { routeErrorIncident } from '../lib/aiRouterApi';
import { trackEvent } from '../lib/analytics';

const environments = ['production', 'staging', 'development', 'qa'];
const roles = ['frontend', 'backend', 'qa', 'security', 'product', 'general'];

const sampleIncidents = [
  {
    id: 'sample-json',
    label: 'JSON Parse Crash',
    roleHint: 'frontend',
    environment: 'production',
    errorText:
      'SyntaxError: Unexpected token } in JSON at position 190 while parsing API response body from /v1/orders.',
    context:
      'React checkout page fails to render when specific customer accounts load order payload with nested metadata.'
  },
  {
    id: 'sample-jwt',
    label: 'JWT Signature Failure',
    roleHint: 'security',
    environment: 'production',
    errorText:
      '401 Unauthorized: jwt malformed / invalid signature on token validation middleware for /api/payments.',
    context:
      'Issue appeared after rotating auth secret in one environment. Sessions fail intermittently across regions.'
  },
  {
    id: 'sample-cors',
    label: 'CORS Preflight Block',
    roleHint: 'frontend',
    environment: 'staging',
    errorText:
      'Access to fetch at https://api.example.com/v2/users from origin https://app.example.com has been blocked by CORS policy.',
    context:
      'Browser fails only for authenticated requests with credentials=true. Postman works.'
  },
  {
    id: 'sample-timezone',
    label: 'Timestamp Mismatch',
    roleHint: 'backend',
    environment: 'production',
    errorText:
      'Event expiry appears 6 hours early in US region. Epoch values differ between API response and database snapshot.',
    context:
      'Recent release introduced new timestamp conversion utility in reporting service.'
  }
];

const AIErrorRouter = () => {
  const [errorText, setErrorText] = useState('');
  const [context, setContext] = useState('');
  const [environment, setEnvironment] = useState('production');
  const [roleHint, setRoleHint] = useState('frontend');
  const [maxRecommendations, setMaxRecommendations] = useState(3);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const canAnalyze = errorText.trim().length >= 10;

  const workspaceHref = useMemo(() => {
    if (!result?.workspaceSeed) return '/workspace-studio';
    const query = new URLSearchParams();
    if (result.workspaceSeed.role) query.set('role', result.workspaceSeed.role);
    if (result.workspaceSeed.sourceWorkflow) query.set('workflow', result.workspaceSeed.sourceWorkflow);
    if (result.workspaceSeed.sourceProblem) query.set('problem', result.workspaceSeed.sourceProblem);
    if (result.workspaceSeed.suggestedTools?.length) query.set('tool', result.workspaceSeed.suggestedTools[0]);
    return `/workspace-studio?${query.toString()}`;
  }, [result]);

  const loadSample = (sample) => {
    setErrorText(sample.errorText);
    setContext(sample.context);
    setEnvironment(sample.environment);
    setRoleHint(sample.roleHint);
    setApiError('');
    trackEvent('ai_error_router_sample_load', {
      sample_id: sample.id
    });
  };

  const handleAnalyze = async () => {
    if (!canAnalyze || loading) return;
    setLoading(true);
    setApiError('');
    setCopied(false);

    trackEvent('ai_error_router_run', {
      environment,
      role_hint: roleHint,
      input_chars: errorText.length
    });

    try {
      const payload = await routeErrorIncident({
        errorText,
        context,
        environment,
        roleHint,
        maxRecommendations
      });
      setResult(payload);

      trackEvent('ai_error_router_success', {
        workflow_slug: payload.recommendedWorkflow?.slug || 'none',
        incident_category: payload.incident?.category || 'unknown',
        confidence: payload.incident?.confidence || 0
      });
    } catch (error) {
      setApiError(error.message || 'Routing failed');
      trackEvent('ai_error_router_failed', {
        status: error.status || 0
      });
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setErrorText('');
    setContext('');
    setResult(null);
    setApiError('');
    setCopied(false);
  };

  const reportText = useMemo(() => {
    if (!result) return '';
    const toolLine = (result.recommendedTools || []).map((tool) => tool.name).join(', ');
    const causes = (result.likelyCauses || []).map((item) => `- ${item}`).join('\n');
    const actions = (result.immediateActions || []).map((item) => `- ${item}`).join('\n');

    return [
      `AI Error Router Report`,
      `Generated: ${result.generatedAt}`,
      `Incident Category: ${result.incident?.label}`,
      `Confidence: ${result.incident?.confidence}%`,
      `Severity: ${result.incident?.severity}`,
      `Recommended Workflow: ${result.recommendedWorkflow?.title || 'N/A'}`,
      `Recommended Tools: ${toolLine || 'N/A'}`,
      '',
      'Likely Causes:',
      causes || '- N/A',
      '',
      'Immediate Actions:',
      actions || '- N/A'
    ].join('\n');
  }, [result]);

  const copyReport = async () => {
    if (!reportText) return;
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
      trackEvent('ai_error_router_copy_report', {
        workflow_slug: result?.recommendedWorkflow?.slug || 'none'
      });
    } catch {
      setApiError('Unable to copy report. Please copy manually.');
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200">
          <div className="text-center mb-4 mt-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center mb-1">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                AI Error Router
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm mb-3">
              Paste an error, stack trace, or incident log and route it to the best workflow, tools, and fix plan.
            </p>
          </div>

          <div className="p-6">
            <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-5">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Incident Input</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Provide as much error context as possible for better routing confidence.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {sampleIncidents.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => loadSample(sample)}
                    className="px-3 py-1.5 rounded-lg border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:border-purple-500"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Environment</label>
                  <select
                    value={environment}
                    onChange={(event) => setEnvironment(event.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                  >
                    {environments.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Role Hint</label>
                  <select
                    value={roleHint}
                    onChange={(event) => setRoleHint(event.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                  >
                    {roles.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Recommendations</label>
                  <select
                    value={maxRecommendations}
                    onChange={(event) => setMaxRecommendations(Number(event.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={!canAnalyze || loading}
                    className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Analyzing...' : 'Analyze Incident'}
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Error / Log / Stack Trace</label>
                <textarea
                  value={errorText}
                  onChange={(event) => setErrorText(event.target.value)}
                  rows={8}
                  placeholder="Paste raw error output, request/response snippet, or stack trace..."
                  className="mt-1 w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 font-mono text-sm"
                />
              </div>

              <div className="mt-4">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Context Notes (Optional)</label>
                <textarea
                  value={context}
                  onChange={(event) => setContext(event.target.value)}
                  rows={4}
                  placeholder="Add release context, affected feature, region, or known changes..."
                  className="mt-1 w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
            </section>

            {apiError && (
              <div className="mt-4 px-3 py-2 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                {apiError}
              </div>
            )}

            {result && (
              <section className="mt-6 space-y-4">
                <article className="rounded-xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-indigo-900 dark:text-indigo-300">{result.incident?.label}</h2>
                      <p className="mt-1 text-sm text-indigo-800 dark:text-indigo-300">{result.summary}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                        Confidence {result.incident?.confidence}%
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        Severity {result.incident?.severity}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                        Role {result.incident?.role}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={copyReport}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                    >
                      {copied ? 'Report Copied' : 'Copy Report'}
                    </button>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300">
                      Provider: {result.provider?.mode || 'heuristic'}
                    </span>
                  </div>
                </article>

                {result.recommendedWorkflow && (
                  <article className="rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 p-5">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300">Recommended Workflow</h3>
                    <p className="mt-1 text-sm text-blue-800 dark:text-blue-300">{result.recommendedWorkflow.title}</p>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{result.recommendedWorkflow.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        to={result.recommendedWorkflow.path}
                        onClick={() =>
                          trackEvent('ai_error_router_to_workflow_click', {
                            workflow_slug: result.recommendedWorkflow.slug
                          })
                        }
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                      >
                        Open Workflow
                      </Link>
                      <Link
                        to={workspaceHref}
                        onClick={() =>
                          trackEvent('ai_error_router_to_workspace_click', {
                            workflow_slug: result.recommendedWorkflow.slug
                          })
                        }
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                      >
                        Open In Workspace Studio
                      </Link>
                    </div>
                  </article>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Recommended Tools</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(result.recommendedTools || []).map((tool) => (
                        <Link
                          key={tool.path}
                          to={tool.path}
                          onClick={() =>
                            trackEvent('ai_error_router_to_tool_click', {
                              target_tool: tool.path
                            })
                          }
                          className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 text-xs font-semibold hover:border-blue-400"
                        >
                          {tool.name}
                        </Link>
                      ))}
                    </div>
                  </article>

                  <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Likely Causes</h3>
                    <ul className="mt-3 space-y-2">
                      {(result.likelyCauses || []).map((cause) => (
                        <li key={cause} className="text-sm text-gray-700 dark:text-gray-300">
                          • {cause}
                        </li>
                      ))}
                    </ul>
                  </article>

                  <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Immediate Actions</h3>
                    <ul className="mt-3 space-y-2">
                      {(result.immediateActions || []).map((action) => (
                        <li key={action} className="text-sm text-gray-700 dark:text-gray-300">
                          • {action}
                        </li>
                      ))}
                    </ul>
                  </article>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <article className="rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Related Problem Playbooks</h3>
                    <div className="mt-3 space-y-2">
                      {(result.relatedProblems || []).map((problem) => (
                        <Link
                          key={problem.slug}
                          to={problem.path}
                          onClick={() =>
                            trackEvent('ai_error_router_to_problem_click', {
                              target_problem: problem.slug
                            })
                          }
                          className="block rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-slate-800 p-3 hover:border-amber-400"
                        >
                          <p className="text-xs text-gray-500 dark:text-gray-400">{problem.category}</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{problem.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">{problem.errorSignature}</p>
                        </Link>
                      ))}
                    </div>
                  </article>

                  <article className="rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Related Guides</h3>
                    <div className="mt-3 space-y-2">
                      {(result.relatedGuides || []).map((guide) => (
                        <Link
                          key={guide.slug}
                          to={guide.path}
                          onClick={() =>
                            trackEvent('ai_error_router_to_guide_click', {
                              target_guide: guide.slug
                            })
                          }
                          className="block rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 p-3 hover:border-blue-400"
                        >
                          <p className="text-xs text-gray-500 dark:text-gray-400">{guide.category} • {guide.readTime}</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{guide.title}</p>
                        </Link>
                      ))}
                    </div>
                  </article>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIErrorRouter;
