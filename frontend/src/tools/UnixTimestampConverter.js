import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Calendar, RefreshCw, Copy, Check, ArrowLeftRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const UnixTimestampConverter = () => {
  const [timestamp, setTimestamp] = useState('');
  const [humanDate, setHumanDate] = useState('');
  const [currentTimestamp, setCurrentTimestamp] = useState(Date.now());
  const [copiedItem, setCopiedItem] = useState('');
  const [inputType, setInputType] = useState('timestamp'); // 'timestamp' or 'human'
  const [timezone, setTimezone] = useState('UTC');
  const [error, setError] = useState('');

  // Update current timestamp every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get user's timezone
  useEffect(() => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(userTimezone);
  }, []);

  const formatDate = useCallback((timestamp, tz = 'UTC') => {
    try {
      const date = new Date(parseInt(timestamp) * 1000);
      return date.toLocaleString('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (e) {
      return 'Invalid timestamp';
    }
  }, []);

  const parseHumanDate = useCallback((dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return Math.floor(date.getTime() / 1000);
    } catch (e) {
      return null;
    }
  }, []);

  const handleTimestampChange = (value) => {
    setTimestamp(value);
    setError('');
    
    if (value.trim() === '') {
      setHumanDate('');
      return;
    }

    // Validate timestamp (should be numeric)
    if (!/^\d+$/.test(value.trim())) {
      setError('Please enter a valid Unix timestamp (numbers only)');
      setHumanDate('');
      return;
    }

    const ts = parseInt(value.trim());
    
    // Check if timestamp is reasonable (between 1970 and 2100)
    if (ts < 0 || ts > 4102444800) {
      setError('Timestamp out of reasonable range (1970-2100)');
      setHumanDate('');
      return;
    }

    const formatted = formatDate(ts, timezone);
    setHumanDate(formatted);
  };

  const handleHumanDateChange = (value) => {
    setHumanDate(value);
    setError('');
    
    if (value.trim() === '') {
      setTimestamp('');
      return;
    }

    const ts = parseHumanDate(value);
    if (ts === null) {
      setError('Please enter a valid date format (YYYY-MM-DD HH:MM:SS or ISO format)');
      setTimestamp('');
      return;
    }

    setTimestamp(ts.toString());
  };

  const handleInputTypeToggle = () => {
    setInputType(prev => prev === 'timestamp' ? 'human' : 'timestamp');
    setTimestamp('');
    setHumanDate('');
    setError('');
  };

  const handleCurrentTime = () => {
    const now = Math.floor(Date.now() / 1000);
    setTimestamp(now.toString());
    setHumanDate(formatDate(now, timezone));
    setInputType('timestamp');
    setError('');
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(type);
      setTimeout(() => setCopiedItem(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney',
    Intl.DateTimeFormat().resolvedOptions().timeZone
  ];

  const uniqueTimezones = [...new Set(timezones)];

  return (
    <div className="bg-gray-100 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200">
                {/* Header */}
                <div className="text-center mb-4 mt-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-center mb-1">
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">Unix Timestamp Converter</h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm mb-3">Convert between Unix timestamps and human-readable dates with timezone support</p>
                </div>
                {/* Current Time Display */}
                <div className="p-6">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 mb-8 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                            <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Current Time
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                            Real-time timestamp and date
                            </p>
                        </div>
                        </div>
                        <div className="text-right">
                        <div className="text-2xl font-mono font-bold text-purple-600 dark:text-purple-400">
                            {Math.floor(currentTimestamp / 1000)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                            {formatDate(Math.floor(currentTimestamp / 1000), timezone)}
                        </div>
                        </div>
                    </div>
                    </div>

                    {/* Main Converter */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 mb-6">
                    {/* Input Type Toggle */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Converter
                        </h2>
                        <button
                        onClick={handleInputTypeToggle}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors duration-200"
                        >
                        <ArrowLeftRight className="w-4 h-4" />
                        Switch Input
                        </button>
                    </div>

                    {/* Timezone Selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Timezone
                        </label>
                        <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                        >
                        {uniqueTimezones.map(tz => (
                            <option key={tz} value={tz}>{tz}</option>
                        ))}
                        </select>
                    </div>

                    {/* Input Section */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Timestamp Input */}
                        <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Unix Timestamp
                            </label>
                            <div className="relative">
                            <input
                                type="text"
                                value={timestamp}
                                onChange={(e) => handleTimestampChange(e.target.value)}
                                placeholder="Enter Unix timestamp..."
                                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent font-mono"
                                disabled={inputType === 'human'}
                            />
                            {timestamp && (
                                <button
                                onClick={() => copyToClipboard(timestamp, 'timestamp')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                title="Copy timestamp"
                                >
                                {copiedItem === 'timestamp' ? 
                                    <Check className="w-4 h-4 text-green-500" /> : 
                                    <Copy className="w-4 h-4" />
                                }
                                </button>
                            )}
                            </div>
                        </div>

                        <button
                            onClick={handleCurrentTime}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors duration-200"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Use Current Time
                        </button>
                        </div>

                        {/* Human Date Input */}
                        <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Human-Readable Date
                            </label>
                            <div className="relative">
                            <input
                                type="text"
                                value={humanDate}
                                onChange={(e) => handleHumanDateChange(e.target.value)}
                                placeholder="Enter date (YYYY-MM-DD HH:MM:SS)..."
                                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                                disabled={inputType === 'timestamp'}
                            />
                            {humanDate && (
                                <button
                                onClick={() => copyToClipboard(humanDate, 'human')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                title="Copy date"
                                >
                                {copiedItem === 'human' ? 
                                    <Check className="w-4 h-4 text-green-500" /> : 
                                    <Copy className="w-4 h-4" />
                                }
                                </button>
                            )}
                            </div>
                        </div>

                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            <p>Supported formats:</p>
                            <ul className="mt-1 space-y-1">
                            <li>• YYYY-MM-DD HH:MM:SS</li>
                            <li>• ISO 8601 format</li>
                            <li>• MM/DD/YYYY format</li>
                            </ul>
                        </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}
                    </div>

                    {/* Additional Information */}
                    {timestamp && humanDate && !error && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Additional Information
                        </h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-300">Milliseconds</div>
                            <div className="font-mono text-gray-900 dark:text-white">
                            {parseInt(timestamp) * 1000}
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-300">ISO Format</div>
                            <div className="font-mono text-gray-900 dark:text-white text-sm">
                            {new Date(parseInt(timestamp) * 1000).toISOString()}
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-300">UTC</div>
                            <div className="font-mono text-gray-900 dark:text-white text-sm">
                            {formatDate(timestamp, 'UTC')}
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-300">Relative</div>
                            <div className="font-mono text-gray-900 dark:text-white text-sm">
                            {(() => {
                                const now = Math.floor(Date.now() / 1000);
                                const diff = now - parseInt(timestamp);
                                const abs = Math.abs(diff);
                                
                                if (abs < 60) return `${abs}s ago`;
                                if (abs < 3600) return `${Math.floor(abs / 60)}m ago`;
                                if (abs < 86400) return `${Math.floor(abs / 3600)}h ago`;
                                return `${Math.floor(abs / 86400)}d ago`;
                            })()}
                            </div>
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

export default UnixTimestampConverter;