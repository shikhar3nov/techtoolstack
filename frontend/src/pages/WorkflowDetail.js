import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import workflows from '../data/workflows.json';
import toolsData from '../data/toolsData';
import blogPosts from '../data/blogPosts.json';
import NotFound from './NotFound';
import { trackEvent } from '../lib/analytics';
import SaveContentButton from '../components/SaveContentButton';

const toolByPath = toolsData.reduce((acc, tool) => {
  acc[tool.link] = tool;
  return acc;
}, {});

const guideBySlug = blogPosts.reduce((acc, post) => {
  acc[post.slug] = post;
  return acc;
}, {});

const WorkflowDetail = () => {
  const { slug } = useParams();

  const workflow = useMemo(() => workflows.find((item) => item.slug === slug), [slug]);
  if (!workflow) {
    return <NotFound />;
  }

  return (
    <div className="bg-gray-100 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <article className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200 p-6">
          <header className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-wide font-semibold text-indigo-600 dark:text-indigo-400">
                {workflow.heroLabel}
              </p>
              <SaveContentButton type="workflows" slug={workflow.slug} source="workflow_detail" size="md" />
            </div>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">{workflow.title}</h1>
            <p className="mt-3 text-base text-gray-600 dark:text-gray-300 max-w-4xl">{workflow.description}</p>
          </header>

          <section className="mt-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Expected Outcomes</h2>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              {workflow.outcomes.map((outcome) => (
                <div
                  key={outcome}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4 text-sm text-gray-700 dark:text-gray-300"
                >
                  {outcome}
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Execution Steps</h2>
            <div className="mt-4 space-y-4">
              {workflow.steps.map((step, index) => {
                const tool = toolByPath[step.toolPath];
                return (
                  <div
                    key={step.title}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4"
                  >
                    <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">
                      Step {index + 1}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{step.title}</h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{step.description}</p>
                    {tool && (
                      <div className="mt-3">
                        <Link
                          to={`${tool.link}?workflow=${workflow.slug}&step=${index + 1}`}
                          onClick={() =>
                            trackEvent('workflow_step_tool_open', {
                              workflow_slug: workflow.slug,
                              step_index: index + 1,
                              target_tool: tool.link
                            })
                          }
                          className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
                        >
                          Open {tool.name}
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <Link
                to={`/workspace-studio?workflow=${workflow.slug}`}
                onClick={() =>
                  trackEvent('workflow_to_workspace_studio_click', {
                    workflow_slug: workflow.slug
                  })
                }
                className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
              >
                Save Workflow As Workspace
              </Link>
            </div>
          </section>

          {workflow.relatedGuides?.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Related Guides</h2>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                {workflow.relatedGuides.map((guideSlug) => {
                  const guide = guideBySlug[guideSlug];
                  if (!guide) return null;
                  return (
                    <Link
                      key={guide.slug}
                      to={`/blog/${guide.slug}`}
                      onClick={() =>
                        trackEvent('workflow_to_guide_click', {
                          workflow_slug: workflow.slug,
                          target_guide: guide.slug
                        })
                      }
                      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4 hover:border-indigo-400"
                    >
                      <p className="text-xs text-gray-500 dark:text-gray-400">{guide.category} • {guide.readTime}</p>
                      <h3 className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{guide.title}</h3>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </article>
      </div>
    </div>
  );
};

export default WorkflowDetail;
