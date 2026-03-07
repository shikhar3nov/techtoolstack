// src/pages/NotFound.js
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { baseSEO } from '../seo/seoConfig';

const NotFound = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
    <Helmet>
      <title>404 - Page Not Found | TechToolStack</title>
      <meta name="description" content="Sorry, the page you are looking for does not exist on TechToolStack." />
      <meta name="robots" content="noindex" />
      <meta property="og:title" content="404 - Page Not Found" />
      <meta property="og:description" content="This page is missing or has been moved. Return to TechToolStack homepage." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`${baseSEO.siteUrl}/404`} />
    </Helmet>

    <h1 className="text-5xl font-bold text-blue-600 mb-4">404</h1>
    <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">Oops! Page not found.</p>
    <Link
      to="/"
      className="text-blue-600 hover:underline font-medium"
    >
      Go back home →
    </Link>
  </div>
);

export default NotFound;
