import routeManifest from './routeManifest.json';
import blogPosts from '../data/blogPosts.json';
import toolsData from '../data/toolsData';
import toolContent from '../data/toolContent';
import landingPages from '../data/landingPages.json';
import workflows from '../data/workflows.json';
import problemPlaybooks from '../data/problemPlaybooks.json';

const canonicalSiteUrl = routeManifest.canonicalSiteUrl.replace(/\/$/, '');

export const baseSEO = {
  siteName: 'TechToolStack',
  siteUrl: canonicalSiteUrl,
  author: 'TechToolStack Team',
  twitterHandle: '@techtoolstack',
  language: 'en-US',
  defaultImage: '/og-image.png',
  defaultTwitterImage: '/twitter-image.png',
  themeColor: '#3B82F6'
};

const toCanonicalPath = (route = '/') => {
  if (!route) return '/';
  return route.startsWith('/') ? route : `/${route}`;
};

const buildCanonicalUrl = (route = '/') => `${baseSEO.siteUrl}${toCanonicalPath(route)}`;

const toTitleFromPath = (pathname) => {
  const safePath = toCanonicalPath(pathname).replace(/\//g, ' ').trim();
  if (!safePath) return 'Home';
  return safePath
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const toolByPath = toolsData.reduce((acc, tool) => {
  acc[tool.link] = tool;
  return acc;
}, {});

const toStructuredDataArray = (data) => {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
};

export const createToolSEO = (toolName, route, description, keywords, additionalData = {}) => ({
  title: `${toolName} - Free Online Tool | TechToolStack`,
  description,
  keywords,
  ogImage: `/tools/${route}-og.png`,
  ogType: 'website',
  ...additionalData
});

export const createToolStructuredData = (toolName, route, description) => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: toolName,
  url: buildCanonicalUrl(route),
  description,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Any',
  permissions: 'browser',
  author: {
    '@type': 'Organization',
    name: baseSEO.siteName
  }
});

const createArticleStructuredData = (post) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: post.title,
  description: post.description,
  author: {
    '@type': 'Organization',
    name: baseSEO.siteName
  },
  publisher: {
    '@type': 'Organization',
    name: baseSEO.siteName
  },
  datePublished: post.publishedAt,
  dateModified: post.updatedAt || post.publishedAt,
  mainEntityOfPage: buildCanonicalUrl(`/blog/${post.slug}`),
  url: buildCanonicalUrl(`/blog/${post.slug}`)
});

const createSolutionStructuredData = (solution) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: solution.title,
  description: solution.description,
  url: buildCanonicalUrl(`/solutions/${solution.slug}`),
  datePublished: solution.publishedAt,
  about: solution.keywords || []
});

const createWorkflowStructuredData = (workflow) => ({
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: workflow.title,
  description: workflow.description,
  url: buildCanonicalUrl(`/workflows/${workflow.slug}`),
  datePublished: workflow.publishedAt,
  step: (workflow.steps || []).map((item, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: item.title,
    text: item.description
  }))
});

const createProblemStructuredData = (problem) => ({
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: problem.title,
  description: problem.description,
  about: problem.keywords || [],
  datePublished: problem.publishedAt,
  url: buildCanonicalUrl(`/problems/${problem.slug}`)
});

const createFaqStructuredData = (pathname) => {
  const faqs = toolContent[pathname]?.faqs;
  if (!faqs || faqs.length === 0) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
};

