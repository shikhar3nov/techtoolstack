import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import workflows from '../data/workflows.json';
import { trackEvent } from '../lib/analytics';

const RelatedWorkflowsRail = ({ currentToolPath }) => {
  const relatedWorkflows = useMemo(() => {
    if (!currentToolPath) {
      return [];
    }
    const matched = workflows
      .filter((workflow) => (workflow.primaryTools || []).includes(currentToolPath))
      .slice(0, 3);

    if (matched.length > 0) {
      return matched;
    }

    if (['/ai-error-router', '/ai-json-contract-assistant'].includes(currentToolPath)) {
      return workflows.slice(0, 3);
    }

    return [];
  }, [currentToolPath]);

  if (!currentToolPath || relatedWorkflows.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-indigo-900 dark:text-indigo-300">Run In Workflow</h2>
      <p className="mt-1 text-sm text-indigo-800 dark:text-indigo-300">
        Continue this tool inside multi-step workflows designed for real engineering problems.
      </p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {relatedWorkflows.map((workflow) => (
          <Link
            key={workflow.slug}
            to={`/workflows/${workflow.slug}`}
            onClick={() =>
              trackEvent('tool_to_workflow_click', {
                source_tool: currentToolPath,
                target_workflow: workflow.slug
              })
            }
            className="group rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-900 p-4 hover:border-indigo-400 transition-colors"
          >
            <p className="text-xs uppercase tracking-wide font-semibold text-indigo-600 dark:text-indigo-400">
              {workflow.heroLabel}
            </p>
            <h3 className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
              {workflow.title}
            </h3>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{workflow.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedWorkflowsRail;
