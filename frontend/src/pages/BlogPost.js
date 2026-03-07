import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import blogPosts from '../data/blogPosts.json';
import toolsData from '../data/toolsData';
import workflows from '../data/workflows.json';
import NotFound from './NotFound';
import { trackEvent } from '../lib/analytics';
import SaveContentButton from '../components/SaveContentButton';

const byLink = (link) => toolsData.find((tool) => tool.link === link);

const BlogPost = () => {
  const { slug } = useParams();

  const post = useMemo(() => blogPosts.find((item) => item.slug === slug), [slug]);

  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return blogPosts
      .filter((item) => item.slug !== post.slug && item.category === post.category)
      .slice(0, 3);
  }, [post]);

  const relatedWorkflows = useMemo(() => {
    if (!post) return [];
    return workflows
      .filter((workflow) => {
        const tools = workflow.primaryTools || [];
        return tools.includes(post.primaryTool) || (post.secondaryTools || []).some((toolPath) => tools.includes(toolPath));
      })
      .slice(0, 3);
  }, [post]);

  if (!post) {
    return <NotFound />;
  }

  const primaryTool = byLink(post.primaryTool);
  const secondaryTools = post.secondaryTools.map(byLink).filter(Boolean);

  return (
    <div className="bg-gray-100 dark:bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <article className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200 p-6">
          <header className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {post.category}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{post.publishedAt}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{post.readTime}</span>
              </div>
              <SaveContentButton type="blog" slug={post.slug} source="blog_detail" size="md" />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
              {post.title}
            </h1>
            <p className="mt-3 text-base text-gray-600 dark:text-gray-300">{post.description}</p>
          </header>

          <section className="mt-6 space-y-6">
            {post.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{section.heading}</h2>
                <div className="mt-3 space-y-3">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-base leading-7 text-gray-700 dark:text-gray-300">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </section>

          <section className="mt-8 rounded-xl border border-blue-200 dark:border-blue-700 p-5 bg-blue-50 dark:bg-blue-900/20">
            <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-300">Try The Workflow In Product</h2>
            <p className="mt-1 text-sm text-blue-800 dark:text-blue-300">
              Move from theory to implementation by executing this guide with the recommended tools.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              {primaryTool && (
                <Link
                  to={primaryTool.link}
                  onClick={() =>
                    trackEvent('blog_to_tool_click', {
                      source_blog: post.slug,
                      target_tool: primaryTool.link,
                      slot: 'primary'
                    })
                  }
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                >
                  Primary Tool: {primaryTool.name}
                </Link>
              )}

              {secondaryTools.map((tool) => (
                <Link
                  key={tool.link}
                  to={tool.link}
                  onClick={() =>
                    trackEvent('blog_to_tool_click', {
                      source_blog: post.slug,
                      target_tool: tool.link,
                      slot: 'secondary'
                    })
                  }
                  className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 text-sm font-semibold hover:border-blue-500"
                >
                  {tool.name}
                </Link>
              ))}
            </div>
          </section>

          {relatedWorkflows.length > 0 && (
            <section className="mt-8 rounded-xl border border-indigo-200 dark:border-indigo-700 p-5 bg-indigo-50 dark:bg-indigo-900/20">
              <h2 className="text-xl font-semibold text-indigo-900 dark:text-indigo-300">Run Related Workflows</h2>
              <p className="mt-1 text-sm text-indigo-800 dark:text-indigo-300">
                Execute this guide in structured multi-step workflows.
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedWorkflows.map((workflow) => (
                  <Link
                    key={workflow.slug}
                    to={`/workflows/${workflow.slug}`}
                    onClick={() =>
                      trackEvent('blog_to_workflow_click', {
                        source_blog: post.slug,
                        target_workflow: workflow.slug
                      })
                    }
                    className="rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-800 p-4 hover:border-indigo-400"
                  >
                    <p className="text-xs uppercase tracking-wide font-semibold text-indigo-600 dark:text-indigo-400">
                      {workflow.heroLabel}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{workflow.title}</h3>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Related Guides</h2>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedPosts.map((related) => (
                <Link
                  key={related.slug}
                  to={`/blog/${related.slug}`}
                  onClick={() =>
                    trackEvent('blog_related_guide_click', {
                      source_blog: post.slug,
                      target_guide: related.slug
                    })
                  }
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4 hover:border-blue-400"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">{related.category}</p>
                  <h3 className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{related.title}</h3>
                </Link>
              ))}
            </div>
          </section>
        </article>
      </div>
    </div>
  );
};

export default BlogPost;
