import React, { useMemo, useState } from 'react';
import { Copy, Download, RefreshCw, ArrowRightLeft, CheckCircle, AlertCircle } from 'lucide-react';

const JsonEncodeDecode = () => {
  const [mode, setMode] = useState('encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [prettyDecode, setPrettyDecode] = useState(true);
  const [copied, setCopied] = useState(false);

  const stats = useMemo(
    () => ({
      inputChars: input.length,
      outputChars: output.length,
      inputLines: input ? input.split('\n').length : 0,
      outputLines: output ? output.split('\n').length : 0
    }),
    [input, output]
  );

  const encodeJson = () => {
    if (!input.trim()) {
      setError('Please enter value to encode.');
      setOutput('');
      return;
    }

    try {
      // If valid JSON object/array/primitive, encode canonical minified form.
      let source = input;
      try {
        const parsed = JSON.parse(input);
        source = JSON.stringify(parsed);
      } catch {
        // If it is plain text, encode it as JSON string.
      }

      setOutput(JSON.stringify(source));
      setError('');
    } catch (err) {
      setOutput('');
      setError(`Encode failed: ${err.message}`);
    }
  };

  const decodeJson = () => {
    if (!input.trim()) {
      setError('Please enter JSON encoded value to decode.');
      setOutput('');
      return;
    }

    try {
      const parsed = JSON.parse(input);

      if (typeof parsed === 'string') {
        // If decoded string itself is JSON, optionally pretty print it.
        try {
          const nested = JSON.parse(parsed);
          setOutput(prettyDecode ? JSON.stringify(nested, null, 2) : JSON.stringify(nested));
        } catch {
          setOutput(parsed);
        }
      } else {
        setOutput(prettyDecode ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed));
      }

      setError('');
    } catch (err) {
      setOutput('');
      setError(`Decode failed: ${err.message}`);
    }
  };

  const handleConvert = () => {
    if (mode === 'encode') {
      encodeJson();
    } else {
      decodeJson();
    }
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  const swapInputOutput = () => {
    setInput(output);
    setOutput(input);
    setError('');
  };

  const copyOutput = async () => {
    if (!output) {
      return;
    }

    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Copy failed. Please copy manually.');
    }
  };

  const downloadOutput = () => {
    if (!output) {
      return;
    }

    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'encode' ? 'json-encoded.txt' : 'json-decoded.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-100 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200">
          <div className="text-center mb-4 mt-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center mb-1">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                JSON Encode/Decode
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm mb-3">
              Encode plain text/JSON to JSON-safe string and decode JSON strings back to readable content
            </p>
          </div>

          <div className="p-6">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <button
                type="button"
                onClick={() => setMode('encode')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  mode === 'encode' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                Encode
              </button>
              <button
                type="button"
                onClick={() => setMode('decode')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  mode === 'decode' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                Decode
              </button>

              <label className="ml-auto text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={prettyDecode}
                  onChange={(e) => setPrettyDecode(e.target.checked)}
                />
                Pretty output
              </label>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {!error && output && (
              <div className="mb-4 p-3 rounded-lg border border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-800 text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
                <CheckCircle size={16} />
                <span>{mode === 'encode' ? 'Encoded successfully.' : 'Decoded successfully.'}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Input</h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {stats.inputLines} lines • {stats.inputChars} chars
                  </span>
                </div>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    mode === 'encode'
                      ? 'Enter text or JSON to encode...'
                      : 'Enter JSON encoded value (e.g. "{\\"key\\":\\"value\\"}") to decode...'
                  }
                  className="w-full h-72 p-4 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Output</h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {stats.outputLines} lines • {stats.outputChars} chars
                  </span>
                </div>
                <textarea
                  value={output}
                  readOnly
                  placeholder="Output will appear here..."
                  className="w-full h-72 p-4 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 resize-none font-mono"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleConvert}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg transition-all"
              >
                {mode === 'encode' ? 'Encode JSON' : 'Decode JSON'}
              </button>
              <button
                type="button"
                onClick={swapInputOutput}
                className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-medium transition-colors inline-flex items-center gap-2"
              >
                <ArrowRightLeft size={16} />
                Swap
              </button>
              <button
                type="button"
                onClick={copyOutput}
                disabled={!output}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium transition-colors inline-flex items-center gap-2"
              >
                <Copy size={16} />
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={downloadOutput}
                disabled={!output}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium transition-colors inline-flex items-center gap-2"
              >
                <Download size={16} />
                Download
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-medium transition-colors inline-flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Clear
              </button>
            </div>

            <div className="mt-8 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-2">How It Works</h4>
              <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                <li>Encode: Converts your input into JSON-safe encoded string.</li>
                <li>Decode: Parses JSON string and restores readable content.</li>
                <li>Pretty output: Formats decoded JSON for easier reading.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonEncodeDecode;
