import React from 'react';
import { Link } from 'react-router-dom';
// import light_logo from '../assets/images/logo_light_tp_500x500.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const toolsLinks = [
    { name: 'AI Prompt Generator', path: '/ai-prompt-generator' },
    { name: 'AI Error Router', path: '/ai-error-router' },
    { name: 'AI JSON Contract Assistant', path: '/ai-json-contract-assistant' },
    { name: 'JSON Formatter', path: '/json-formatter' },
    { name: 'File Compare', path: '/file-compare' }
  ];

  const moreTools = [
    { name: 'Regular Expression Tester', path: '/regex-tester' },
    { name: 'JSON Encode/Decode', path: '/json-encode-decode' },
    { name: 'JWT Decoder', path: '/jwt-decoder' },
    { name: 'URL Encoder/Decoder', path: '/url-encoder-decoder' },
    { name: 'Unix Timestamp Converter', path: '/timestamp-converter' },
    { name: 'Hash Generator', path: '/hash-generator' }
  ];

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-gray-900/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      
      <div className="relative container mx-auto px-4 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              {/* <img 
                src={light_logo}
                alt="TechToolStack Logo" 
                className="transition-transform group-hover:scale-110 duration-300"  style={{ height: '3.5rem' }}
              /> */}
              {/* <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TT</span>
              </div> */}
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                TechToolStack
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Your go-to platform for essential developer tools. Streamline your workflow with our comprehensive suite of utilities.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="w-8 h-8 bg-gray-800 hover:bg-blue-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Follow on Twitter"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a 
                href="#" 
                className="w-8 h-8 bg-gray-800 hover:bg-blue-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Follow on GitHub"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a 
                href="#" 
                className="w-8 h-8 bg-gray-800 hover:bg-blue-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Follow on LinkedIn"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Tools Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Popular Tools</h3>
            <ul className="space-y-2">
              {toolsLinks.map((tool, index) => (
                <li key={index}>
                  <Link
                    to={tool.path}
                    className="text-gray-400 hover:text-blue-400 text-sm transition-colors duration-200 hover:translate-x-1 inline-block"
                  >
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* More Tools Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">More Tools</h3>
            <ul className="space-y-2">
              {moreTools.map((tool, index) => (
                <li key={index}>
                  <Link
                    to={tool.path}
                    className="text-gray-400 hover:text-blue-400 text-sm transition-colors duration-200 hover:translate-x-1 inline-block"
                  >
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-gray-400 hover:text-blue-400 text-sm transition-colors duration-200 hover:translate-x-1 inline-block"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/ai-tools"
                  className="text-gray-400 hover:text-blue-400 text-sm transition-colors duration-200 hover:translate-x-1 inline-block"
                >
                  AI Hub
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="text-gray-400 hover:text-blue-400 text-sm transition-colors duration-200 hover:translate-x-1 inline-block"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/library"
                  className="text-gray-400 hover:text-blue-400 text-sm transition-colors duration-200 hover:translate-x-1 inline-block"
                >
                  My Library
                </Link>
              </li>
              <li>
                <Link
                  to="/solutions"
                  className="text-gray-400 hover:text-blue-400 text-sm transition-colors duration-200 hover:translate-x-1 inline-block"
                >
                  Solutions
                </Link>
              </li>
              <li>
                <Link
                  to="/workflows"
                  className="text-gray-400 hover:text-blue-400 text-sm transition-colors duration-200 hover:translate-x-1 inline-block"
                >
                  Workflows
                </Link>
              </li>
              <li>
                <Link
                  to="/problems"
                  className="text-gray-400 hover:text-blue-400 text-sm transition-colors duration-200 hover:translate-x-1 inline-block"
                >
                  Problems
                </Link>
              </li>
              <li>
                <Link
                  to="/workspace-studio"
                  className="text-gray-400 hover:text-blue-400 text-sm transition-colors duration-200 hover:translate-x-1 inline-block"
                >
                  Workspace Studio
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-400 hover:text-blue-400 text-sm transition-colors duration-200 hover:translate-x-1 inline-block"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/file-compare"
                  className="text-gray-400 hover:text-blue-400 text-sm transition-colors duration-200 hover:translate-x-1 inline-block"
                >
                  File Compare
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-8"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            <p>
              &copy; {currentYear}{' '}
              <span className="font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                TechToolStack
              </span>
              . All rights reserved.
            </p>
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-gray-400">
            <span className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>All systems operational</span>
            </span>
            <span>Made with ❤️ for developers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
