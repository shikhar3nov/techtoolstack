import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import blogPosts from '../data/blogPosts.json';
import toolsData from '../data/toolsData';
import { trackEvent } from '../lib/analytics';
import SaveContentButton from '../components/SaveContentButton';

const categories = ['All', ...Array.from(new Set(blogPosts.map((post) => post.category)))];

const BlogIndex = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [query, setQuery] = useState('');

  const filteredPosts = useMemo(() => {
    return blogPosts
      .filter((post) => (selectedCategory === 'All' ? true : post.category === selectedCategory))
      .filter((post) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
          post.title.toLowerCase().includes(q) ||
          post.description.toLowerCase().includes(q) ||
          post.keywords.some((keyword) => keyword.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }, [selectedCategory, query]);

  const postCountByTool = useMemo(() => {
    const counts = new Map();
    blogPosts.forEach((post) => {
      counts.set(post.primaryTool, (counts.get(post.primaryTool) || 0) + 1);
    });
    return counts;
  }, []);

  return (
    <div className="bg-gray-100 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200 p-6">
          <header className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Developer Guides & SEO Content Hub
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-300 max-w-3xl">
              Actionable engineering playbooks connected directly to TechToolStack tools. Read a guide,
              execute the workflow instantly, and move from discovery to implementation in one flow.
            </p>
          </header>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Search Topics
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  const next = e.target.value;
                  setQuery(next);
                  trackEvent('blog_search', {
                    query: next.slice(0, 80)
                  });
                }}
                placeholder="Search by keyword, topic, or use-case"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  const next = e.target.value;
                  setSelectedCategory(next);
                  trackEvent('blog_category_filter', {
                    category: next
                  });
                }}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-4">
              {filteredPosts.map((post) => (
                <article key={post.slug} className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-slate-900">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{post.readTime}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Published {post.publishedAt}</span>
                    </div>
                    <SaveContentButton type="blog" slug={post.slug} source="blog_index" />
                  </div>

                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    <Link
                      to={`/blog/${post.slug}`}
                      onClick={() =>
                        trackEvent('blog_post_open', {
                          source: 'blog_index',
                          target_guide: post.slug
                        })
                      }
                      className="hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {post.title}
                    </Link>
                  </h2>

                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{post.excerpt}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.keywords.slice(0, 3).map((keyword) => (
                      <span
                        key={keyword}
                        className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4">
                    <Link
                      to={`/blog/${post.slug}`}
                      onClick={() =>
                        trackEvent('blog_post_open', {
                          source: 'blog_index',
                          target_guide: post.slug
                        })
                      }
                      className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Read full guide ->
                    </Link>
                  </div>
                </article>
              ))}

              {filteredPosts.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center text-sm text-gray-600 dark:text-gray-300">
                  No posts matched your filters. Try another keyword or category.
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-slate-900">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tool Coverage</h3>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                  Content-to-tool mapping used for internal linking and conversion.
                </p>
                <ul className="mt-3 space-y-2">
                  {toolsData
                    .filter((tool) => postCountByTool.get(tool.link))
                    .map((tool) => (
                      <li key={tool.link} className="text-sm">
                        <Link
                          to={tool.link}
                          onClick={() =>
                            trackEvent('blog_index_to_tool_click', {
                              source: 'tool_coverage',
                              target_tool: tool.link
                            })
                          }
                          className="text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {tool.name}
                        </Link>{' '}
                        <span className="text-xs text-gray-500">({postCountByTool.get(tool.link)} guide{postCountByTool.get(tool.link) > 1 ? 's' : ''})</span>
                      </li>
                    ))}
                </ul>
              </div>

              <div className="rounded-xl border border-purple-200 dark:border-purple-700 p-4 bg-purple-50 dark:bg-purple-900/20">
                <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300">Publishing Framework</h3>
                <ul className="mt-2 text-sm text-purple-700 dark:text-purple-300 space-y-1">
                  <li>1. Capture high-intent query clusters</li>
                  <li>2. Publish practical implementation guide</li>
                  <li>3. Route readers to the best-fit tool</li>
                  <li>4. Track blog-to-tool conversion events</li>
                </ul>
              </div>
            </aside>
          </section>
        </div>
      </div>
    </div>
  );
};

export default BlogIndex;
