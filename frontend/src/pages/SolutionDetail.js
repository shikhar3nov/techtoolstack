import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import landingPages from '../data/landingPages.json';
import toolsData from '../data/toolsData';
import blogPosts from '../data/blogPosts.json';
import problemPlaybooks from '../data/problemPlaybooks.json';
import NotFound from './NotFound';
import { trackEvent } from '../lib/analytics';
import SaveContentButton from '../components/SaveContentButton';

const byToolLink = (link) => toolsData.find((tool) => tool.link === link);
const byGuideSlug = (slug) => blogPosts.find((post) => post.slug === slug);

const SolutionDetail = () => {
  const { slug } = useParams();
  const page = useMemo(() => landingPages.find((item) => item.slug === slug), [slug]);

  const tools = useMemo(() => {
    if (!page) return [];
    return page.recommendedTools.map(byToolLink).filter(Boolean);
  }, [page]);

  const guides = useMemo(() => {
    if (!page) return [];
    return page.relatedGuides.map(byGuideSlug).filter(Boolean);
  }, [page]);

  const relatedProblems = useMemo(() => {
    if (!page) return [];
    const toolSet = new Set(page.recommendedTools || []);
    return problemPlaybooks
      .filter((problem) => (problem.relatedTools || []).some((toolPath) => toolSet.has(toolPath)))
      .slice(0, 3);
  }, [page]);

  if (!page) {
    return <NotFound />;
  }

  return (
    <div className="bg-gray-100 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <article className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200 p-6">
          <header className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-wide font-semibold text-blue-600 dark:text-blue-400">
                {page.heroLabel}
              </p>
              <SaveContentButton type="solutions" slug={page.slug} source="solution_detail" size="md" />
            </div>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">{page.title}</h1>
            <p className="mt-3 text-base text-gray-600 dark:text-gray-300 max-w-4xl">{page.description}</p>
          </header>

          <section className="mt-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Business Outcomes</h2>
            <ul className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              {page.outcomes.map((outcome) => (
                <li
                  key={outcome}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4 text-sm text-gray-700 dark:text-gray-300"
                >
                  {outcome}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Implementation Workflow</h2>
            <div className="mt-4 space-y-4">
              {page.workflow.map((item, index) => (
                <div
                  key={item.step}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4"
                >
                  <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{item.step}</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-xl border border-blue-200 dark:border-blue-700 p-5 bg-blue-50 dark:bg-blue-900/20">
            <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-300">Run This Workflow in TechToolStack</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {tools.map((tool) => (
                <Link
                  key={tool.link}
                  to={tool.link}
                  onClick={() =>
                    trackEvent('solution_to_tool_click', {
                      source_solution: page.slug,
                      target_tool: tool.link
                    })
                  }
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                >
                  {tool.name}
                </Link>
              ))}
            </div>
          </section>

          {guides.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Related Guides</h2>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                {guides.map((guide) => (
                  <Link
                    key={guide.slug}
                    to={`/blog/${guide.slug}`}
                    onClick={() =>
                      trackEvent('solution_to_guide_click', {
                        source_solution: page.slug,
                        target_guide: guide.slug
                      })
                    }
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4 hover:border-blue-400"
                  >
                    <p className="text-xs text-gray-500 dark:text-gray-400">{guide.category} • {guide.readTime}</p>
                    <h3 className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{guide.title}</h3>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {relatedProblems.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Related Problem Playbooks</h2>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedProblems.map((problem) => (
                  <Link
                    key={problem.slug}
                    to={`/problems/${problem.slug}`}
                    onClick={() =>
                      trackEvent('solution_to_problem_click', {
                        source_solution: page.slug,
                        target_problem: problem.slug
                      })
                    }
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4 hover:border-blue-400"
                  >
                    <p className="text-xs text-gray-500 dark:text-gray-400">{problem.category}</p>
                    <h3 className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{problem.title}</h3>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </div>
    </div>
  );
};

export default SolutionDetail;
