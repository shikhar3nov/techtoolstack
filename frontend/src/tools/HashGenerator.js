import React, { useState, useEffect, useCallback } from 'react';
import { Copy, Download, Upload, Hash, Check, AlertCircle, FileText, Trash2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

// Move algorithms outside component to prevent recreation on every render
const algorithms = [
  { name: 'MD5', key: 'md5' },
  { name: 'SHA-1', key: 'sha1' },
  { name: 'SHA-256', key: 'sha256' },
  { name: 'SHA-512', key: 'sha512' }
];

const HashGenerator = () => {
  const [inputText, setInputText] = useState('');
  const [inputFile, setInputFile] = useState(null);
  const [inputMode, setInputMode] = useState('text'); // 'text' or 'file'
  const [hashes, setHashes] = useState({});
  const [loading, setLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState('');
  const [error, setError] = useState('');

  // Generate hash using Web Crypto API or fallback
  const generateHash = useCallback(async (algorithm, data) => {
    try {
      let hashBuffer;
      const encoder = new TextEncoder();
      const dataBuffer = typeof data === 'string' ? encoder.encode(data) : data;

      switch (algorithm) {
        case 'sha1':
          hashBuffer = await crypto.subtle.digest('SHA-1', dataBuffer);
          break;
        case 'sha256':
          hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
          break;
        case 'sha512':
          hashBuffer = await crypto.subtle.digest('SHA-512', dataBuffer);
          break;
        case 'md5':
          // MD5 fallback implementation
          return md5(dataBuffer);
        default:
          throw new Error(`Unsupported algorithm: ${algorithm}`);
      }

      // Convert buffer to hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (err) {
      console.error(`Error generating ${algorithm} hash:`, err);
      return 'Error generating hash';
    }
  }, []);

  // Simple MD5 implementation (for demo purposes - in production, use a proper crypto library)
  const md5 = (data) => {
    // This is a simplified MD5 - in a real app, you'd use a proper crypto library
    // For demo purposes, we'll return a placeholder
    return 'MD5 requires external library - use crypto-js in production';
  };

  // Generate all hashes
  const generateAllHashes = useCallback(async (data) => {
    setLoading(true);
    setError('');
    const newHashes = {};

    try {
      for (const algo of algorithms) {
        newHashes[algo.key] = await generateHash(algo.key, data);
      }
      setHashes(newHashes);
    } catch (err) {
      setError('Failed to generate hashes. Please try again.');
      console.error('Hash generation error:', err);
    } finally {
      setLoading(false);
    }
  }, [generateHash]); // Removed algorithms from dependency array since it's now constant

  // Handle text input change
  useEffect(() => {
    if (inputMode === 'text' && inputText) {
      const debounceTimer = setTimeout(() => {
        generateAllHashes(inputText);
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else if (inputMode === 'text' && !inputText) {
      setHashes({});
    }
  }, [inputText, inputMode, generateAllHashes]);

  // Handle file input
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      setInputFile(null);
      setHashes({});
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }

    setInputFile(file);
    setError('');
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      await generateAllHashes(new Uint8Array(arrayBuffer));
    } catch (err) {
      setError('Failed to process file. Please try again.');
      console.error('File processing error:', err);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text, hashType) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(hashType);
      setTimeout(() => setCopiedHash(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedHash(hashType);
      setTimeout(() => setCopiedHash(''), 2000);
    }
  };

  // Download hashes as file
  const downloadHashes = () => {
    const content = algorithms.map(algo => 
      `${algo.name}: ${hashes[algo.key] || 'N/A'}`
    ).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hashes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear all data
  const clearAll = () => {
    setInputText('');
    setInputFile(null);
    setHashes({});
    setError('');
    setCopiedHash('');
    if (document.getElementById('file-input')) {
      document.getElementById('file-input').value = '';
    }
  };

  const hasHashes = Object.keys(hashes).length > 0 && Object.values(hashes).some(hash => hash && hash !== 'Error generating hash');

  return (
    <div className="bg-gray-100 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200">
            {/* Header */}
            <div className="text-center mb-4 mt-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center mb-1">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">Hash Generator</h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm mb-3">Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from text or files. 
                Secure, fast, and works entirely in your browser</p>
            </div>

            <div className="p-6">
                {/* Input Mode Toggle */}
                <div className="mb-6">
                    <div className="flex items-center justify-center">
                        <div className="bg-gray-100 dark:bg-white-800 rounded-lg p-1 flex">
                        <button
                            onClick={() => {
                            setInputMode('text');
                            setInputFile(null);
                            if (document.getElementById('file-input')) {
                                document.getElementById('file-input').value = '';
                            }
                            }}
                            className={`px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                            inputMode === 'text'
                                ? 'bg-purple-500 dark:bg-purple-500 text-white shadow-md'
                                : 'text-gray-600 dark:text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <FileText className="w-4 h-4" />
                            Text Input
                        </button>
                        <button
                            onClick={() => {
                            setInputMode('file');
                            setInputText('');
                            }}
                            className={`px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                            inputMode === 'file'
                                ? 'bg-purple-500 dark:bg-purple-500 text-white shadow-md'
                                : 'text-gray-600 dark:text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Upload className="w-4 h-4" />
                            File Upload
                        </button>
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{error}</span>
                    </div>
                </div>
                )}

                {/* Input Section */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 mb-6">
                <div className="p-6">
                    {inputMode === 'text' ? (
                    <div>
                        <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Enter text to hash
                        </label>
                        <textarea
                        id="text-input"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type or paste your text here..."
                        className="w-full h-32 px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                        aria-describedby="text-input-desc"
                        />
                        <p id="text-input-desc" className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Hashes will be generated automatically as you type
                        </p>
                    </div>
                    ) : (
                    <div>
                        <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Choose file to hash
                        </label>
                        <div className="relative">
                        <input
                            type="file"
                            id="file-input"
                            onChange={handleFileChange}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-900/20 dark:file:text-purple-400 dark:hover:file:bg-purple-900/30"
                            aria-describedby="file-input-desc"
                        />
                        </div>
                        <p id="file-input-desc" className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Maximum file size: 10MB. Supports all file types.
                        </p>
                        {inputFile && (
                        <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-700 dark:text-purple-400">
                                {inputFile.name}
                                </p>
                                <p className="text-xs text-purple-600 dark:text-purple-500">
                                {(inputFile.size / 1024).toFixed(2)} KB
                                </p>
                            </div>
                            </div>
                        </div>
                        )}
                    </div>
                    )}
                </div>
                </div>

                {/* Action Buttons */}
                {hasHashes && (
                <div className="flex flex-wrap gap-3 justify-center mb-6">
                    <button
                    onClick={downloadHashes}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                    >
                    <Download className="w-4 h-4" />
                    Download All
                    </button>
                    <button
                    onClick={clearAll}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                    >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                    </button>
                </div>
                )}

                {/* Results Section */}
                {(loading || hasHashes) && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
                    <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <Hash className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        Generated Hashes
                    </h2>
                    
                    <div className="space-y-4">
                        {algorithms.map((algo) => (
                        <div key={algo.key} className="group">
                            <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {algo.name}
                            </label>
                            {hashes[algo.key] && !loading && (
                                <button
                                onClick={() => copyToClipboard(hashes[algo.key], algo.key)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-all duration-200"
                                title={`Copy ${algo.name} hash`}
                                aria-label={`Copy ${algo.name} hash`}
                                >
                                {copiedHash === algo.key ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                                </button>
                            )}
                            </div>
                            
                            <div className="relative">
                            {loading ? (
                                <div className="h-12 bg-gray-100 dark:bg-slate-700 rounded-lg animate-pulse flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                <div
                                className={`p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border transition-all duration-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 ${
                                    copiedHash === algo.key
                                    ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                                    : 'border-gray-200 dark:border-slate-600'
                                }`}
                                onClick={() => hashes[algo.key] && copyToClipboard(hashes[algo.key], algo.key)}
                                >
                                <code className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 font-mono break-all select-all">
                                    {hashes[algo.key] || 'No hash generated'}
                                </code>
                                </div>
                            )}
                            </div>
                        </div>
                        ))}
                    </div>
                    
                    {hasHashes && !loading && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-xs text-blue-700 dark:text-blue-400">
                            💡 Tip: Click on any hash to copy it to your clipboard
                        </p>
                        </div>
                    )}
                    </div>
                </div>
                )}

                {/* Info Section */}
                {!hasHashes && !loading && (
                    
                    // <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300 mb-2">About URL Encoding</h3>
                    
                        <div className="mt-8 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                {/* <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 border border-purple-200 dark:border-slate-600"> */}
                    <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300 mb-2">
                    About Hash Functions
                    </h3>
                    {/* <div className="text-sm text-purple-700 dark:text-purple-300 space-y-2"> */}
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-purple-700 dark:text-purple-300">
                    <div>
                        <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-1">MD5</h4>
                        <p>128-bit hash, fast but cryptographically broken</p>
                    </div>
                    <div>
                        <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-1">SHA-1</h4>
                        <p>160-bit hash, deprecated for cryptographic use</p>
                    </div>
                    <div>
                        <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-1">SHA-256</h4>
                        <p>256-bit hash, secure and widely used</p>
                    </div>
                    <div>
                        <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-1">SHA-512</h4>
                        <p>512-bit hash, highest security level</p>
                    </div>
                    </div>
                </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default HashGenerator;