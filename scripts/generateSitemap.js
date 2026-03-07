const fs = require('fs');
const path = require('path');

const routeManifestPath = path.join(__dirname, '../frontend/src/seo/routeManifest.json');
const contentManifestPath = path.join(__dirname, '../frontend/src/seo/contentManifest.json');
const blogPostsPath = path.join(__dirname, '../frontend/src/data/blogPosts.json');
const landingPagesPath = path.join(__dirname, '../frontend/src/data/landingPages.json');
const workflowsPath = path.join(__dirname, '../frontend/src/data/workflows.json');
const problemPlaybooksPath = path.join(__dirname, '../frontend/src/data/problemPlaybooks.json');
const sitemapOutputPath = path.join(__dirname, '../frontend/public/sitemap.xml');
const robotsOutputPath = path.join(__dirname, '../frontend/public/robots.txt');

const readJsonFile = (filePath, fallback) => {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
};

const toRoutePath = (value) => {
  if (!value || typeof value !== 'string') {
    return '/';
  }
  return value.startsWith('/') ? value : `/${value}`;
};

const toPriority = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toFixed(1);
  }
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  return '0.8';
};

const normalizeRoute = (route, today) => ({
  path: toRoutePath(route.path),
  indexable: route.indexable !== false,
  changefreq: route.changefreq || 'monthly',
  priority: toPriority(route.priority),
  lastmod: route.lastmod || today
});

const buildUniqueRoutes = (routes) => {
  const unique = new Map();
  routes.forEach((route) => {
    if (!route.indexable) {
      return;
    }
    unique.set(route.path, route);
  });

  return [...unique.values()].sort((a, b) => {
    if (a.path === '/') return -1;
    if (b.path === '/') return 1;
    return a.path.localeCompare(b.path);
  });
};

const generateSitemap = () => {
  const today = new Date().toISOString().split('T')[0];
  const routeManifest = readJsonFile(routeManifestPath, {
    canonicalSiteUrl: 'https://www.techtoolstack.com',
    routes: []
  });
  const contentManifest = readJsonFile(contentManifestPath, { routes: [] });
  const blogPosts = readJsonFile(blogPostsPath, []);
  const landingPages = readJsonFile(landingPagesPath, []);
  const workflows = readJsonFile(workflowsPath, []);
  const problemPlaybooks = readJsonFile(problemPlaybooksPath, []);

  const canonicalSiteUrl = (routeManifest.canonicalSiteUrl || 'https://www.techtoolstack.com').replace(/\/$/, '');

  const normalizedAppRoutes = (routeManifest.routes || []).map((route) => normalizeRoute(route, today));
  const normalizedContentRoutes = (contentManifest.routes || []).map((route) => normalizeRoute(route, today));
  const normalizedBlogRoutes = (blogPosts || []).map((post) =>
    normalizeRoute(
      {
        path: `/blog/${post.slug}`,
        indexable: true,
        changefreq: 'monthly',
        priority: 0.7,
        lastmod: post.updatedAt || post.publishedAt || today
      },
      today
    )
  );
  const normalizedSolutionRoutes = (landingPages || []).map((page) =>
    normalizeRoute(
      {
        path: `/solutions/${page.slug}`,
        indexable: true,
        changefreq: 'monthly',
        priority: 0.7,
        lastmod: page.updatedAt || page.publishedAt || today
      },
      today
    )
  );
  const normalizedWorkflowRoutes = (workflows || []).map((workflow) =>
    normalizeRoute(
      {
        path: `/workflows/${workflow.slug}`,
        indexable: true,
        changefreq: 'monthly',
        priority: 0.7,
        lastmod: workflow.updatedAt || workflow.publishedAt || today
      },
      today
    )
  );
  const normalizedProblemRoutes = (problemPlaybooks || []).map((problem) =>
    normalizeRoute(
      {
        path: `/problems/${problem.slug}`,
        indexable: true,
        changefreq: 'monthly',
        priority: 0.7,
        lastmod: problem.updatedAt || problem.publishedAt || today
      },
      today
    )
  );
  const routes = buildUniqueRoutes([
    ...normalizedAppRoutes,
    ...normalizedContentRoutes,
    ...normalizedBlogRoutes,
    ...normalizedSolutionRoutes,
    ...normalizedWorkflowRoutes,
    ...normalizedProblemRoutes
  ]);

  const urlset = routes
    .map(
      (route) => `  <url>\n    <loc>${canonicalSiteUrl}${route.path}</loc>\n    <lastmod>${route.lastmod}</lastmod>\n    <changefreq>${route.changefreq}</changefreq>\n    <priority>${route.priority}</priority>\n  </url>`
    )
    .join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n</urlset>\n`;
  fs.writeFileSync(sitemapOutputPath, sitemap, 'utf8');

  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${canonicalSiteUrl}/sitemap.xml\n`;
  fs.writeFileSync(robotsOutputPath, robots, 'utf8');

  console.log(`✅ sitemap.xml generated with ${routes.length} URL(s): ${sitemapOutputPath}`);
  console.log(`✅ robots.txt generated: ${robotsOutputPath}`);
};

generateSitemap();
