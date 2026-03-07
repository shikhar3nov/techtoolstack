import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';

const getTagOverlap = (currentTags = [], candidateTags = []) => {
  const currentSet = new Set(currentTags.map((tag) => tag.toLowerCase()));
  return candidateTags.reduce((count, tag) => (currentSet.has(tag.toLowerCase()) ? count + 1 : count), 0);
};

const RelatedToolsRail = ({ currentTool, tools }) => {
  const relatedTools = useMemo(() => {
    if (!currentTool) {
      return [];
    }

    return tools
      .filter((tool) => tool.link !== currentTool.link)
      .map((tool) => ({
        ...tool,
        overlap: getTagOverlap(currentTool.tags || [], tool.tags || [])
      }))
      .filter((tool) => tool.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap || a.name.localeCompare(b.name))
      .slice(0, 4);
  }, [currentTool, tools]);

  if (!currentTool || relatedTools.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Related Tools</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
        Continue your workflow with tools commonly used with {currentTool.name}.
      </p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {relatedTools.map((tool) => (
          <Link
            key={tool.link}
            to={tool.link}
            onClick={() =>
              trackEvent('related_tool_click', {
                source_tool: currentTool.link,
                target_tool: tool.link
              })
            }
            className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-lg">{tool.icon}</div>
              {tool.isAI && (
                <span className="text-[11px] px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/20">
                  AI
                </span>
              )}
            </div>
            <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {tool.name}
            </h3>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 overflow-hidden">
              {tool.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedToolsRail;
