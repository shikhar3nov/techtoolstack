import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import problemPlaybooks from '../data/problemPlaybooks.json';
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

const ProblemDetail = () => {
  const { slug } = useParams();
  const playbook = useMemo(() => problemPlaybooks.find((item) => item.slug === slug), [slug]);

  if (!playbook) {
    return <NotFound />;
  }

  return (
    <div className="bg-gray-100 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <article className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200 p-6">
          <header className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-wide font-semibold text-amber-600 dark:text-amber-400">
                {playbook.category}
              </p>
              <SaveContentButton type="problems" slug={playbook.slug} source="problem_detail" size="md" />
            </div>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">{playbook.title}</h1>
            <p className="mt-3 text-base text-gray-600 dark:text-gray-300 max-w-4xl">{playbook.description}</p>

            <div className="mt-4 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-800 dark:text-amber-300">
              <span className="font-semibold">Common Error Signature:</span> {playbook.errorSignature}
            </div>
          </header>

          <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Symptoms</h2>
              <ul className="mt-3 space-y-2">
                {playbook.symptoms.map((symptom) => (
                  <li key={symptom} className="text-sm text-gray-700 dark:text-gray-300">
                    • {symptom}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Likely Causes</h2>
              <ul className="mt-3 space-y-2">
                {playbook.causes.map((cause) => (
                  <li key={cause} className="text-sm text-gray-700 dark:text-gray-300">
                    • {cause}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Resolution Steps</h2>
            <div className="mt-4 space-y-4">
              {playbook.fixSteps.map((step, index) => {
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
                          to={`${tool.link}?problem=${playbook.slug}&step=${index + 1}`}
                          onClick={() =>
                            trackEvent('problem_to_tool_click', {
                              problem_slug: playbook.slug,
                              step_index: index + 1,
                              target_tool: tool.link
                            })
                          }
                          className="inline-flex items-center px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold"
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
                to={`/workspace-studio?problem=${playbook.slug}`}
                onClick={() =>
                  trackEvent('problem_to_workspace_studio_click', {
                    problem_slug: playbook.slug
                  })
                }
                className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
              >
                Save Playbook As Workspace
              </Link>
            </div>
          </section>

          {playbook.relatedGuides?.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Related Guides</h2>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                {playbook.relatedGuides.map((guideSlug) => {
                  const guide = guideBySlug[guideSlug];
                  if (!guide) return null;
                  return (
                    <Link
                      key={guide.slug}
                      to={`/blog/${guide.slug}`}
                      onClick={() =>
                        trackEvent('problem_to_guide_click', {
                          source_problem: playbook.slug,
                          target_guide: guide.slug
                        })
                      }
                      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4 hover:border-amber-400"
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

export default ProblemDetail;
