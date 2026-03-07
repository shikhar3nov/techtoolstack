import React, { useState, useEffect, useCallback } from 'react';
import { Copy, Check, AlertCircle, Info, Eye, EyeOff, Download, Upload, Trash2, Shield, Key } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const JWTDecoder = () => {
  const [token, setToken] = useState('');
  const [decodedHeader, setDecodedHeader] = useState(null);
  const [decodedPayload, setDecodedPayload] = useState(null);
  const [signature, setSignature] = useState('');
  const [error, setError] = useState('');
  const [copiedStates, setCopiedStates] = useState({});
  const [showSignature, setShowSignature] = useState(false);
  const [activeTab, setActiveTab] = useState('header');

  // Sample JWT for demo
  const sampleJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE3MzY3MjkwMjIsInJvbGUiOiJ1c2VyIiwiZW1haWwiOiJqb2huLmRvZUBleGFtcGxlLmNvbSJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  const decodeJWT = useCallback((jwtToken) => {
    try {
      if (!jwtToken || !jwtToken.trim()) {
        setDecodedHeader(null);
        setDecodedPayload(null);
        setSignature('');
        setError('');
        return;
      }

      const parts = jwtToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format. JWT must have 3 parts separated by dots.');
      }

      // Decode header
      const headerDecoded = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
      setDecodedHeader(headerDecoded);

      // Decode payload
      const payloadDecoded = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      setDecodedPayload(payloadDecoded);

      // Set signature
      setSignature(parts[2]);
      setError('');
    } catch (err) {
      setError(err.message || 'Invalid JWT token');
      setDecodedHeader(null);
      setDecodedPayload(null);
      setSignature('');
    }
  }, []);

  useEffect(() => {
    decodeJWT(token);
  }, [token, decodeJWT]);

  const copyToClipboard = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatJSON = (obj) => {
    return JSON.stringify(obj, null, 2);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const isTokenExpired = (payload) => {
    if (!payload || !payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  };

  const getTimeUntilExpiration = (payload) => {
    if (!payload || !payload.exp) return null;
    const now = Date.now();
    const expTime = payload.exp * 1000;
    const diff = expTime - now;
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const loadSampleToken = () => {
    setToken(sampleJWT);
  };

  const clearToken = () => {
    setToken('');
  };

  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-100 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200">
            {/* Header */}
            <div className="text-center mb-4 mt-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center mb-1">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">JWT Decoder</h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm mb-3">Decode and analyze JSON Web Tokens (JWT) with ease. Paste your token below to view its header, payload, and signature</p>
            </div>

            {/* Input Section */}
            <div className="p-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
                <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <label className="text-sm font-medium mb-2 sm:mb-0">JWT Token</label>
                    <div className="flex flex-wrap gap-2">
                        <button
                        onClick={loadSampleToken}
                        className="px-3 py-1 text-xs rounded-md transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                        >
                        <Upload className="w-3 h-3 mr-1 inline" />
                        Load Sample
                        </button>
                        <button
                        onClick={clearToken}
                        className="px-3 py-1 text-xs rounded-md transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white disabled:opacity-50"
                        disabled={!token}
                        >
                        <Trash2 className="w-3 h-3 mr-1 inline" />
                        Clear
                        </button>
                    </div>
                    </div>
                    
                    <textarea
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste your JWT token here..."
                    className="w-full h-24 sm:h-32 p-3 border-2 rounded-lg resize-none transition-all duration-200 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                    spellCheck={false}
                    />
                    
                    {error && (
                    <div className="mt-3 p-3 rounded-md border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                    )}
                </div>
                </div>

                {/* Results Section */}
                {(decodedHeader || decodedPayload) && (
                <>
                    {/* Token Info */}
                    {decodedPayload && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
                        <div className="p-4 sm:p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            Token Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                            <label className="text-xs font-medium opacity-75">Algorithm</label>
                            <p className="text-sm mt-1">{decodedHeader?.alg || 'N/A'}</p>
                            </div>
                            <div>
                            <label className="text-xs font-medium opacity-75">Type</label>
                            <p className="text-sm mt-1">{decodedHeader?.typ || 'N/A'}</p>
                            </div>
                            <div>
                            <label className="text-xs font-medium opacity-75">Subject</label>
                            <p className="text-sm mt-1">{decodedPayload?.sub || 'N/A'}</p>
                            </div>
                            <div>
                            <label className="text-xs font-medium opacity-75">Issued At</label>
                            <p className="text-sm mt-1">{formatTimestamp(decodedPayload?.iat)}</p>
                            </div>
                            <div>
                            <label className="text-xs font-medium opacity-75">Expires At</label>
                            <p className="text-sm mt-1">{formatTimestamp(decodedPayload?.exp)}</p>
                            </div>
                            <div>
                            <label className="text-xs font-medium opacity-75">Status</label>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                isTokenExpired(decodedPayload) 
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                    : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                }`}>
                                {isTokenExpired(decodedPayload) ? 'Expired' : 'Valid'}
                                </span>
                                {!isTokenExpired(decodedPayload) && (
                                <span className="text-xs opacity-75">
                                    ({getTimeUntilExpiration(decodedPayload)})
                                </span>
                                )}
                            </div>
                            </div>
                        </div>
                        </div>
                    </div>
                    )}

                    {/* Tabs */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="flex space-x-8 px-4 sm:px-6">
                        {[
                            { id: 'header', label: 'Header', icon: Key },
                            { id: 'payload', label: 'Payload', icon: Info },
                            { id: 'signature', label: 'Signature', icon: Shield }
                        ].map((tab) => (
                            <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === tab.id
                                ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                                : 'text-gray-600 dark:text-gray-300 border-transparent hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            >
                            <tab.icon className="w-4 h-4 mr-2 inline" />
                            {tab.label}
                            </button>
                        ))}
                        </nav>
                    </div>

                    <div className="p-4 sm:p-6">
                        {activeTab === 'header' && decodedHeader && (
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                            <h3 className="font-semibold mb-2 sm:mb-0">Header</h3>
                            <div className="flex gap-2">
                                <button
                                onClick={() => copyToClipboard(formatJSON(decodedHeader), 'header')}
                                className="px-3 py-1 text-xs rounded-md transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                                >
                                {copiedStates.header ? <Check className="w-3 h-3 mr-1 inline" /> : <Copy className="w-3 h-3 mr-1 inline" />}
                                {copiedStates.header ? 'Copied!' : 'Copy'}
                                </button>
                                <button
                                onClick={() => downloadJSON(decodedHeader, 'jwt-header.json')}
                                className="px-3 py-1 text-xs rounded-md transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                                >
                                <Download className="w-3 h-3 mr-1 inline" />
                                Download
                                </button>
                            </div>
                            </div>
                            <pre className="p-4 rounded-md text-sm overflow-x-auto bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-green-400">
                            <code>{formatJSON(decodedHeader)}</code>
                            </pre>
                        </div>
                        )}

                        {activeTab === 'payload' && decodedPayload && (
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                            <h3 className="font-semibold mb-2 sm:mb-0">Payload</h3>
                            <div className="flex gap-2">
                                <button
                                onClick={() => copyToClipboard(formatJSON(decodedPayload), 'payload')}
                                className="px-3 py-1 text-xs rounded-md transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                                >
                                {copiedStates.payload ? <Check className="w-3 h-3 mr-1 inline" /> : <Copy className="w-3 h-3 mr-1 inline" />}
                                {copiedStates.payload ? 'Copied!' : 'Copy'}
                                </button>
                                <button
                                onClick={() => downloadJSON(decodedPayload, 'jwt-payload.json')}
                                className="px-3 py-1 text-xs rounded-md transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                                >
                                <Download className="w-3 h-3 mr-1 inline" />
                                Download
                                </button>
                            </div>
                            </div>
                            <pre className="p-4 rounded-md text-sm overflow-x-auto bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-green-400">
                            <code>{formatJSON(decodedPayload)}</code>
                            </pre>
                        </div>
                        )}

                        {activeTab === 'signature' && (
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                            <h3 className="font-semibold mb-2 sm:mb-0">Signature</h3>
                            <div className="flex gap-2">
                                <button
                                onClick={() => setShowSignature(!showSignature)}
                                className="px-3 py-1 text-xs rounded-md transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                                >
                                {showSignature ? <EyeOff className="w-3 h-3 mr-1 inline" /> : <Eye className="w-3 h-3 mr-1 inline" />}
                                {showSignature ? 'Hide' : 'Show'}
                                </button>
                                {showSignature && (
                                <button
                                    onClick={() => copyToClipboard(signature, 'signature')}
                                    className="px-3 py-1 text-xs rounded-md transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                                >
                                    {copiedStates.signature ? <Check className="w-3 h-3 mr-1 inline" /> : <Copy className="w-3 h-3 mr-1 inline" />}
                                    {copiedStates.signature ? 'Copied!' : 'Copy'}
                                </button>
                                )}
                            </div>
                            </div>
                            
                            <div className="p-4 rounded-md border border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200">
                            <div className="flex items-start gap-2">
                                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div>
                                <p className="text-sm font-medium">Security Notice</p>
                                <p className="text-xs mt-1">
                                    The signature is used to verify the token's integrity. Never share your secret key or sensitive signature data.
                                </p>
                                </div>
                            </div>
                            </div>
                            
                            {showSignature && (
                            <pre className="p-4 rounded-md text-sm overflow-x-auto mt-4 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-green-400">
                                <code className="break-all">{signature}</code>
                            </pre>
                            )}
                        </div>
                        )}
                    </div>
                    </div>
                </>
                )}

                {/* Info Section */}
                <div className="mt-8 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"> 
                    <div className="p-4 sm:p-6">
                        <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300 mb-2">About JWT</h3>
                        <div className="text-sm text-purple-700 dark:text-purple-300 space-y-2">
                        <p>JSON Web Token (JWT) is a compact, URL-safe means of representing claims to be transferred between two parties.</p>
                        <p>A JWT consists of three parts separated by dots: Header.Payload.Signature</p>
                        <p>• <strong>Header:</strong> Contains metadata about the token (algorithm, type)</p>
                        <p>• <strong>Payload:</strong> Contains the claims (data about the user/token)</p>
                        <p>• <strong>Signature:</strong> Used to verify the token's integrity</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default JWTDecoder;