import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import toolContent from '../data/toolContent';
import toolsData from '../data/toolsData';
import blogPosts from '../data/blogPosts.json';
import { trackEvent } from '../lib/analytics';

const getToolByPath = (path) => toolsData.find((tool) => tool.link === path);

const ROLE_LAUNCH_MAP = {
  '/json-formatter': ['frontend', 'backend', 'qa'],
  '/json-encode-decode': ['frontend', 'backend'],
  '/file-compare': ['qa', 'backend', 'security'],
  '/regex-tester': ['frontend', 'qa'],
  '/jwt-decoder': ['security', 'backend', 'frontend'],
  '/base64': ['security', 'backend'],
  '/url-encoder-decoder': ['frontend', 'backend', 'qa'],
  '/timestamp-converter': ['backend', 'product', 'qa'],
  '/hash-generator': ['security', 'backend'],
  '/ai-prompt-generator': ['product', 'frontend'],
  '/ai-error-router': ['frontend', 'backend', 'qa', 'security'],
  '/ai-json-contract-assistant': ['backend', 'qa', 'security']
};

const ToolContentSections = ({ toolPath }) => {
  const content = toolContent[toolPath];

  const recommendedTools = useMemo(() => {
    if (!content?.recommendedToolPaths) {
      return [];
    }
    return content.recommendedToolPaths.map(getToolByPath).filter(Boolean);
  }, [content]);

  const relatedGuides = useMemo(() => {
    if (!toolPath) {
      return [];
    }
    return blogPosts
      .filter((post) => post.primaryTool === toolPath || (post.secondaryTools || []).includes(toolPath))
      .slice(0, 3);
  }, [toolPath]);

  const roleQuickLaunches = useMemo(() => ROLE_LAUNCH_MAP[toolPath] || [], [toolPath]);

  if (!content) {
    return null;
  }

  return (
    <section className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{content.intentTitle}</h2>
      <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-300 max-w-4xl">{content.summary}</p>

      <section className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Common Use Cases</h3>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          {content.useCases.map((useCase) => (
            <article
              key={useCase.title}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4"
            >
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{useCase.title}</h4>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{useCase.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Frequently Asked Questions</h3>
        <div className="mt-3 space-y-3">
          {content.faqs.map((faq) => (
            <details
              key={faq.question}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 px-4 py-3"
            >
              <summary className="cursor-pointer text-sm font-semibold text-gray-900 dark:text-gray-100">
                {faq.question}
              </summary>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recommended Next Steps</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          {recommendedTools.map((tool) => (
            <Link
              key={tool.link}
              to={tool.link}
              onClick={() =>
                trackEvent('tool_content_recommended_click', {
                  source_tool: toolPath,
                  target_tool: tool.link
                })
              }
              className="px-4 py-2 rounded-lg border border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-semibold hover:border-blue-500"
            >
              {tool.name}
            </Link>
          ))}
          <Link
            to={`/workspace-studio?tool=${encodeURIComponent(toolPath)}`}
            onClick={() =>
              trackEvent('tool_to_workspace_studio_click', {
                source_tool: toolPath
              })
            }
            className="px-4 py-2 rounded-lg border border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm font-semibold hover:border-emerald-500"
          >
            Save As Workspace
          </Link>
        </div>

        {roleQuickLaunches.length > 0 && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">
              Role Quick Launch
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {roleQuickLaunches.map((role) => (
                <Link
                  key={role}
                  to={`/workspace-studio?tool=${encodeURIComponent(toolPath)}&role=${encodeURIComponent(role)}`}
                  onClick={() =>
                    trackEvent('tool_role_quick_launch_click', {
                      source_tool: toolPath,
                      target_role: role
                    })
                  }
                  className="px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:border-emerald-500"
                >
                  {role}
                </Link>
              ))}
            </div>
          </div>
        )}

        {relatedGuides.length > 0 && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">
              Related Guides
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              {relatedGuides.map((post) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  onClick={() =>
                    trackEvent('tool_content_guide_click', {
                      source_tool: toolPath,
                      target_guide: post.slug
                    })
                  }
                  className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {post.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </section>
  );
};

export default ToolContentSections;
