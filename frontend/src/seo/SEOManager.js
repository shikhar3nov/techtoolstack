// seo/SEOManager.js - Centralized SEO Management
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { baseSEO, getSEOData } from './seoConfig';

// Main SEO Manager Component
const SEOManager = () => {
  const location = useLocation();
  const currentPath = location.pathname || '/';
  const seo = getSEOData(currentPath);
  const googleSiteVerification = process.env.REACT_APP_GOOGLE_SITE_VERIFICATION;
  const bingSiteVerification = process.env.REACT_APP_BING_SITE_VERIFICATION;
  const structuredDataBlocks = Array.isArray(seo.structuredData)
    ? seo.structuredData
    : seo.structuredData
      ? [seo.structuredData]
      : [];
  const robotsContent = seo.noindex
    ? 'noindex, nofollow'
    : seo.robots || 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
  const ogType = seo.ogType || 'website';
  
  const canonicalUrl = `${baseSEO.siteUrl}${currentPath}`;
  const ogImageUrl = `${baseSEO.siteUrl}${seo.ogImage || baseSEO.defaultImage}`;
  const twitterImageUrl = `${baseSEO.siteUrl}${seo.twitterImage || baseSEO.defaultTwitterImage}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="keywords" content={seo.keywords} />
      <meta name="author" content={baseSEO.author} />
      <meta name="language" content={baseSEO.language} />
      <meta name="robots" content={robotsContent} />
      <meta name="revisit-after" content="7 days" />
      <meta name="rating" content="general" />

      {googleSiteVerification && <meta name="google-site-verification" content={googleSiteVerification} />}
      {bingSiteVerification && <meta name="msvalidate.01" content={bingSiteVerification} />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={baseSEO.siteName} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_US" />

      {seo.article?.publishedTime && (
        <meta property="article:published_time" content={seo.article.publishedTime} />
      )}
      {seo.article?.modifiedTime && (
        <meta property="article:modified_time" content={seo.article.modifiedTime} />
      )}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={baseSEO.twitterHandle} />
      <meta name="twitter:creator" content={baseSEO.twitterHandle} />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={twitterImageUrl} />
      
      {/* Structured Data */}
      {structuredDataBlocks.map((structuredData, index) => (
        <script key={`schema-${index}`} type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      ))}
      
      {/* Additional Meta Tags for Tools */}
      {currentPath !== '/' && (
        <>
          <meta name="application-name" content={baseSEO.siteName} />
          <meta name="theme-color" content={baseSEO.themeColor} />
        </>
      )}
      
      {/* Favicon and App Icons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
    </Helmet>
  );
};

export default SEOManager;
