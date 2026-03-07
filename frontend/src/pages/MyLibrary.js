import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import blogPosts from '../data/blogPosts.json';
import workflows from '../data/workflows.json';
import problemPlaybooks from '../data/problemPlaybooks.json';
import landingPages from '../data/landingPages.json';
import { clearSavedLibrary, getSavedCount, getSavedLibrary } from '../lib/contentLibrary';
import { trackEvent } from '../lib/analytics';

const bySlug = (items) =>
  items.reduce((acc, item) => {
    acc[item.slug] = item;
    return acc;
  }, {});

const blogBySlug = bySlug(blogPosts);
const workflowBySlug = bySlug(workflows);
const problemBySlug = bySlug(problemPlaybooks);
const solutionBySlug = bySlug(landingPages);

const Section = ({ title, description, items, emptyMessage }) => (
  <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-5">
    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{description}</p>
    {items.length > 0 ? <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">{items}</div> : <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>}
  </section>
);

const MyLibrary = () => {
  const [library, setLibrary] = useState(() => getSavedLibrary());

  useEffect(() => {
    const sync = () => setLibrary(getSavedLibrary());
    window.addEventListener('storage', sync);
    window.addEventListener('tts:saved-content-updated', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('tts:saved-content-updated', sync);
    };
  }, []);

  const savedGuides = useMemo(
    () => (library.blog || []).map((slug) => blogBySlug[slug]).filter(Boolean),
    [library.blog]
  );
  const savedWorkflows = useMemo(
    () => (library.workflows || []).map((slug) => workflowBySlug[slug]).filter(Boolean),
    [library.workflows]
  );
  const savedProblems = useMemo(
    () => (library.problems || []).map((slug) => problemBySlug[slug]).filter(Boolean),
    [library.problems]
  );
  const savedSolutions = useMemo(
    () => (library.solutions || []).map((slug) => solutionBySlug[slug]).filter(Boolean),
    [library.solutions]
  );

  const totalSaved = getSavedCount();

  const handleClear = () => {
    clearSavedLibrary();
    setLibrary(getSavedLibrary());
    trackEvent('saved_content_cleared', { source: 'library_page' });
  };

  return (
    <div className="bg-gray-100 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200 p-6">
          <header className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">
              My Library
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-300 max-w-3xl">
              Save useful guides, workflows, problem playbooks, and solution blueprints to build your reusable knowledge system.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                {totalSaved} item{totalSaved === 1 ? '' : 's'} saved
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-800 text-white text-xs font-semibold"
              >
                Clear Library
              </button>
            </div>
          </header>

          <div className="mt-6 space-y-5">
            <Section
              title="Saved Guides"
              description="Long-form implementation guides for deep work sessions."
              emptyMessage="No saved guides yet."
              items={savedGuides.map((item) => (
                <Link
                  key={item.slug}
                  to={`/blog/${item.slug}`}
                  onClick={() =>
                    trackEvent('library_item_open', {
                      type: 'blog',
                      slug: item.slug
                    })
                  }
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 p-4 hover:border-emerald-400"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.category} • {item.readTime}</p>
                  <h3 className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                </Link>
              ))}
            />

            <Section
              title="Saved Workflows"
              description="Execution playbooks mapped to tool-by-tool flow."
              emptyMessage="No saved workflows yet."
              items={savedWorkflows.map((item) => (
                <Link
                  key={item.slug}
                  to={`/workflows/${item.slug}`}
                  onClick={() =>
                    trackEvent('library_item_open', {
                      type: 'workflow',
                      slug: item.slug
                    })
                  }
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 p-4 hover:border-emerald-400"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.heroLabel}</p>
                  <h3 className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                </Link>
              ))}
            />

            <Section
              title="Saved Problem Playbooks"
              description="Common production failures and step-wise resolution paths."
              emptyMessage="No saved problem playbooks yet."
              items={savedProblems.map((item) => (
                <Link
                  key={item.slug}
                  to={`/problems/${item.slug}`}
                  onClick={() =>
                    trackEvent('library_item_open', {
                      type: 'problem',
                      slug: item.slug
                    })
                  }
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 p-4 hover:border-emerald-400"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.category}</p>
                  <h3 className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                </Link>
              ))}
            />

            <Section
              title="Saved Solution Blueprints"
              description="Business-to-implementation mappings for repeatable team outcomes."
              emptyMessage="No saved solution blueprints yet."
              items={savedSolutions.map((item) => (
                <Link
                  key={item.slug}
                  to={`/solutions/${item.slug}`}
                  onClick={() =>
                    trackEvent('library_item_open', {
                      type: 'solution',
                      slug: item.slug
                    })
                  }
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 p-4 hover:border-emerald-400"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.heroLabel}</p>
                  <h3 className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                </Link>
              ))}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default MyLibrary;
