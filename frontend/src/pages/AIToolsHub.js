import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toolsData from '../data/toolsData';
import workflows from '../data/workflows.json';
import problemPlaybooks from '../data/problemPlaybooks.json';
import { trackEvent } from '../lib/analytics';

const AIToolsHub = () => {
  const [query, setQuery] = useState('');

  const aiTools = useMemo(() => toolsData.filter((tool) => tool.isAI), []);
  const aiToolPathSet = useMemo(() => new Set(aiTools.map((tool) => tool.link)), [aiTools]);

  const filteredTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return aiTools;
    return aiTools.filter((tool) => {
      const searchable = `${tool.name} ${tool.description} ${(tool.tags || []).join(' ')}`.toLowerCase();
      return searchable.includes(q);
    });
  }, [aiTools, query]);

  const relatedWorkflows = useMemo(() => {
    const matched = workflows.filter((workflow) =>
      (workflow.primaryTools || []).some((toolPath) => aiToolPathSet.has(toolPath))
    );
    return (matched.length ? matched : workflows).slice(0, 4);
  }, [aiToolPathSet]);

  const relatedProblems = useMemo(() => {
    const matched = problemPlaybooks.filter((problem) =>
      (problem.fixSteps || []).some((step) => aiToolPathSet.has(step.toolPath))
    );
    return (matched.length ? matched : problemPlaybooks).slice(0, 4);
  }, [aiToolPathSet]);

  return (
    <div className="bg-gray-100 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200 p-6">
          <header className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
              AI Tools Hub
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-300 max-w-3xl">
              Enterprise AI modules for incident routing, JSON contract governance, and intelligent prompt operations.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">
                {aiTools.length} AI tool{aiTools.length === 1 ? '' : 's'}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                Heuristic mode supported by default
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                Optional provider mode: Ollama, Hugging Face, OpenAI
              </span>
            </div>
          </header>

          <section className="mt-6">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Search AI Tools</label>
            <input
              value={query}
              onChange={(event) => {
                const next = event.target.value;
                setQuery(next);
                trackEvent('ai_hub_search', {
                  query: next.slice(0, 80)
                });
              }}
              placeholder="Example: contract compatibility, incident triage, diff intelligence"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </section>

          <section className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-5">
            {filteredTools.map((tool) => (
              <article
                key={tool.link}
                className="rounded-xl border border-cyan-200 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20 p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-2xl">{tool.icon}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300 bg-white dark:bg-slate-900">
                    AI
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-semibold text-gray-900 dark:text-gray-100">{tool.name}</h2>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{tool.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(tool.tags || []).slice(0, 5).map((tag) => (
                    <span
                      key={`${tool.link}-${tag}`}
                      className="text-xs px-2 py-1 rounded bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4">
                  <Link
                    to={tool.link}
                    onClick={() =>
                      trackEvent('ai_hub_tool_open', {
                        target_tool: tool.link
                      })
                    }
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold"
                  >
                    Open Tool
                  </Link>
                </div>
              </article>
            ))}
          </section>

          {filteredTools.length === 0 && (
            <div className="mt-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center text-sm text-gray-600 dark:text-gray-300">
              No AI tools matched your search.
            </div>
          )}

          <section className="mt-8 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-indigo-900 dark:text-indigo-300">AI-Compatible Workflows</h2>
                <p className="mt-1 text-sm text-indigo-800 dark:text-indigo-300">
                  Run AI tools inside multi-step engineering workflows for production-safe execution.
                </p>
              </div>
              <Link
                to="/workflows"
                onClick={() =>
                  trackEvent('ai_hub_workflows_open', {
                    source: 'ai_hub'
                  })
                }
                className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
              >
                View All Workflows
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedWorkflows.map((workflow) => (
                <Link
                  key={workflow.slug}
                  to={`/workflows/${workflow.slug}`}
                  onClick={() =>
                    trackEvent('ai_hub_workflow_click', {
                      target_workflow: workflow.slug
                    })
                  }
                  className="rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-900 p-4 hover:border-indigo-400 transition-colors"
                >
                  <p className="text-xs uppercase tracking-wide font-semibold text-indigo-600 dark:text-indigo-400">
                    {workflow.heroLabel}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{workflow.title}</h3>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-300">Problem Playbooks With AI Paths</h2>
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                  Use AI-assisted routes to move faster from error signatures to actionable next steps.
                </p>
              </div>
              <Link
                to="/problems"
                onClick={() =>
                  trackEvent('ai_hub_problems_open', {
                    source: 'ai_hub'
                  })
                }
                className="inline-flex items-center px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold"
              >
                Browse Playbooks
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedProblems.map((problem) => (
                <Link
                  key={problem.slug}
                  to={`/problems/${problem.slug}`}
                  onClick={() =>
                    trackEvent('ai_hub_problem_click', {
                      target_problem: problem.slug
                    })
                  }
                  className="rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-slate-900 p-4 hover:border-amber-400 transition-colors"
                >
                  <p className="text-xs uppercase tracking-wide font-semibold text-amber-700 dark:text-amber-400">
                    {problem.category}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{problem.title}</h3>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-5">
            <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-300">Team Adoption Path</h2>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <article className="rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-slate-900 p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">1. Triaging</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Route incidents and errors quickly with AI Error Router for deterministic first actions.
                </p>
              </article>
              <article className="rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-slate-900 p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">2. Contract Safety</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Validate JSON schema drift and compatibility risk before deployment cut.
                </p>
              </article>
              <article className="rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-slate-900 p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">3. Execution</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Launch Workspace Studio templates for role-based rollout, handoff, and monitoring.
                </p>
              </article>
            </div>
          </section>
        </section>
      </div>
    </div>
  );
};

export default AIToolsHub;
