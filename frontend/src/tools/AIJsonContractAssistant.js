import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyzeJsonContract } from '../lib/aiRouterApi';
import { trackEvent } from '../lib/analytics';

const environments = ['production', 'staging', 'development', 'qa'];
const roles = ['backend', 'frontend', 'qa', 'security', 'product', 'general'];

const sampleContracts = [
  {
    id: 'order-v1-v2',
    label: 'Order API v1 -> v2',
    environment: 'production',
    roleHint: 'backend',
    context: 'Public checkout contract update for multi-currency support.',
    baselineJson: JSON.stringify(
      {
        order_id: 'ord_1001',
        customer_id: 'cus_883',
        amount: 1499,
        currency: 'USD',
        created_at: '2026-03-04T10:20:00Z',
        items: [
          {
            sku: 'sku_101',
            qty: 1,
            price: 1499
          }
        ],
        payment: {
          status: 'captured',
          token: 'tok_live_masked'
        }
      },
      null,
      2
    ),
    candidateJson: JSON.stringify(
      {
        order_id: 'ord_1001',
        customer_id: 'cus_883',
        total_amount: '1499.00',
        currency_code: 'USD',
        created_at: '2026-03-04T10:20:00Z',
        items: [
          {
            sku: 'sku_101',
            quantity: 1,
            unit_price: 1499
          }
        ],
        payment: {
          status: 'captured',
          jwt_token: 'tok_live_masked'
        },
        metadata: {
          source: 'web'
        }
      },
      null,
      2
    )
  },
  {
    id: 'auth-session',
    label: 'Auth Session Contract',
    environment: 'staging',
    roleHint: 'security',
    context: 'Session payload change after auth middleware refactor.',
    baselineJson: JSON.stringify(
      {
        session_id: 's_1882',
        user_id: 'u_922',
        permissions: ['orders:read'],
        expires_at: 1772563200,
        refresh_token: 'ref_x1'
      },
      null,
      2
    ),
    candidateJson: JSON.stringify(
      {
        session_id: 's_1882',
        user_id: 'u_922',
        roles: ['viewer'],
        expires_at: '2026-03-03T08:00:00Z',
        jwt: {
          access: 'acc_x1'
        }
      },
      null,
      2
    )
  }
];

const getSeverityClass = (severity = 'low') => {
  if (severity === 'high') {
    return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700';
  }
  if (severity === 'medium') {
    return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700';
  }
  return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700';
};

const getCompatibilityClass = (compatibility = 'compatible') => {
  if (compatibility === 'breaking') {
    return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700';
  }
  if (compatibility === 'risky') {
    return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700';
  }
  return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700';
};

const ChangeList = ({ title, items, emptyText }) => (
  <article className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4">
    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
    {items.length === 0 ? (
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{emptyText}</p>
    ) : (
      <div className="mt-2 max-h-64 overflow-auto pr-1">
        {items.map((item) => (
          <div
            key={item}
            className="text-xs font-mono border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 mb-2 last:mb-0"
          >
            {item}
          </div>
        ))}
      </div>
    )}
  </article>
);

const TypeChangeList = ({ items }) => (
  <article className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4">
    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Type Changes</h3>
    {items.length === 0 ? (
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">No type change detected.</p>
    ) : (
      <div className="mt-2 max-h-64 overflow-auto pr-1">
        {items.map((item) => (
          <div
            key={`${item.path}-${item.from?.join(',')}-${item.to?.join(',')}`}
            className="mb-2 last:mb-0 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 p-2"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-mono text-gray-800 dark:text-gray-100">{item.path}</p>
              <span className={`text-[11px] px-2 py-0.5 rounded border ${getSeverityClass(item.severity)}`}>
                {item.severity || 'medium'}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              {item.from?.join(' | ') || 'unknown'} -> {item.to?.join(' | ') || 'unknown'}
            </p>
          </div>
        ))}
      </div>
    )}
  </article>
);

