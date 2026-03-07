# SEO Deployment Checklist (Enterprise Rollout)

## 1. Verification and Indexation
1. Create Google Search Console property for `https://www.techtoolstack.com`.
2. Create Bing Webmaster Tools property for `https://www.techtoolstack.com`.
3. Set verification environment variables in frontend deployment:
   - `REACT_APP_GOOGLE_SITE_VERIFICATION=<token>`
   - `REACT_APP_BING_SITE_VERIFICATION=<token>`
4. Deploy and confirm meta verification tags are visible in page source.
5. Submit sitemap: `https://www.techtoolstack.com/sitemap.xml` to both consoles.

## 2. Crawl Controls
1. Confirm `robots.txt` is accessible and references the sitemap.
2. Confirm all indexable routes are present in generated `sitemap.xml`.
3. Keep internal-only routes (`/growth-insights`) marked `noindex`.

## 3. Analytics and Conversion Tracking
1. Set analytics environment variables in frontend deployment:
   - `REACT_APP_GA4_MEASUREMENT_ID=G-XXXXXXXXXX` (optional but recommended)
   - `REACT_APP_GTM_CONTAINER_ID=GTM-XXXXXXX` (optional; use GA4 only or GTM only based on stack)
2. Connect Google Analytics 4 or GTM and verify data flow in GA4 DebugView.
3. Validate custom conversion events in analytics:
   - `blog_to_tool_click`
   - `solution_to_tool_click`
   - `tool_card_click`
   - `tool_to_blog_click`
4. Mark conversion events in GA4 Admin for reporting:
   - `blog_to_tool_click`
   - `solution_to_tool_click`
5. Create conversion goals for:
   - Blog -> Tool
   - Solution -> Tool
   - Homepage CTA -> Solution/Blog

## 4. Content and Keyword Operations
1. Monitor Search Console queries for tool pages, `/blog`, and `/solutions`.
2. Expand solution clusters monthly based on impressions and CTR gaps.
3. Refresh low-performing titles/meta descriptions using search intent data.
4. Add at least 2 supporting articles per core tool category each month.

## 5. Technical QA Gates Before Release
1. Run `npm run build` and confirm sitemap generation in prebuild step.
2. Validate canonical tags and structured data for:
   - Home
   - One tool page
   - One blog article
   - One solution page
3. Run mobile and desktop checks on Lighthouse for target pages.
4. Verify no broken internal links across tools, blog, and solutions.
