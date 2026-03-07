import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import light_logo from '../assets/images/logo_light_tp.png';
import dark_logo from '../assets/images/logo_dark_tp.png';

const Header = () => {
  const [isDark, setIsDark] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const tools = [
    { name: 'AI Prompt Generator', path: '/ai-prompt-generator' },
    { name: 'AI Error Router', path: '/ai-error-router' },
    { name: 'AI JSON Contract Assistant', path: '/ai-json-contract-assistant' },
    { name: 'JSON Formatter', path: '/json-formatter' },
    { name: 'File Compare', path: '/file-compare' },
    { name: 'Regular Expression Tester', path: '/regex-tester' },
    { name: 'Base64 Encode/Decode', path: '/base64' },
    { name: 'JSON Encode/Decode', path: '/json-encode-decode' },
    { name: 'JWT Decoder', path: '/jwt-decoder' },
    { name: 'URL Encoder/Decoder', path: '/url-encoder-decoder' },
    { name: 'Unix Timestamp Converter', path: '/timestamp-converter' },
    { name: 'Hash Generator', path: '/hash-generator' }
  ];

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const isDarkMode = saved === 'dark';
    setIsDark(isDarkMode);
    
    // Apply theme on mount
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white/80 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/20 dark:border-gray-700/30 shadow-lg sticky top-0 z-50 transition-all duration-300">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <img 
                src={
                  isDark ? dark_logo : light_logo
                }
                alt="TechToolStack Logo" 
                className="transition-transform group-hover:scale-110 duration-300"  style={{ height: '3rem' }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </div>
            {/* <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              TechToolStack
            </span> */}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 ${
                isActive('/') 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Home
              {isActive('/') && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></span>
              )}
            </Link>

            {/* Tools Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setIsToolsOpen(true)}
              onMouseLeave={() => setIsToolsOpen(false)}
            >
              <button className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
                <span>Tools</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-300 ${isToolsOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              <div className={`absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 ${
                isToolsOpen ? 'opacity-100 visible transform translate-y-0' : 'opacity-0 invisible transform -translate-y-2'
              }`}>
                <div className="py-2">
                  {tools.map((tool, index) => (
                    <Link
                      key={index}
                      to={tool.path}
                      className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                      onClick={() => setIsToolsOpen(false)}
                    >
                      {tool.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link
              to="/ai-tools"
              className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 ${
                isActive('/ai-tools')
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              AI Hub
              {isActive('/ai-tools') && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></span>
              )}
            </Link>

            <Link
              to="/blog"
              className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 ${
                isActive('/blog') || location.pathname.startsWith('/blog/')
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Blog
              {(isActive('/blog') || location.pathname.startsWith('/blog/')) && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></span>
              )}
            </Link>

            <Link
              to="/library"
              className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 ${
                isActive('/library')
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Library
              {isActive('/library') && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></span>
              )}
            </Link>

            <Link
              to="/workflows"
              className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 ${
                isActive('/workflows') || location.pathname.startsWith('/workflows/')
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Workflows
              {(isActive('/workflows') || location.pathname.startsWith('/workflows/')) && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></span>
              )}
            </Link>

            <Link
              to="/problems"
              className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 ${
                isActive('/problems') || location.pathname.startsWith('/problems/')
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Problems
              {(isActive('/problems') || location.pathname.startsWith('/problems/')) && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></span>
              )}
            </Link>

            <Link
              to="/solutions"
              className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 ${
                isActive('/solutions') || location.pathname.startsWith('/solutions/')
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Solutions
              {(isActive('/solutions') || location.pathname.startsWith('/solutions/')) && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></span>
              )}
            </Link>

            <Link
              to="/workspace-studio"
              className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 ${
                isActive('/workspace-studio') || location.pathname.startsWith('/shared-workspace/')
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Workspace
              {(isActive('/workspace-studio') || location.pathname.startsWith('/shared-workspace/')) && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></span>
              )}
            </Link>

            <Link
              to="/contact"
              className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 ${
                isActive('/contact') 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Contact
              {isActive('/contact') && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></span>
              )}
            </Link>
          </nav>

          {/* Theme Toggle & Mobile Menu */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="relative p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 group"
              aria-label="Toggle theme"
            >
              <div className="relative w-5 h-5">
                <svg 
                  className={`absolute inset-0 w-5 h-5 text-yellow-500 transition-all duration-300 ${
                    isDark ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'
                  }`}
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
                <svg 
                  className={`absolute inset-0 w-5 h-5 text-blue-500 transition-all duration-300 ${
                    isDark ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'
                  }`}
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              </div>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
              aria-label="Toggle mobile menu"
            >
              <svg 
                className={`w-6 h-6 text-gray-700 dark:text-gray-200 transition-transform duration-300 ${
                  isMobileMenuOpen ? 'rotate-90' : ''
                }`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}>
          <div className="py-4 space-y-2 border-t border-gray-200 dark:border-gray-700">
            <Link
              to="/"
              className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive('/') 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            
            <div className="px-4 py-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tools</span>
            </div>
            
            {tools.map((tool, index) => (
              <Link
                key={index}
                to={tool.path}
                className="block px-6 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {tool.name}
              </Link>
            ))}
            
            <Link
              to="/ai-tools"
              className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive('/ai-tools')
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              AI Hub
            </Link>

            <Link
              to="/blog"
              className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive('/blog') || location.pathname.startsWith('/blog/')
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Blog
            </Link>

            <Link
              to="/library"
              className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive('/library')
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Library
            </Link>

            <Link
              to="/workflows"
              className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive('/workflows') || location.pathname.startsWith('/workflows/')
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Workflows
            </Link>

            <Link
              to="/problems"
              className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive('/problems') || location.pathname.startsWith('/problems/')
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Problems
            </Link>

            <Link
              to="/solutions"
              className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive('/solutions') || location.pathname.startsWith('/solutions/')
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Solutions
            </Link>

            <Link
              to="/workspace-studio"
              className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive('/workspace-studio') || location.pathname.startsWith('/shared-workspace/')
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Workspace
            </Link>

            <Link
              to="/contact"
              className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive('/contact') 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