const AIJsonContractAssistant = () => {
  const [baselineJson, setBaselineJson] = useState('');
  const [candidateJson, setCandidateJson] = useState('');
  const [context, setContext] = useState('');
  const [environment, setEnvironment] = useState('production');
  const [roleHint, setRoleHint] = useState('backend');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [result, setResult] = useState(null);
  const [copiedPayload, setCopiedPayload] = useState('');

  const canAnalyze = baselineJson.trim().length > 1 && candidateJson.trim().length > 1;

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
    setBaselineJson(sample.baselineJson);
    setCandidateJson(sample.candidateJson);
    setContext(sample.context);
    setEnvironment(sample.environment);
    setRoleHint(sample.roleHint);
    setApiError('');
    setResult(null);
    trackEvent('ai_json_contract_sample_load', {
      sample_id: sample.id
    });
  };

  const clearAll = () => {
    setBaselineJson('');
    setCandidateJson('');
    setContext('');
    setApiError('');
    setResult(null);
    setCopiedPayload('');
  };

  const handleAnalyze = async () => {
    if (!canAnalyze || loading) return;
    setLoading(true);
    setApiError('');
    setCopiedPayload('');

    trackEvent('ai_json_contract_run', {
      environment,
      role_hint: roleHint,
      baseline_chars: baselineJson.length,
      candidate_chars: candidateJson.length
    });

    try {
      const payload = await analyzeJsonContract({
        baselineJson,
        candidateJson,
        context,
        environment,
        roleHint
      });
      setResult(payload);
      trackEvent('ai_json_contract_success', {
        compatibility: payload.overview?.compatibility || 'unknown',
        confidence: payload.overview?.confidence || 0
      });
    } catch (error) {
      setApiError(error.message || 'Contract analysis failed');
      trackEvent('ai_json_contract_failed', {
        status: error.status || 0
      });
    } finally {
      setLoading(false);
    }
  };

  const copyPayload = async (item) => {
    try {
      await navigator.clipboard.writeText(item.payload || '');
      setCopiedPayload(item.name);
      setTimeout(() => setCopiedPayload(''), 1500);
      trackEvent('ai_json_contract_copy_payload', {
        payload_name: item.name
      });
    } catch {
      setApiError('Unable to copy payload. Please copy manually.');
    }
  };

  const priorityPaths = result?.changes?.priorityPaths || [];
  const addedPaths = (result?.changes?.added || []).slice(0, 40);
  const removedPaths = (result?.changes?.removed || []).slice(0, 40);
  const typeChanged = (result?.changes?.typeChanged || []).slice(0, 40);

  return (
    <div className="bg-gray-100 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200">
          <div className="text-center mb-4 mt-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center mb-1">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                AI JSON Contract Assistant
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto text-sm mb-3">
              Compare baseline and candidate JSON contracts, detect schema drift, and get migration-safe rollout guidance.
            </p>
          </div>

          <div className="p-6">
            <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Contract Inputs</h2>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Paste old and new payload examples to evaluate compatibility risk before release.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sampleContracts.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => loadSample(sample)}
                      className="px-3 py-1.5 rounded-lg border border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 text-xs font-semibold hover:border-cyan-500"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Release Context</label>
                  <input
                    type="text"
                    value={context}
                    onChange={(event) => setContext(event.target.value)}
                    placeholder="Example: customer-facing release with legacy mobile clients"
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Baseline JSON</p>
                  <textarea
                    value={baselineJson}
                    onChange={(event) => setBaselineJson(event.target.value)}
                    placeholder="Paste current stable contract JSON..."
                    className="w-full h-72 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Candidate JSON</p>
                  <textarea
                    value={candidateJson}
                    onChange={(event) => setCandidateJson(event.target.value)}
                    placeholder="Paste new contract JSON..."
                    className="w-full h-72 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!canAnalyze || loading}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Analyzing Contract...' : 'Analyze Contract'}
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="px-5 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold"
                >
                  Clear
                </button>
              </div>
            </section>

            {apiError && (
              <div className="mt-4 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {apiError}
              </div>
            )}

            {result && (
              <section className="mt-6 rounded-xl border border-cyan-200 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/15 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-semibold text-cyan-900 dark:text-cyan-300">AI Contract Report</h2>
                  <span className={`text-xs px-2 py-1 border rounded-full ${getCompatibilityClass(result.overview?.compatibility)}`}>
                    {result.overview?.compatibility || 'compatible'}
                  </span>
                  <span className="text-xs px-2 py-1 border rounded-full border-cyan-300 dark:border-cyan-600 text-cyan-700 dark:text-cyan-200">
                    Confidence {result.overview?.confidence || 0}%
                  </span>
                  <span className="text-xs px-2 py-1 border rounded-full border-cyan-300 dark:border-cyan-600 text-cyan-700 dark:text-cyan-200">
                    Provider {result.provider?.mode || 'heuristic'}
                  </span>
                </div>

                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{result.overview?.summary}</p>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  <div className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 px-3 py-2">Baseline Paths: {result.metrics?.baselinePaths ?? 0}</div>
                  <div className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 px-3 py-2">Candidate Paths: {result.metrics?.candidatePaths ?? 0}</div>
                  <div className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 px-3 py-2">Added: {result.metrics?.addedPaths ?? 0}</div>
                  <div className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 px-3 py-2">Removed: {result.metrics?.removedPaths ?? 0}</div>
                  <div className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 px-3 py-2">Type Changed: {result.metrics?.typeChangedPaths ?? 0}</div>
                  <div className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 px-3 py-2">Total Changes: {result.metrics?.totalChanges ?? 0}</div>
                </div>

                <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <article className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Risk Signals</h3>
                    <div className="mt-2 space-y-2">
                      {(result.riskSignals || []).map((item) => (
                        <div key={`${item.label}-${item.reason}`} className="rounded border border-gray-200 dark:border-gray-700 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{item.label}</p>
                            <span className={`text-[11px] px-2 py-0.5 rounded border ${getSeverityClass(item.severity)}`}>
                              {item.severity}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{item.reason}</p>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Migration Steps</h3>
                    <div className="mt-2 space-y-2">
                      {(result.migrationSteps || []).map((step) => (
                        <p key={step} className="text-sm text-gray-700 dark:text-gray-300">
                          - {step}
                        </p>
                      ))}
                    </div>
                  </article>
                </div>

                {priorityPaths.length > 0 && (
                  <div className="mt-5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Priority Review Paths</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {priorityPaths.map((pathKey) => (
                        <span
                          key={pathKey}
                          className="text-xs font-mono px-2 py-1 rounded border border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300"
                        >
                          {pathKey}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <ChangeList title="Added Paths" items={addedPaths} emptyText="No added path." />
                  <ChangeList title="Removed Paths" items={removedPaths} emptyText="No removed path." />
                  <TypeChangeList items={typeChanged} />
                </div>

                {(result.testPayloads || []).length > 0 && (
                  <div className="mt-5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Suggested Test Payloads</h3>
                    <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
                      {(result.testPayloads || []).map((item) => (
                        <article
                          key={item.name}
                          className="rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">{item.name}</h4>
                            <button
                              type="button"
                              onClick={() => copyPayload(item)}
                              className="text-[11px] px-2 py-1 rounded border border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300"
                            >
                              {copiedPayload === item.name ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{item.purpose}</p>
                          <pre className="mt-2 text-[11px] leading-5 max-h-48 overflow-auto rounded bg-slate-900 text-slate-100 p-2">
                            {item.payload}
                          </pre>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <article className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Suggested Tools</h3>
                    <div className="mt-2 space-y-2">
                      {(result.suggestedTools || []).map((tool) => (
                        <Link
                          key={tool.path}
                          to={tool.path}
                          onClick={() =>
                            trackEvent('ai_json_contract_suggested_tool_click', {
                              target_tool: tool.path
                            })
                          }
                          className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {tool.name}
                        </Link>
                      ))}
                    </div>
                  </article>

                  <article className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Suggested Workflows</h3>
                    <div className="mt-2 space-y-2">
                      {(result.suggestedWorkflows || []).map((workflow) => (
                        <Link
                          key={workflow.slug}
                          to={workflow.path}
                          onClick={() =>
                            trackEvent('ai_json_contract_suggested_workflow_click', {
                              target_workflow: workflow.slug
                            })
                          }
                          className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {workflow.title}
                        </Link>
                      ))}
                    </div>
                  </article>

                  <article className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Related Problems</h3>
                    <div className="mt-2 space-y-2">
                      {(result.relatedProblems || []).map((problem) => (
                        <Link
                          key={problem.slug}
                          to={problem.path}
                          onClick={() =>
                            trackEvent('ai_json_contract_related_problem_click', {
                              target_problem: problem.slug
                            })
                          }
                          className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {problem.title}
                        </Link>
                      ))}
                    </div>
                  </article>
                </div>

                <div className="mt-5">
                  <Link
                    to={workspaceHref}
                    onClick={() =>
                      trackEvent('ai_json_contract_open_workspace', {
                        target: workspaceHref
                      })
                    }
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                  >
                    Open In Workspace Studio
                  </Link>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIJsonContractAssistant;