const createBreadcrumbStructuredData = (pathname, pageName) => {
  const safePath = toCanonicalPath(pathname);

  if (safePath === '/') {
    return null;
  }

  const items = [{ name: 'Home', path: '/' }];

  if (safePath.startsWith('/blog/')) {
    items.push({ name: 'Blog', path: '/blog' });
    items.push({ name: pageName || toTitleFromPath(safePath), path: safePath });
  } else if (safePath.startsWith('/solutions/')) {
    items.push({ name: 'Solutions', path: '/solutions' });
    items.push({ name: pageName || toTitleFromPath(safePath), path: safePath });
  } else if (safePath.startsWith('/workflows/')) {
    items.push({ name: 'Workflows', path: '/workflows' });
    items.push({ name: pageName || toTitleFromPath(safePath), path: safePath });
  } else if (safePath.startsWith('/problems/')) {
    items.push({ name: 'Problems', path: '/problems' });
    items.push({ name: pageName || toTitleFromPath(safePath), path: safePath });
  } else {
    items.push({ name: pageName || toTitleFromPath(safePath), path: safePath });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: buildCanonicalUrl(item.path)
    }))
  };
};

export const seoPages = {
  '/': {
    title: 'TechToolStack - Free Online Developer Tools & Utilities',
    description:
      'Free online developer tools including AI Error Router, AI JSON Contract Assistant, AI Prompt Generator, JSON Formatter, File Compare, JWT Decoder and more.',
    keywords:
      'developer tools, ai developer tools, ai error router, ai json contract assistant, json formatter, file compare, jwt decoder, regex tester',
    ogImage: '/og-home.png',
    ogType: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: baseSEO.siteName,
      url: baseSEO.siteUrl,
      description: 'Free online developer tools and utilities',
      author: {
        '@type': 'Organization',
        name: baseSEO.siteName,
        url: baseSEO.siteUrl
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${baseSEO.siteUrl}/?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    }
  },
  '/ai-prompt-generator': createToolSEO(
    'AI Prompt Generator - Create Perfect Prompts for ChatGPT, Claude & More',
    'ai-prompt-generator',
    'Free AI Prompt Generator tool to create effective prompts for ChatGPT, Claude, Gemini and other AI models. Generate optimized prompts for better AI responses.',
    'AI prompt generator, ChatGPT prompts, Claude prompts, AI prompts, prompt engineering, prompt templates, AI tools'
  ),
  '/ai-error-router': createToolSEO(
    'AI Error Router - Route Errors To The Right Debug Workflow',
    'ai-error-router',
    'Paste an error, stack trace, or incident log to get AI-guided workflow routing, recommended tools, likely causes, and immediate fix actions.',
    'AI error router, incident triage tool, stack trace analyzer, debug workflow assistant, error troubleshooting tool'
  ),
  '/ai-json-contract-assistant': createToolSEO(
    'AI JSON Contract Assistant - Detect Schema Drift and Breaking Changes',
    'ai-json-contract-assistant',
    'Analyze baseline vs candidate JSON contracts to detect added, removed, and type-changed paths with compatibility risk, migration steps, and test payload guidance.',
    'AI json contract assistant, json schema drift checker, api contract compatibility tool, breaking change detector, json migration planner'
  ),
  '/ai-tools': {
    title: 'AI Tools Hub For Engineering Teams | TechToolStack',
    description:
      'Central hub for AI-powered developer tools including AI Error Router, AI JSON Contract Assistant, and AI Prompt Generator with workflow and playbook integrations.',
    keywords:
      'ai developer tools, ai error router, ai json contract assistant, ai prompt generator, ai workflow hub',
    ogImage: '/og-home.png',
    ogType: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'TechToolStack AI Tools Hub',
      url: buildCanonicalUrl('/ai-tools'),
      description: 'AI-powered tool collection for engineering incident routing and contract intelligence.'
    }
  },
  '/json-formatter': createToolSEO(
    'Online Formatter & Validator - Format JSON, XML, HTML, CSS, SQL, JS, YAML',
    'json-formatter',
    'Free online formatter and validator for JSON, XML, HTML, CSS, SQL, JavaScript, and YAML. Instantly beautify, validate, and minify your code and data online. Ideal for developers and testers.',
    'formatter, validator, beautifier, minifier, JSON formatter, XML formatter, HTML beautifier, SQL formatter, CSS beautifier, JavaScript formatter, YAML parser, online tools, developer tools'
  ),
  '/base64': createToolSEO(
    'Base64 Encoder & Decoder - Encode Decode Base64 Online',
    'base64',
    'Free Base64 encoder and decoder tool. Encode and decode text, images, and files to/from Base64 format instantly. Safe and secure online conversion.',
    'base64 encoder, base64 decoder, encode base64, decode base64, base64 converter, base64 tool online'
  ),
  '/json-encode-decode': createToolSEO(
    'JSON Encode Decode Tool - Encode and Decode JSON Strings Online',
    'json-encode-decode',
    'Free JSON encode and decode tool. Convert plain text/JSON into JSON-safe encoded strings and decode them back instantly.',
    'json encode decode, json string encoder, json string decoder, stringify json, parse json online'
  ),
  '/jwt-decoder': createToolSEO(
    'JWT Decoder & Validator - Decode JSON Web Tokens Online',
    'jwt-decoder',
    'Free JWT decoder and validator. Decode, verify and analyze JSON Web Tokens (JWT) online. Debug JWT tokens and inspect headers, payload, and signature.',
    'JWT decoder, JWT validator, JSON web token decoder, decode JWT, JWT debugger, JWT analyzer online'
  ),
  '/url-encoder-decoder': createToolSEO(
    'URL Encoder & Decoder - Encode Decode URLs Online',
    'url-encoder-decoder',
    'Free URL encoder and decoder tool. Encode and decode URLs, query parameters, and special characters. Perfect for web development and API testing.',
    'URL encoder, URL decoder, encode URL, decode URL, URL encoding, percent encoding, query parameter encoder'
  ),
  '/hash-generator': createToolSEO(
    'Hash Generator - MD5, SHA1, SHA256, SHA512 Online',
    'hash-generator',
    'Free online hash generator. Generate MD5, SHA1, SHA256, SHA512, and other hash values for text and files. Secure cryptographic hash calculator.',
    'hash generator, MD5 generator, SHA256 generator, SHA1 generator, SHA512 generator, hash calculator, checksum generator'
  ),
  '/file-compare': createToolSEO(
    'File Compare Tool - Compare Text Files & Code Online',
    'file-compare',
    'Free online file comparison tool. Compare text files, code, and documents side-by-side. Highlight differences and similarities instantly.',
    'file compare, diff tool, text compare, code compare, file difference, compare files online, diff checker'
  ),
  '/regex-tester': createToolSEO(
    'Regex Tester & Generator - Test Regular Expressions Online',
    'regex-tester',
    'Free online regex tester and generator. Test regular expressions, find matches, and validate patterns. Supports JavaScript, Python, PHP regex flavors.',
    'regex tester, regular expression tester, regex generator, regex validator, pattern matching, regex tool online'
  ),
  '/timestamp-converter': createToolSEO(
    'Unix Timestamp Converter - Convert Unix Time to Date Online',
    'timestamp-converter',
    'Free Unix timestamp converter. Convert Unix timestamps to human-readable dates and vice versa. Support for milliseconds and different time zones.',
    'unix timestamp converter, epoch converter, unix time converter, timestamp to date, date to timestamp, epoch time'
  ),
  '/blog': {
    title: 'Developer Guides & Engineering Workflows | TechToolStack Blog',
    description:
      'Practical developer guides for JSON formatting, JWT decoding, regex testing, and data transformation workflows.',
    keywords: 'developer blog, json guide, jwt guide, regex workflow, api testing tutorials',
    ogImage: '/blog-og.png',
    ogType: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: `${baseSEO.siteName} Blog`,
      url: buildCanonicalUrl('/blog'),
      description: 'Developer-focused implementation guides connected to practical online tools.'
    }
  },
  '/solutions': {
    title: 'Enterprise Solution Blueprints | TechToolStack',
    description:
      'High-intent solution pages connecting engineering outcomes to practical tool workflows and implementation guides.',
    keywords: 'developer workflow solutions, engineering blueprints, enterprise developer tools',
    ogImage: '/solutions-og.png',
    ogType: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'TechToolStack Solutions',
      url: buildCanonicalUrl('/solutions'),
      description: 'Solution-oriented pages for implementation workflows and product operations.'
    }
  },
  '/workflows': {
    title: 'Workflow Hub For Engineering Teams | TechToolStack',
    description:
      'Enterprise workflow hub for API debugging, release readiness checks, and security token diagnostics using connected developer tools.',
    keywords: 'engineering workflows, api debugging workflow, release readiness checklist, security diagnostics',
    ogImage: '/workflows-og.png',
    ogType: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'TechToolStack Workflow Hub',
      url: buildCanonicalUrl('/workflows'),
      description: 'Execution-focused engineering workflows mapped to practical tools.'
    }
  },
  '/problems': {
    title: 'Problem Playbooks For Common Developer Errors | TechToolStack',
    description:
      'Troubleshoot JSON, JWT, regex, URL encoding, and integrity errors with practical step-by-step playbooks.',
    keywords: 'developer error fixes, json parse error fix, jwt troubleshooting, regex issue resolution',
    ogImage: '/problems-og.png',
    ogType: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'TechToolStack Problem Playbooks',
      url: buildCanonicalUrl('/problems'),
      description: 'Practical error-resolution pages for real engineering incidents.'
    }
  },
  '/workspace-studio': {
    title: 'Workspace Studio - Team Sync & Templates | TechToolStack',
    description:
      'Create, sync, and share role-based engineering workspaces with templates for frontend, backend, QA, security, and product teams.',
    keywords: 'workspace studio, team sync developer tools, engineering templates, share debugging workspace',
    ogImage: '/workspace-og.png',
    ogType: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'TechToolStack Workspace Studio',
      url: buildCanonicalUrl('/workspace-studio'),
      applicationCategory: 'DeveloperApplication',
      description: 'Role-based collaborative workspace system for developer workflows.'
    }
  },
  '/library': {
    title: 'My Library - Saved Guides, Workflows, and Playbooks | TechToolStack',
    description:
      'Your saved knowledge library in TechToolStack for quick access to guides, workflows, solution blueprints, and problem playbooks.',
    keywords: 'saved developer guides, workflow library, playbook bookmarks, developer knowledge base',
    ogImage: '/og-image.png',
    ogType: 'website',
    noindex: true
  },
  '/growth-insights': {
    title: 'Growth Insights Dashboard | TechToolStack',
    description: 'Internal growth telemetry and SEO rollout checklist for TechToolStack.',
    keywords: 'growth analytics, seo insights, conversion events',
    ogImage: '/og-image.png',
    ogType: 'website',
    noindex: true
  },
  '/contact': {
    title: 'Contact Us - Get in Touch | TechToolStack',
    description:
      "Have questions or feedback about our developer tools? Contact the TechToolStack team. We'd love to hear from you and help improve our tools.",
    keywords: 'contact, support, feedback, help, developer tools support',
    ogImage: '/contact-og.png',
    ogType: 'website'
  }
};

export const defaultSEO = {
  title: '404 - Page Not Found | TechToolStack',
  description: "The page you're looking for doesn't exist. Explore our free developer tools and utilities.",
  keywords: 'developer tools, online tools, web tools',
  ogImage: baseSEO.defaultImage,
  noindex: true
};

export const getSEOData = (pathname) => {
  if (pathname && pathname.startsWith('/blog/')) {
    const slug = pathname.replace('/blog/', '');
    const post = blogPosts.find((item) => item.slug === slug);

    if (post) {
      return {
        title: `${post.title} | ${baseSEO.siteName}`,
        description: post.description,
        keywords: post.keywords.join(', '),
        ogImage: '/blog-og.png',
        ogType: 'article',
        article: {
          publishedTime: post.publishedAt,
          modifiedTime: post.updatedAt || post.publishedAt
        },
        structuredData: [
          createArticleStructuredData(post),
          createBreadcrumbStructuredData(pathname, post.title)
        ]
      };
    }

    return defaultSEO;
  }

  if (pathname && pathname.startsWith('/solutions/')) {
    const slug = pathname.replace('/solutions/', '');
    const solution = landingPages.find((item) => item.slug === slug);

    if (solution) {
      return {
        title: `${solution.title} | ${baseSEO.siteName} Solutions`,
        description: solution.description,
        keywords: solution.keywords.join(', '),
        ogImage: '/solutions-og.png',
        ogType: 'article',
        article: {
          publishedTime: solution.publishedAt,
          modifiedTime: solution.publishedAt
        },
        structuredData: [
          createSolutionStructuredData(solution),
          createBreadcrumbStructuredData(pathname, solution.title)
        ]
      };
    }

    return defaultSEO;
  }

  if (pathname && pathname.startsWith('/workflows/')) {
    const slug = pathname.replace('/workflows/', '');
    const workflow = workflows.find((item) => item.slug === slug);

    if (workflow) {
      return {
        title: `${workflow.title} | ${baseSEO.siteName} Workflows`,
        description: workflow.description,
        keywords: workflow.keywords.join(', '),
        ogImage: '/workflows-og.png',
        ogType: 'article',
        article: {
          publishedTime: workflow.publishedAt,
          modifiedTime: workflow.publishedAt
        },
        structuredData: [
          createWorkflowStructuredData(workflow),
          createBreadcrumbStructuredData(pathname, workflow.title)
        ]
      };
    }

    return defaultSEO;
  }

  if (pathname && pathname.startsWith('/problems/')) {
    const slug = pathname.replace('/problems/', '');
    const problem = problemPlaybooks.find((item) => item.slug === slug);

    if (problem) {
      return {
        title: `${problem.title} | ${baseSEO.siteName} Problem Playbook`,
        description: problem.description,
        keywords: problem.keywords.join(', '),
        ogImage: '/problems-og.png',
        ogType: 'article',
        article: {
          publishedTime: problem.publishedAt,
          modifiedTime: problem.publishedAt
        },
        structuredData: [
          createProblemStructuredData(problem),
          createBreadcrumbStructuredData(pathname, problem.title)
        ]
      };
    }

    return defaultSEO;
  }

  if (pathname && pathname.startsWith('/shared-workspace/')) {
    return {
      title: 'Shared Workspace | TechToolStack',
      description: 'Shared workspace snapshot for collaboration and cloning.',
      keywords: 'shared workspace, collaboration, developer workflow',
      ogImage: '/workspace-og.png',
      ogType: 'website',
      noindex: true
    };
  }

  const pageSeo = seoPages[pathname] || defaultSEO;
  if (pageSeo === defaultSEO) {
    return defaultSEO;
  }

  const structuredData = toStructuredDataArray(pageSeo.structuredData);
  const tool = toolByPath[pathname];

  if (tool) {
    structuredData.push(createToolStructuredData(tool.name, pathname, pageSeo.description));
    const faqStructuredData = createFaqStructuredData(pathname);
    if (faqStructuredData) {
      structuredData.push(faqStructuredData);
    }
  }

  const breadcrumbLabel =
    tool?.name ||
    (pathname === '/blog'
      ? 'Blog'
      : pathname === '/solutions'
        ? 'Solutions'
        : pathname === '/workflows'
          ? 'Workflows'
          : pathname === '/problems'
            ? 'Problems'
            : pathname === '/workspace-studio'
              ? 'Workspace Studio'
              : pathname === '/library'
                ? 'My Library'
                : pathname === '/ai-tools'
                  ? 'AI Tools Hub'
                  : pathname === '/contact'
                    ? 'Contact'
                    : pathname === '/growth-insights'
                      ? 'Growth Insights'
                      : null);
  const breadcrumbStructuredData = createBreadcrumbStructuredData(pathname, breadcrumbLabel);
  if (breadcrumbStructuredData) {
    structuredData.push(breadcrumbStructuredData);
  }

  return {
    ...pageSeo,
    structuredData
  };
};

export const addNewTool = (route, toolConfig) => {
  seoPages[route] = toolConfig;
};
