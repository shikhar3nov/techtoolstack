import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import workflows from '../data/workflows.json';
import toolsData from '../data/toolsData';
import { trackEvent } from '../lib/analytics';
import SaveContentButton from '../components/SaveContentButton';

const toolByPath = toolsData.reduce((acc, tool) => {
  acc[tool.link] = tool;
  return acc;
}, {});

const focusAreas = ['All', ...Array.from(new Set(workflows.map((item) => item.heroLabel)))];

const WorkflowsIndex = () => {
  const [query, setQuery] = useState('');
  const [focus, setFocus] = useState('All');

  const filteredWorkflows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return workflows
      .filter((workflow) => (focus === 'All' ? true : workflow.heroLabel === focus))
      .filter((workflow) => {
        if (!q) return true;
        const searchable = `${workflow.title} ${workflow.description} ${(workflow.keywords || []).join(' ')} ${(
          workflow.outcomes || []
        ).join(' ')}`.toLowerCase();
        return searchable.includes(q);
      });
  }, [focus, query]);

  return (
    <div className="bg-gray-100 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200 p-6">
          <header className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">
              Workflow Hub
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-300 max-w-3xl">
              Enterprise-ready execution workflows that map real engineering problems to multi-tool resolution paths.
            </p>
          </header>

          <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Search Workflow
              </label>
              <input
                value={query}
                onChange={(event) => {
                  const next = event.target.value;
                  setQuery(next);
                  trackEvent('workflow_search', {
                    query: next.slice(0, 80)
                  });
                }}
                placeholder="Example: token diagnostics, release checks, API debugging"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Focus Area
              </label>
              <select
                value={focus}
                onChange={(event) => {
                  const next = event.target.value;
                  setFocus(next);
                  trackEvent('workflow_focus_filter', {
                    focus: next
                  });
                }}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {focusAreas.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
              {filteredWorkflows.length} workflow{filteredWorkflows.length === 1 ? '' : 's'} found
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
              {workflows.length} total indexed workflows
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-5">
            {filteredWorkflows.map((workflow) => (
              <article
                key={workflow.slug}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-wide font-semibold text-indigo-600 dark:text-indigo-400">
                    {workflow.heroLabel}
                  </p>
                  <SaveContentButton type="workflows" slug={workflow.slug} source="workflow_index" />
                </div>
                <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">{workflow.title}</h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{workflow.description}</p>

                <ul className="mt-4 space-y-2">
                  {workflow.outcomes.slice(0, 2).map((outcome) => (
                    <li key={outcome} className="text-sm text-gray-700 dark:text-gray-300">
                      • {outcome}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap gap-2">
                  {workflow.primaryTools.slice(0, 3).map((toolPath) => (
                    <span
                      key={toolPath}
                      className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                    >
                      {toolByPath[toolPath]?.name || toolPath}
                    </span>
                  ))}
                </div>

                <div className="mt-5">
                  <Link
                    to={`/workflows/${workflow.slug}`}
                    onClick={() =>
                      trackEvent('workflow_open', {
                        source: 'workflow_index',
                        target_workflow: workflow.slug
                      })
                    }
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
                  >
                    Run Workflow
                  </Link>
                </div>
              </article>
            ))}
            {filteredWorkflows.length === 0 && (
              <div className="xl:col-span-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center text-sm text-gray-600 dark:text-gray-300">
                No workflows matched your search. Try another query or focus area.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default WorkflowsIndex;
