import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ToolCard from './components/ToolCard';
import RelatedToolsRail from './components/RelatedToolsRail';
import RelatedGuidesRail from './components/RelatedGuidesRail';
import RelatedWorkflowsRail from './components/RelatedWorkflowsRail';
import ToolContentSections from './components/ToolContentSections';
import CommandPalette from './components/CommandPalette';
import toolsData from './data/toolsData';
import blogPosts from './data/blogPosts.json';
import landingPages from './data/landingPages.json';
import workflows from './data/workflows.json';
import problemPlaybooks from './data/problemPlaybooks.json';
import SEOManager from './seo/SEOManager';
import { motion } from 'framer-motion';
import { initAnalytics, trackEvent, trackPageView } from './lib/analytics';
import { addRecentTool, getPinnedTools, getRecentTools, togglePinnedTool } from './lib/userPreferences';
import { getSavedCount } from './lib/contentLibrary';

const AIPromptGenerator = lazy(() => import('./tools/AIPromptGenerator'));
const AIErrorRouter = lazy(() => import('./tools/AIErrorRouter'));
const AIJsonContractAssistant = lazy(() => import('./tools/AIJsonContractAssistant'));
const JsonFormatter = lazy(() => import('./tools/JsonFormatter'));
const Base64Tool = lazy(() => import('./tools/Base64Tool'));
const JsonEncodeDecode = lazy(() => import('./tools/JsonEncodeDecode'));
const FileCompare = lazy(() => import('./tools/FileCompare'));
const RegexTester = lazy(() => import('./tools/RegexTester'));
const JWTDecoder = lazy(() => import('./tools/JWTDecoder'));
const URLEncoderDecoder = lazy(() => import('./tools/URLEncoderDecoder'));
const UnixTimestampConverter = lazy(() => import('./tools/UnixTimestampConverter'));
const HashGenerator = lazy(() => import('./tools/HashGenerator'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Contact = lazy(() => import('./pages/Contact'));
const BlogIndex = lazy(() => import('./pages/BlogIndex'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const SolutionsIndex = lazy(() => import('./pages/SolutionsIndex'));
const SolutionDetail = lazy(() => import('./pages/SolutionDetail'));
const GrowthInsights = lazy(() => import('./pages/GrowthInsights'));
const AIToolsHub = lazy(() => import('./pages/AIToolsHub'));
const WorkflowsIndex = lazy(() => import('./pages/WorkflowsIndex'));
const WorkflowDetail = lazy(() => import('./pages/WorkflowDetail'));
const ProblemsIndex = lazy(() => import('./pages/ProblemsIndex'));
const ProblemDetail = lazy(() => import('./pages/ProblemDetail'));
const WorkspaceStudio = lazy(() => import('./pages/WorkspaceStudio'));
const SharedWorkspace = lazy(() => import('./pages/SharedWorkspace'));
const MyLibrary = lazy(() => import('./pages/MyLibrary'));

const ROLE_QUICKSTARTS = [
  {
    role: 'frontend',
    title: 'Frontend Incident Response',
    description: 'Debug payload, auth, and URL issues quickly with a ready-made workspace.',
    entryPath: '/workspace-studio?role=frontend'
  },
  {
    role: 'backend',
    title: 'Backend Contract Integrity',
    description: 'Validate contracts and compare release data changes before deploy.',
    entryPath: '/workspace-studio?role=backend'
  },
  {
    role: 'qa',
    title: 'QA Release Validation',
    description: 'Run regression-focused verification with diff and validation workflows.',
    entryPath: '/workspace-studio?role=qa'
  },
  {
    role: 'security',
    title: 'Security Token Diagnostics',
    description: 'Investigate auth incidents with token, hash, and config comparison flow.',
    entryPath: '/workspace-studio?role=security'
  },
  {
    role: 'product',
    title: 'Product Issue Investigation',
    description: 'Translate user incidents into reproducible technical workspace contexts.',
    entryPath: '/workspace-studio?role=product'
  }
];

const inferFunnelStage = (pathname) => {
  if (pathname === '/') return 'landing_home';
  if (pathname.startsWith('/ai-tools')) return 'ai_hub';
  if (pathname.startsWith('/blog')) return 'content_blog';
  if (pathname.startsWith('/solutions')) return 'content_solution';
  if (pathname.startsWith('/workflows')) return 'workflow_hub';
  if (pathname.startsWith('/problems')) return 'problem_playbook';
  if (pathname.startsWith('/workspace-studio') || pathname.startsWith('/shared-workspace')) return 'workspace';
  if (pathname.startsWith('/library')) return 'engagement_library';
  if (toolsData.some((tool) => tool.link === pathname)) return 'tool_usage';
  return 'other';
};

const HomeToolStrip = ({ title, description, tools, onTogglePin, pinnedSet, eventSource }) => {
  if (!tools.length) return null;

  return (
    <section className="mt-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{description}</p>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tools.map((tool) => (
          <div
            key={tool.link}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Link
                  to={tool.link}
                  onClick={() =>
                    trackEvent('homepage_tool_strip_click', {
                      source: eventSource,
                      target_tool: tool.link
                    })
                  }
                  className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {tool.name}
                </Link>
                {tool.isAI && (
                  <span className="inline-flex text-[11px] mt-1 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/20">
                    AI
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onTogglePin(tool.link)}
                className={`text-xs px-2 py-1 rounded border ${
                  pinnedSet.has(tool.link)
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700'
                    : 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                }`}
              >
                {pinnedSet.has(tool.link) ? 'Pinned' : 'Pin'}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">{tool.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

const HomeAISpotlight = ({ aiTools }) => {
  if (!aiTools.length) return null;

  return (
    <section className="mt-8 rounded-xl border border-cyan-200 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-cyan-900 dark:text-cyan-300">AI Command Center</h2>
          <p className="mt-1 text-sm text-cyan-800 dark:text-cyan-300">
            High-impact AI tools for incident triage, contract safety, and diff intelligence.
          </p>
        </div>
        <Link
          to="/ai-tools"
          onClick={() =>
            trackEvent('homepage_cta_click', {
              source: 'ai_command_center',
              target: '/ai-tools'
            })
          }
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold"
        >
          Open AI Hub
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {aiTools.map((tool) => (
          <Link
            key={tool.link}
            to={tool.link}
            onClick={() =>
              trackEvent('homepage_ai_spotlight_click', {
                source: 'ai_command_center',
                target_tool: tool.link
              })
            }
            className="rounded-lg border border-cyan-200 dark:border-cyan-700 bg-white dark:bg-slate-900 p-4 hover:border-cyan-400 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{tool.name}</p>
              <span className="text-[11px] px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300">
                AI
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">{tool.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};

const HomePage = ({
  filteredTools,
  searchTerm,
  aiTools,
  featuredGuides,
  featuredSolutions,
  featuredWorkflows,
  featuredProblems,
  pinnedTools,
  recentTools,
  onTogglePin,
  pinnedSet,
  savedCount
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.35 }}
  >
    <section className="text-center mb-10">
      <h1 className="text-4xl sm:text-5xl font-bold mb-4">
        Welcome to{' '}
        <span className="text-blue-600 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          TechToolStack
        </span>
      </h1>
      <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto text-base">
        Enterprise-grade developer platform for debugging payloads, running workflow playbooks, and shipping safer releases.
      </p>
    </section>

    <HomeAISpotlight aiTools={aiTools} />

    <HomeToolStrip
      title="Continue Where You Left Off"
      description="Quickly reopen your recent tool workflows and keep context between sessions."
      tools={recentTools}
      onTogglePin={onTogglePin}
      pinnedSet={pinnedSet}
      eventSource="recent_tools"
    />

    <HomeToolStrip
      title="Pinned Tools"
      description="Your personal high-frequency toolkit. Pin tools you use repeatedly."
      tools={pinnedTools}
      onTogglePin={onTogglePin}
      pinnedSet={pinnedSet}
      eventSource="pinned_tools"
    />

    <section className="mt-8 rounded-xl border border-teal-200 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-teal-900 dark:text-teal-300">Saved Library Re-Entry</h2>
          <p className="mt-1 text-sm text-teal-800 dark:text-teal-300">
            Keep recurring workflows organized. Your team currently has {savedCount} saved item{savedCount === 1 ? '' : 's'}.
          </p>
        </div>
        <Link
          to="/library"
          onClick={() =>
            trackEvent('homepage_cta_click', {
              source: 'saved_library',
              target: '/library'
            })
          }
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold"
        >
          Open My Library
        </Link>
      </div>
    </section>

    <section className="mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 px-2 sm:px-4">
      {filteredTools.map((tool, index) => (
        <ToolCard
          key={`${tool.link}-${index}`}
          {...tool}
          isPinned={pinnedSet.has(tool.link)}
          onTogglePin={onTogglePin}
        />
      ))}
      {filteredTools.length === 0 && (
        <p className="text-center col-span-full text-gray-500 dark:text-gray-400">
          No tools found for "{searchTerm}".
        </p>
      )}
    </section>

    <section className="mt-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Built for Product and Engineering Teams</h2>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <article className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Operational Clarity</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Use deterministic tools and guided flows to reduce debugging ambiguity across teams.
          </p>
        </article>
        <article className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Workflow Acceleration</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Move from error discovery to resolution using pre-defined multi-step workflows and playbooks.
          </p>
        </article>
        <article className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Enterprise Quality</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Structured SEO, analytics, and reusable UI architecture support long-term product scale.
          </p>
        </article>
      </div>
    </section>

    <section className="mt-8 rounded-xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-emerald-900 dark:text-emerald-300">Role-Based Quick Start</h2>
          <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">
            Launch pre-structured workspace templates by role to reduce setup time and align team execution.
          </p>
        </div>
        <Link
          to="/workspace-studio"
          onClick={() =>
            trackEvent('homepage_cta_click', {
              source: 'role_quick_start',
              target: '/workspace-studio'
            })
          }
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
        >
          Open Workspace Studio
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {ROLE_QUICKSTARTS.map((item) => (
          <Link
            key={item.role}
            to={item.entryPath}
            onClick={() =>
              trackEvent('role_quick_start_click', {
                source: 'homepage',
                role: item.role,
                target: item.entryPath
              })
            }
            className="rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-slate-900 p-4 hover:border-emerald-400 transition-colors"
          >
            <p className="text-xs uppercase tracking-wide font-semibold text-emerald-700 dark:text-emerald-400">
              {item.role}
            </p>
            <h3 className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">{item.description}</p>
          </Link>
        ))}
      </div>
    </section>

    <section className="mt-8 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-indigo-900 dark:text-indigo-300">Workflow Hub</h2>
          <p className="mt-1 text-sm text-indigo-800 dark:text-indigo-300">
            Production-tested execution paths for API debugging, release readiness, and auth diagnostics.
          </p>
        </div>
        <Link
          to="/workflows"
          onClick={() =>
            trackEvent('homepage_cta_click', {
              source: 'workflow_hub',
              target: '/workflows'
            })
          }
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
        >
          Open Workflows
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {featuredWorkflows.map((workflow) => (
          <Link
            key={workflow.slug}
            to={`/workflows/${workflow.slug}`}
            onClick={() =>
              trackEvent('homepage_workflow_open', {
                target_workflow: workflow.slug
              })
            }
            className="rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-900 p-4 hover:border-indigo-400 transition-colors"
          >
            <p className="text-xs uppercase tracking-wide font-semibold text-indigo-600 dark:text-indigo-400">
              {workflow.heroLabel}
            </p>
            <h3 className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{workflow.title}</h3>
          </Link>
        ))}
      </div>
    </section>

    <section className="mt-8 rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-amber-900 dark:text-amber-300">Problem Playbooks</h2>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
            Real-world error pages built around common engineering failures and fix steps.
          </p>
        </div>
        <Link
          to="/problems"
          onClick={() =>
            trackEvent('homepage_cta_click', {
              source: 'problem_playbooks',
              target: '/problems'
            })
          }
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold"
        >
          Browse Playbooks
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {featuredProblems.map((problem) => (
          <Link
            key={problem.slug}
            to={`/problems/${problem.slug}`}
            onClick={() =>
              trackEvent('homepage_problem_open', {
                target_problem: problem.slug
              })
            }
            className="rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-slate-900 p-4 hover:border-amber-400 transition-colors"
          >
            <p className="text-xs uppercase tracking-wide font-semibold text-amber-700 dark:text-amber-400">
              {problem.category}
            </p>
            <h3 className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{problem.title}</h3>
          </Link>
        ))}
      </div>
    </section>

    <section className="mt-8 rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-blue-900 dark:text-blue-300">Developer Playbooks</h2>
          <p className="mt-1 text-sm text-blue-800 dark:text-blue-300">
            Practical guides aligned with high-intent workflows and real implementation needs.
          </p>
        </div>
        <Link
          to="/blog"
          onClick={() =>
            trackEvent('homepage_cta_click', {
              source: 'developer_playbooks',
              target: '/blog'
            })
          }
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
        >
          View All Guides
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {featuredGuides.map((post) => (
          <Link
            key={post.slug}
            to={`/blog/${post.slug}`}
            onClick={() =>
              trackEvent('homepage_featured_guide_click', {
                source: 'developer_playbooks',
                target_guide: post.slug
              })
            }
            className="rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-900 p-4 hover:border-blue-400 transition-colors"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">{post.category} • {post.readTime}</p>
            <h3 className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{post.title}</h3>
          </Link>
        ))}
      </div>
    </section>

    <section className="mt-8 rounded-xl border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-purple-900 dark:text-purple-300">Enterprise Solution Paths</h2>
          <p className="mt-1 text-sm text-purple-800 dark:text-purple-300">
            Use-case landing pages designed for high-intent discovery and product conversion flow.
          </p>
        </div>
        <Link
          to="/solutions"
          onClick={() =>
            trackEvent('homepage_cta_click', {
              source: 'solution_paths',
              target: '/solutions'
            })
          }
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold"
        >
          View Solutions
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {featuredSolutions.map((solution) => (
          <Link
            key={solution.slug}
            to={`/solutions/${solution.slug}`}
            onClick={() =>
              trackEvent('homepage_solution_open', {
                target_solution: solution.slug
              })
            }
            className="rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-slate-900 p-4 hover:border-purple-400 transition-colors"
          >
            <p className="text-xs uppercase tracking-wide font-semibold text-purple-600 dark:text-purple-400">
              {solution.heroLabel}
            </p>
            <h3 className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{solution.title}</h3>
          </Link>
        ))}
      </div>
    </section>
  </motion.div>
);

const RouteLoadingState = () => (
  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 shadow-sm p-8 text-center text-sm text-gray-600 dark:text-gray-300">
    Loading...
  </div>
);

function App() {
  const searchTerm = '';
  const location = useLocation();
  const [pinnedToolPaths, setPinnedToolPaths] = useState(() => getPinnedTools());
  const [recentToolPaths, setRecentToolPaths] = useState(() => getRecentTools());
  const [savedCount, setSavedCount] = useState(() => getSavedCount());

  const filteredTools = useMemo(
    () =>
      toolsData.filter(
        (tool) =>
          tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (tool.tags || []).some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      ),
    [searchTerm]
  );
  const aiTools = useMemo(() => toolsData.filter((tool) => tool.isAI), []);

  const featuredGuides = useMemo(
    () =>
      [...blogPosts]
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        .slice(0, 3),
    []
  );
  const featuredSolutions = useMemo(() => landingPages.slice(0, 3), []);
  const featuredWorkflows = useMemo(() => workflows.slice(0, 3), []);
  const featuredProblems = useMemo(() => problemPlaybooks.slice(0, 3), []);

  const toolsByPath = useMemo(
    () =>
      toolsData.reduce((acc, tool) => {
        acc[tool.link] = tool;
        return acc;
      }, {}),
    []
  );

  const currentTool = toolsByPath[location.pathname];
  const pinnedSet = useMemo(() => new Set(pinnedToolPaths), [pinnedToolPaths]);

  const pinnedTools = useMemo(
    () => pinnedToolPaths.map((path) => toolsByPath[path]).filter(Boolean),
    [pinnedToolPaths, toolsByPath]
  );
  const recentTools = useMemo(
    () => recentToolPaths.map((path) => toolsByPath[path]).filter(Boolean),
    [recentToolPaths, toolsByPath]
  );

  const commandItems = useMemo(() => {
    const staticItems = [
      { label: 'Home', group: 'Navigation', path: '/', keywords: 'dashboard landing' },
      { label: 'AI Tools Hub', group: 'AI', path: '/ai-tools', keywords: 'ai tools router contract assistant prompt' },
      { label: 'Blog', group: 'Content', path: '/blog', keywords: 'guides articles' },
      { label: 'My Library', group: 'Engagement', path: '/library', keywords: 'saved guides workflows playbooks' },
      { label: 'Workflows', group: 'Execution', path: '/workflows', keywords: 'workflow hub' },
      { label: 'Problems', group: 'Troubleshooting', path: '/problems', keywords: 'error playbooks fixes' },
      { label: 'Solutions', group: 'Product', path: '/solutions', keywords: 'enterprise solutions' },
      { label: 'Workspace Studio', group: 'Collaboration', path: '/workspace-studio', keywords: 'sync share template' },
      { label: 'Contact', group: 'Support', path: '/contact', keywords: 'support feedback' }
    ];

    const toolItems = toolsData.map((tool) => ({
      label: tool.name,
      group: 'Tools',
      path: tool.link,
      keywords: `${tool.description} ${(tool.tags || []).join(' ')}`
    }));
    const workflowItems = workflows.map((workflow) => ({
      label: workflow.title,
      group: 'Workflow',
      path: `/workflows/${workflow.slug}`,
      keywords: `${workflow.description} ${workflow.keywords.join(' ')}`
    }));
    const problemItems = problemPlaybooks.map((problem) => ({
      label: problem.title,
      group: 'Problem Playbook',
      path: `/problems/${problem.slug}`,
      keywords: `${problem.errorSignature} ${problem.keywords.join(' ')}`
    }));

    return [...staticItems, ...toolItems, ...workflowItems, ...problemItems];
  }, []);

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    const fullPath = `${location.pathname}${location.search || ''}`;
    trackPageView(fullPath, document.title);
    trackEvent('funnel_stage_hit', {
      stage: inferFunnelStage(location.pathname),
      path: location.pathname
    });
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!currentTool) return;
    const nextRecent = addRecentTool(currentTool.link);
    setRecentToolPaths(nextRecent);
    trackEvent('tool_page_view', {
      target_tool: currentTool.link,
      tool_name: currentTool.name
    });
  }, [currentTool]);

  useEffect(() => {
    const syncSavedCount = () => setSavedCount(getSavedCount());
    window.addEventListener('storage', syncSavedCount);
    window.addEventListener('tts:saved-content-updated', syncSavedCount);
    return () => {
      window.removeEventListener('storage', syncSavedCount);
      window.removeEventListener('tts:saved-content-updated', syncSavedCount);
    };
  }, []);

  const handleTogglePinnedTool = (toolPath) => {
    const next = togglePinnedTool(toolPath);
    setPinnedToolPaths(next);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-[#0c162d] text-black dark:text-white">
        <SEOManager />
        <Header />
        <CommandPalette commands={commandItems} />

        <main className="container mx-auto px-4 py-10 flex-1">
          <Suspense fallback={<RouteLoadingState />}>
            <Routes>
              <Route
                path="/"
                element={
                  <HomePage
                    filteredTools={filteredTools}
                    searchTerm={searchTerm}
                    aiTools={aiTools}
                    featuredGuides={featuredGuides}
                    featuredSolutions={featuredSolutions}
                    featuredWorkflows={featuredWorkflows}
                    featuredProblems={featuredProblems}
                    pinnedTools={pinnedTools}
                    recentTools={recentTools}
                    onTogglePin={handleTogglePinnedTool}
                    pinnedSet={pinnedSet}
                    savedCount={savedCount}
                  />
                }
              />
              <Route path="/ai-prompt-generator" element={<AIPromptGenerator />} />
              <Route path="/ai-error-router" element={<AIErrorRouter />} />
              <Route path="/ai-json-contract-assistant" element={<AIJsonContractAssistant />} />
              <Route path="/ai-tools" element={<AIToolsHub />} />
              <Route path="/json-formatter" element={<JsonFormatter />} />
              <Route path="/file-compare" element={<FileCompare />} />
              <Route path="/regex-tester" element={<RegexTester />} />
              <Route path="/base64" element={<Base64Tool />} />
              <Route path="/json-encode-decode" element={<JsonEncodeDecode />} />
              <Route path="/jwt-decoder" element={<JWTDecoder />} />
              <Route path="/url-encoder-decoder" element={<URLEncoderDecoder />} />
              <Route path="/timestamp-converter" element={<UnixTimestampConverter />} />
              <Route path="/hash-generator" element={<HashGenerator />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/blog" element={<BlogIndex />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/library" element={<MyLibrary />} />
              <Route path="/solutions" element={<SolutionsIndex />} />
              <Route path="/solutions/:slug" element={<SolutionDetail />} />
              <Route path="/workflows" element={<WorkflowsIndex />} />
              <Route path="/workflows/:slug" element={<WorkflowDetail />} />
              <Route path="/problems" element={<ProblemsIndex />} />
              <Route path="/problems/:slug" element={<ProblemDetail />} />
              <Route path="/workspace-studio" element={<WorkspaceStudio />} />
              <Route path="/shared-workspace/:shareId" element={<SharedWorkspace />} />
              <Route path="/growth-insights" element={<GrowthInsights />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>

          <ToolContentSections toolPath={currentTool?.link} />
          <RelatedWorkflowsRail currentToolPath={currentTool?.link} />
          <RelatedGuidesRail currentToolPath={currentTool?.link} />
          <RelatedToolsRail currentTool={currentTool} tools={toolsData} />
        </main>

        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;
