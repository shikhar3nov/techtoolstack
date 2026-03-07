import React, { useState, useCallback, useEffect } from 'react';
import { Copy, RotateCcw, RefreshCw, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const URLEncoderDecoder = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('encode'); // 'encode' or 'decode'
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [history, setHistory] = useState([]);

  // Auto-process input when it changes
  useEffect(() => {
    if (input.trim() === '') {
      setOutput('');
      setError('');
      return;
    }

    try {
      if (mode === 'encode') {
        const encoded = encodeURIComponent(input);
        setOutput(encoded);
        setError('');
      } else {
        const decoded = decodeURIComponent(input);
        setOutput(decoded);
        setError('');
      }
    } catch (err) {
      setError('Invalid input for decoding');
      setOutput('');
    }
  }, [input, mode]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = output;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setShowPreview(false);
  }, []);

  const handleSwapMode = useCallback(() => {
    const newMode = mode === 'encode' ? 'decode' : 'encode';
    setMode(newMode);
    
    // Add to history
    if (input && output) {
      const historyItem = {
        input: input,
        output: output,
        mode: mode,
        timestamp: new Date().toLocaleTimeString()
      };
      setHistory(prev => [historyItem, ...prev.slice(0, 4)]); // Keep last 5 items
    }
    
    // Swap input and output
    setInput(output);
  }, [mode, input, output]);

  const handleHistoryClick = useCallback((item) => {
    setInput(item.input);
    setMode(item.mode);
  }, []);

  const getPreviewData = useCallback(() => {
    if (!output || mode === 'encode') return null;
    
    try {
      const url = new URL(output);
      return {
        protocol: url.protocol,
        hostname: url.hostname,
        pathname: url.pathname,
        search: url.search,
        hash: url.hash
      };
    } catch {
      return null;
    }
  }, [output, mode]);

  const previewData = getPreviewData();

  return (
    <div className="bg-gray-100 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200">
                {/* Header */}
                <div className="text-center mb-4 mt-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-center mb-1">
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">URL Encoder/Decoder</h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm mb-3">Encode URLs for safe transmission or decode encoded URLs back to their original form. 
                    Perfect for handling special characters in URLs</p>
                </div>
                <div className="p-6">
                    {/* Mode Toggle */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-gray-100 p-1 rounded-lg">
                            <button
                            onClick={() => setMode('encode')}
                            className={`px-6 py-2 rounded-md font-medium transition-all ${
                                mode === 'encode' 
                                ? 'bg-purple-500 text-white shadow-md' 
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                            >
                            Encode
                            </button>
                            <button
                            onClick={() => setMode('decode')}
                            className={`px-6 py-2 rounded-md font-medium transition-all ${
                                mode === 'decode' 
                                ? 'bg-purple-500 text-white shadow-md' 
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                            >
                            Decode
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Input Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Input ({mode === 'encode' ? 'Plain URL' : 'Encoded URL'})
                        </h2>
                        <div className="flex gap-2">
                            <button
                            onClick={handleSwapMode}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors duration-200"
                            title="Swap mode and exchange input/output"
                            >
                            <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            </button>
                            <button
                            onClick={handleClear}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors duration-200"
                            title="Clear all"
                            >
                            <RotateCcw className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            </button>
                        </div>
                        </div>
                        
                        <div className="relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={mode === 'encode' 
                            ? 'Enter URL to encode (e.g., https://example.com/search?q=hello world)'
                            : 'Enter encoded URL to decode (e.g., https%3A//example.com/search%3Fq%3Dhello%20world)'
                            }
                            className="w-full h-32 p-4 border-2 rounded-lg resize-none transition-all duration-200 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                            rows={4}
                        />
                        {input && (
                            <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400">
                            {input.length} chars
                            </div>
                        )}
                        </div>
                    </div>

                    {/* Output Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Output ({mode === 'encode' ? 'Encoded URL' : 'Plain URL'})
                        </h2>
                        <div className="flex gap-2">
                            {mode === 'decode' && output && (
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors duration-200"
                                title="Toggle URL preview"
                            >
                                {showPreview ? (
                                <EyeOff className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                ) : (
                                <Eye className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                )}
                            </button>
                            )}
                            <button
                            onClick={handleCopy}
                            disabled={!output}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            title="Copy to clipboard"
                            >
                            {copied ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                                <Copy className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            )}
                            </button>
                        </div>
                        </div>

                        <div className="relative">
                        <textarea
                            value={output}
                            readOnly
                            className="w-full h-32 p-4 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50  dark:bg-slate-700 text-gray-900 dark:text-white resize-none focus:outline-none"
                            rows={4}
                        />
                        {output && (
                            <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400">
                            {output.length} chars
                            </div>
                        )}
                        </div>

                        {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                        </div>
                        )}

                        {copied && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-600 dark:text-green-400">Copied to clipboard!</span>
                        </div>
                        )}
                    </div>
                    </div>

                    {/* URL Preview */}
                    {showPreview && previewData && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">URL Components</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="font-medium text-gray-600 dark:text-gray-300">Protocol:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{previewData.protocol}</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-600 dark:text-gray-300">Hostname:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{previewData.hostname}</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-600 dark:text-gray-300">Path:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{previewData.pathname || '/'}</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-600 dark:text-gray-300">Query:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{previewData.search || 'None'}</span>
                        </div>
                        {previewData.hash && (
                            <div className="sm:col-span-2">
                            <span className="font-medium text-gray-600 dark:text-gray-300">Fragment:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{previewData.hash}</span>
                            </div>
                        )}
                        </div>
                    </div>
                    )}

                    {/* History */}
                    {history.length > 0 && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Recent History</h3>
                        <div className="space-y-2">
                        {history.map((item, index) => (
                            <div
                            key={index}
                            onClick={() => handleHistoryClick(item)}
                            className="p-3 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors duration-200"
                            >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">
                                {item.mode}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                {item.timestamp}
                                </span>
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                {item.input}
                            </div>
                            </div>
                        ))}
                        </div>
                    </div>
                    )}

                    {/* Info Section */}
                    <div className="mt-8 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300 mb-2">About URL Encoding</h3>
                    <div className="text-sm text-purple-700 dark:text-purple-300 space-y-2">
                        <p>
                        <strong>URL Encoding:</strong> Converts special characters in URLs to percent-encoded format (%XX) 
                        to ensure safe transmission over the internet.
                        </p>
                        <p>
                        <strong>Common encoded characters:</strong> Space → %20, & → %26, = → %3D, ? → %3F, # → %23
                        </p>
                        <p>
                        <strong>Use cases:</strong> Query parameters, form data, API endpoints, and any URL containing special characters.
                        </p>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default URLEncoderDecoder;