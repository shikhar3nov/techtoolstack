import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import blogPosts from '../data/blogPosts.json';
import { trackEvent } from '../lib/analytics';

const RelatedGuidesRail = ({ currentToolPath }) => {
  const relatedPosts = useMemo(() => {
    if (!currentToolPath) return [];

    return blogPosts
      .filter((post) => post.primaryTool === currentToolPath || (post.secondaryTools || []).includes(currentToolPath))
      .slice(0, 4);
  }, [currentToolPath]);

  if (!currentToolPath || relatedPosts.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Related Guides</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
        Deep-dive guides that show practical workflows using this tool.
      </p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {relatedPosts.map((post) => (
          <Link
            key={post.slug}
            to={`/blog/${post.slug}`}
            onClick={() =>
              trackEvent('tool_to_blog_click', {
                source_tool: currentToolPath,
                target_guide: post.slug
              })
            }
            className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">{post.category} • {post.readTime}</p>
            <h3 className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {post.title}
            </h3>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedGuidesRail;
