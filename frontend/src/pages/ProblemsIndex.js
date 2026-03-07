import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import problemPlaybooks from '../data/problemPlaybooks.json';
import { trackEvent } from '../lib/analytics';
import SaveContentButton from '../components/SaveContentButton';

const categories = ['All', ...Array.from(new Set(problemPlaybooks.map((item) => item.category)))];

const ProblemsIndex = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const filteredProblems = useMemo(() => {
    const q = query.trim().toLowerCase();

    return problemPlaybooks
      .filter((item) => (category === 'All' ? true : item.category === category))
      .filter((item) => {
        if (!q) return true;
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.errorSignature.toLowerCase().includes(q) ||
          item.keywords.some((keyword) => keyword.toLowerCase().includes(q))
        );
      });
  }, [category, query]);

  return (
    <div className="bg-gray-100 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200 p-6">
          <header className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
              Problem Playbooks
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-300 max-w-3xl">
              Practical error-resolution pages built for real production issues. Find root causes and run guided fixes.
            </p>
          </header>

          <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Search Error / Symptom
              </label>
              <input
                value={query}
                onChange={(event) => {
                  const next = event.target.value;
                  setQuery(next);
                  trackEvent('problem_search', {
                    query: next.slice(0, 80)
                  });
                }}
                placeholder="Example: unexpected token, invalid signature, regex mismatch"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Category
              </label>
              <select
                value={category}
                onChange={(event) => {
                  const next = event.target.value;
                  setCategory(next);
                  trackEvent('problem_category_filter', {
                    category: next
                  });
                }}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-5">
            {filteredProblems.map((problem) => (
              <article
                key={problem.slug}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-wide font-semibold text-amber-600 dark:text-amber-400">
                    {problem.category}
                  </p>
                  <SaveContentButton type="problems" slug={problem.slug} source="problem_index" />
                </div>
                <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">{problem.title}</h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{problem.description}</p>

                <div className="mt-3 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-800 dark:text-amber-300">
                  <span className="font-semibold">Common Error:</span> {problem.errorSignature}
                </div>

                <div className="mt-4">
                  <Link
                    to={`/problems/${problem.slug}`}
                    onClick={() =>
                      trackEvent('problem_playbook_open', {
                        source: 'problem_index',
                        target_problem: problem.slug
                      })
                    }
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold"
                  >
                    Open Playbook
                  </Link>
                </div>
              </article>
            ))}
          </section>
        </section>
      </div>
    </div>
  );
};

export default ProblemsIndex;
