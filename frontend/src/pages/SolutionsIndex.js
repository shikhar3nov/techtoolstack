import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import landingPages from '../data/landingPages.json';
import { trackEvent } from '../lib/analytics';
import SaveContentButton from '../components/SaveContentButton';

const solutionTypes = ['All', ...Array.from(new Set(landingPages.map((item) => item.heroLabel)))];

const SolutionsIndex = () => {
  const [query, setQuery] = useState('');
  const [solutionType, setSolutionType] = useState('All');

  const filteredSolutions = useMemo(() => {
    const q = query.trim().toLowerCase();

    return landingPages
      .filter((page) => (solutionType === 'All' ? true : page.heroLabel === solutionType))
      .filter((page) => {
        if (!q) return true;
        const searchable = `${page.title} ${page.description} ${(page.keywords || []).join(' ')} ${(
          page.outcomes || []
        ).join(' ')}`.toLowerCase();
        return searchable.includes(q);
      });
  }, [query, solutionType]);

  return (
    <div className="bg-gray-100 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200 p-6">
          <header className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Solution Blueprints
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-300 max-w-3xl">
              High-intent solution pages designed for enterprise product discovery. Each blueprint maps business
              outcomes to concrete tool workflows and implementation guides.
            </p>
          </header>

          <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Search Solution
              </label>
              <input
                value={query}
                onChange={(event) => {
                  const next = event.target.value;
                  setQuery(next);
                  trackEvent('solution_search', {
                    query: next.slice(0, 80)
                  });
                }}
                placeholder="Example: release governance, security diagnostics, QA regression"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Solution Type
              </label>
              <select
                value={solutionType}
                onChange={(event) => {
                  const next = event.target.value;
                  setSolutionType(next);
                  trackEvent('solution_type_filter', {
                    solution_type: next
                  });
                }}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {solutionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <div className="mt-4 text-xs text-gray-600 dark:text-gray-300">
            Showing {filteredSolutions.length} of {landingPages.length} indexed solutions.
          </div>

          <section className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredSolutions.map((page) => (
              <article
                key={page.slug}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-wide font-semibold text-blue-600 dark:text-blue-400">
                    {page.heroLabel}
                  </p>
                  <SaveContentButton type="solutions" slug={page.slug} source="solutions_index" />
                </div>
                <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">{page.title}</h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{page.excerpt}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {page.keywords.slice(0, 3).map((keyword) => (
                    <span
                      key={keyword}
                      className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>

                <div className="mt-5">
                  <Link
                    to={`/solutions/${page.slug}`}
                    onClick={() =>
                      trackEvent('solution_open', {
                        source: 'solutions_index',
                        target_solution: page.slug
                      })
                    }
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                  >
                    Open Blueprint
                  </Link>
                </div>
              </article>
            ))}
            {filteredSolutions.length === 0 && (
              <div className="md:col-span-2 xl:col-span-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center text-sm text-gray-600 dark:text-gray-300">
                No solutions matched your filters.
              </div>
            )}
          </section>
        </section>
      </div>
    </div>
  );
};

export default SolutionsIndex;
