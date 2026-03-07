import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const RegexTester = () => {
  const [pattern, setPattern] = useState('');
  const [testString, setTestString] = useState('');
  const [flags, setFlags] = useState({ g: true, m: false, i: false, s: false });
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');
  const [explanation, setExplanation] = useState('');
  const [showExplanation, setShowExplanation] = useState(true);
  const [showMatchInfo, setShowMatchInfo] = useState(true);
  const [showQuickRef, setShowQuickRef] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Quick reference data
  const quickReference = [
    { pattern: 'a{3,}', description: '3 or more of a', example: 'a{3,}' },
    { pattern: 'a{3,6}', description: 'Between 3 and 6 of a', example: 'a{3,6}' },
    { pattern: '^', description: 'Start of string', example: '^' },
    { pattern: '$', description: 'End of string', example: '$' },
    { pattern: '\\b', description: 'A word boundary', example: '\\b' },
    { pattern: '\\B', description: 'Non-word boundary', example: '\\B' }
  ];

  const commonTokens = [
    { token: '.', description: 'Any character except newline' },
    { token: '\\d', description: 'Any digit' },
    { token: '\\w', description: 'Any word character' },
    { token: '\\s', description: 'Any whitespace character' },
    { token: '*', description: '0 or more repetitions' },
    { token: '+', description: '1 or more repetitions' },
    { token: '?', description: '0 or 1 repetition' },
    { token: '[]', description: 'Character class' },
    { token: '()', description: 'Capturing group' },
    { token: '|', description: 'Alternation' }
  ];

  const generalTokens = [
    { token: '.', description: 'Any character except newline' },
    { token: '*', description: '0 or more repetitions' },
    { token: '+', description: '1 or more repetitions' },
    { token: '?', description: '0 or 1 repetition' },
    { token: '{n}', description: 'Exactly n repetitions' },
    { token: '{n,}', description: 'n or more repetitions' },
    { token: '{n,m}', description: 'Between n and m repetitions' }
  ];

  const characterClasses = [
    { token: '\\d', description: 'Any digit (0-9)' },
    { token: '\\D', description: 'Any non-digit' },
    { token: '\\w', description: 'Any word character (a-z, A-Z, 0-9, _)' },
    { token: '\\W', description: 'Any non-word character' },
    { token: '\\s', description: 'Any whitespace character' },
    { token: '\\S', description: 'Any non-whitespace character' },
    { token: '[abc]', description: 'Any of a, b, or c' },
    { token: '[^abc]', description: 'Not a, b, or c' },
    { token: '[a-z]', description: 'Character between a and z' }
  ];

  // Generate regex explanation
  const generateExplanation = (regex) => {
    if (!regex) return 'Enter a regular expression to see explanation';
    
    let explanation = 'Regular expression breakdown:\n\n';
    
    if (regex.includes('^')) explanation += '^ - Matches start of string\n';
    if (regex.includes('$')) explanation += '$ - Matches end of string\n';
    if (regex.includes('\\d')) explanation += '\\d - Matches any digit (0-9)\n';
    if (regex.includes('\\w')) explanation += '\\w - Matches any word character (a-z, A-Z, 0-9, _)\n';
    if (regex.includes('\\s')) explanation += '\\s - Matches any whitespace character\n';
    if (regex.includes('.')) explanation += '. - Matches any character except newline\n';
    if (regex.includes('*')) explanation += '* - Matches 0 or more of the preceding element\n';
    if (regex.includes('+')) explanation += '+ - Matches 1 or more of the preceding element\n';
    if (regex.includes('?')) explanation += '? - Matches 0 or 1 of the preceding element\n';
    if (regex.includes('|')) explanation += '| - Alternation (OR operator)\n';
    if (regex.includes('[')) explanation += '[] - Character class, matches any character inside\n';
    if (regex.includes('(')) explanation += '() - Capturing group\n';
    
    return explanation || 'Basic regex pattern';
  };

  // Test regex pattern
  useEffect(() => {
    const testRegex = () => {
      if (!pattern) {
        setMatches([]);
        setError('');
        setExplanation('Enter a regular expression to see explanation');
        return;
      }

      try {
        const flagString = Object.entries(flags)
          .filter(([_, enabled]) => enabled)
          .map(([flag, _]) => flag)
          .join('');
        
        const regex = new RegExp(pattern, flagString);
        setError('');
        setExplanation(generateExplanation(pattern));

        if (!testString) {
          setMatches([]);
          return;
        }

        const allMatches = [];
        let match;

        if (flags.g) {
          const globalRegex = new RegExp(pattern, flagString);
          while ((match = globalRegex.exec(testString)) !== null) {
            allMatches.push({
              match: match[0],
              index: match.index,
              groups: match.slice(1),
              input: match.input
            });
            if (match.index === globalRegex.lastIndex) break;
          }
        } else {
          match = regex.exec(testString);
          if (match) {
            allMatches.push({
              match: match[0],
              index: match.index,
              groups: match.slice(1),
              input: match.input
            });
          }
        }

        setMatches(allMatches);
      } catch (err) {
        setError(err.message);
        setMatches([]);
        setExplanation('Invalid regular expression');
      }
    };

    // Debounce the calls
    const timeoutId = setTimeout(() => {
      testRegex();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [pattern, testString, flags]);

  const highlightMatches = (text, matches) => {
    if (!matches.length) return text;

    let result = [];
    let lastIndex = 0;

    matches.forEach((match, i) => {
      if (match.index > lastIndex) {
        result.push(text.slice(lastIndex, match.index));
      }
      
      result.push(
        <span key={i} className="bg-yellow-300 dark:bg-yellow-500 text-black px-1 rounded">
          {match.match}
        </span>
      );
      
      lastIndex = match.index + match.match.length;
    });

    if (lastIndex < text.length) {
      result.push(text.slice(lastIndex));
    }

    return result;
  };

  // Filter reference items based on search
  const filterReferenceItems = (items) => {
    if (!searchTerm) return items;
    return items.filter(item => 
      item.token?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pattern?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="bg-gray-100 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200">
          {/* Tool Header */}
          <div className="text-center mb-4 mt-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center mb-1">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">Regular Expression Tester</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm mb-3">Test, debug, and validate regular expressions instantly</p>
          </div>

          {/* Main Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
              {/* Left Panel - Main Testing Area */}
              <div className="xl:col-span-2 space-y-4">
                {/* Regular Expression Input */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <label className="text-red-500 dark:text-red-400 font-semibold text-sm uppercase tracking-wide">
                      Regular Expression
                    </label>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className={matches.length > 0 ? 'text-green-500 dark:text-green-400' : 'text-gray-400'}>
                        {matches.length > 0 ? `${matches.length} match${matches.length !== 1 ? 'es' : ''}` : 'no match'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <div className="flex items-center flex-1 min-w-0">
                      <span className="text-gray-400 mr-2 flex-shrink-0">/</span>
                      <input
                        type="text"
                        value={pattern}
                        onChange={(e) => setPattern(e.target.value)}
                        placeholder="insert your regular expression here"
                        className="flex-1 min-w-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none"
                      />
                      <span className="text-gray-400 mx-2 flex-shrink-0">/</span>
                    </div>
                    
                    {/* Flags */}
                    <div className="flex space-x-2 flex-shrink-0">
                      {Object.entries(flags).map(([flag, enabled]) => (
                        <button
                          key={flag}
                          onClick={() => setFlags(prev => ({ ...prev, [flag]: !enabled }))}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            enabled 
                              ? 'bg-purple-600 text-white' 
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          {flag}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {error && (
                    <div className="mt-2 text-red-500 dark:text-red-400 text-sm">{error}</div>
                  )}
                </div>

                {/* Test String Input */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <label className="text-red-500 dark:text-red-400 font-semibold text-sm uppercase tracking-wide">
                      Test String
                    </label>
                  </div>
                  
                  <div className="p-4">
                    <textarea
                      value={testString}
                      onChange={(e) => setTestString(e.target.value)}
                      placeholder="insert your test string here"
                      className="w-full h-32 sm:h-40 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 p-3 rounded border border-gray-200 dark:border-gray-600 resize-none outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      style={{ lineHeight: '1.5' }}
                    />
                    
                    {/* Display highlighted text */}
                    {testString && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                        {highlightMatches(testString, matches)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Panel - Information sections */}
              <div className="space-y-4">
                {/* Explanation Section */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                  <button
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="text-red-500 dark:text-red-400 font-semibold text-sm uppercase tracking-wide">
                      Explanation
                    </span>
                    <span className="text-gray-400">{showExplanation ? '▲' : '▼'}</span>
                  </button>
                  
                  {showExplanation && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                        An explanation of your regex will be automatically generated as you type.
                      </p>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm whitespace-pre-line max-h-48 overflow-y-auto">
                        {explanation}
                      </div>
                    </div>
                  )}
                </div>

                {/* Match Information */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                  <button
                    onClick={() => setShowMatchInfo(!showMatchInfo)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="text-red-500 dark:text-red-400 font-semibold text-sm uppercase tracking-wide">
                      Match Information
                    </span>
                    <span className="text-gray-400">{showMatchInfo ? '▲' : '▼'}</span>
                  </button>
                  
                  {showMatchInfo && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                        Detailed match information will be displayed here automatically.
                      </p>
                      
                      <div className="max-h-64 overflow-y-auto">
                        {matches.length > 0 ? (
                          <div className="space-y-2">
                            {matches.map((match, index) => (
                              <div key={index} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded text-sm">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-2">
                                  <span className="text-yellow-600 dark:text-yellow-400 font-medium">Match {index + 1}</span>
                                  <span className="text-gray-500 dark:text-gray-400 text-xs">Position: {match.index}-{match.index + match.match.length}</span>
                                </div>
                                <div className="text-gray-900 dark:text-white font-mono bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600 break-all">{match.match}</div>
                                {match.groups.length > 0 && (
                                  <div className="mt-2">
                                    <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Groups:</div>
                                    {match.groups.map((group, gi) => (
                                      <div key={gi} className="text-green-600 dark:text-green-400 text-xs ml-2 font-mono break-all">
                                        Group {gi + 1}: {group || '(empty)'}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No matches found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Reference */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                  <button
                    onClick={() => setShowQuickRef(!showQuickRef)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="text-red-500 dark:text-red-400 font-semibold text-sm uppercase tracking-wide">
                      Quick Reference
                    </span>
                    <span className="text-gray-400">{showQuickRef ? '▲' : '▼'}</span>
                  </button>
                  
                  {showQuickRef && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search reference"
                          className="w-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 p-2 rounded text-sm border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        <div className="p-4 space-y-6">
                          {/* Common Tokens */}
                          {filterReferenceItems(commonTokens).length > 0 && (
                            <div>
                              <h4 className="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-3 flex items-center sticky top-0 bg-white dark:bg-gray-800 py-1 z-10">
                                ⭐ Common Tokens
                              </h4>
                              <div className="space-y-1">
                                {filterReferenceItems(commonTokens).map((item, index) => (
                                  <button
                                    key={index}
                                    onClick={() => setPattern(prev => prev + item.token)}
                                    className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded text-sm group transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="text-green-600 dark:text-green-400 font-mono font-semibold">{item.token}</span>
                                    </div>
                                    <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">{item.description}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* General Tokens */}
                          {filterReferenceItems(generalTokens).length > 0 && (
                            <div>
                              <h4 className="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-3 flex items-center sticky top-0 bg-white dark:bg-gray-800 py-1 z-10">
                                ⚙️ General Tokens
                              </h4>
                              <div className="space-y-1">
                                {filterReferenceItems(generalTokens).map((item, index) => (
                                  <button
                                    key={index}
                                    onClick={() => setPattern(prev => prev + item.token)}
                                    className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded text-sm group transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="text-green-600 dark:text-green-400 font-mono font-semibold">{item.token}</span>
                                    </div>
                                    <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">{item.description}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Anchors */}
                          {filterReferenceItems(quickReference).length > 0 && (
                            <div>
                              <h4 className="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-3 flex items-center sticky top-0 bg-white dark:bg-gray-800 py-1 z-10">
                                ⚓ Anchors
                              </h4>
                              <div className="space-y-1">
                                {filterReferenceItems(quickReference).map((item, index) => (
                                  <button
                                    key={index}
                                    onClick={() => setPattern(prev => prev + item.pattern)}
                                    className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded text-sm transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="text-green-600 dark:text-green-400 font-mono font-semibold">{item.pattern}</span>
                                    </div>
                                    <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">{item.description}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Character Classes */}
                          {filterReferenceItems(characterClasses).length > 0 && (
                            <div>
                              <h4 className="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-3 flex items-center sticky top-0 bg-white dark:bg-gray-800 py-1 z-10">
                                🔤 Character Classes
                              </h4>
                              <div className="space-y-1">
                                {filterReferenceItems(characterClasses).map((item, index) => (
                                  <button
                                    key={index}
                                    onClick={() => setPattern(prev => prev + item.token)}
                                    className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded text-sm group transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="text-green-600 dark:text-green-400 font-mono font-semibold">{item.token}</span>
                                    </div>
                                    <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">{item.description}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* No results message */}
                          {searchTerm && 
                          filterReferenceItems(commonTokens).length === 0 && 
                          filterReferenceItems(generalTokens).length === 0 && 
                          filterReferenceItems(quickReference).length === 0 && 
                          filterReferenceItems(characterClasses).length === 0 && (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                              No results found for "{searchTerm}"
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegexTester;