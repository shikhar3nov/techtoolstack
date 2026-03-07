import React, { useState, useEffect } from 'react';
import { Copy, FileText, Upload, Download, Eye, EyeOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const Base64Tool = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('encode'); // 'encode' or 'decode'
  const [showPreview, setShowPreview] = useState(false);
  const [isFileMode, setIsFileMode] = useState(false);
  const [fileName, setFileName] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [stats, setStats] = useState({ inputLength: 0, outputLength: 0 });

  // Auto-detect if input is Base64
  const detectBase64 = (text) => {
    if (!text) return false;
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Regex.test(text) && text.length % 4 === 0;
  };

  // Process the conversion
  const processConversion = () => {
    if (!input.trim()) {
      showNotification('Please enter some text to convert', 'error');
      return;
    }

    try {
      if (mode === 'encode') {
        const encoded = btoa(input);
        setOutput(encoded);
        showNotification('Text encoded successfully!', 'success');
      } else {
        const decoded = atob(input);
        setOutput(decoded);
        showNotification('Base64 decoded successfully!', 'success');
      }
    } catch (error) {
      setOutput('');
      showNotification('Invalid input for ' + mode + ' operation', 'error');
    }
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target.result;
      if (mode === 'encode') {
        // For file encoding, we need to handle binary data
        const binaryReader = new FileReader();
        binaryReader.onload = (be) => {
          const base64 = btoa(be.target.result);
          setOutput(base64);
          showNotification('File encoded to Base64!', 'success');
        };
        binaryReader.readAsBinaryString(file);
      } else {
        setInput(content);
      }
    };
    
    reader.readAsText(file);
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showNotification('Copied to clipboard!', 'success');
    });
  };

  // Download result
  const downloadResult = () => {
    if (!output) return;
    
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'encode' ? 'encoded.txt' : 'decoded.txt';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('File downloaded!', 'success');
  };

  // Show notification
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  // Auto-detect mode based on input
  useEffect(() => {
    if (input && detectBase64(input) && mode === 'encode') {
      setMode('decode');
    }
  }, [input]);

  // Update stats
  useEffect(() => {
    setStats({
      inputLength: input.length,
      outputLength: output.length
    });
  }, [input, output]);

  // Clear all
  const clearAll = () => {
    setInput('');
    setOutput('');
    setFileName('');
    showNotification('All fields cleared', 'success');
  };

  return (
    <div className="bg-gray-100 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200">
          <div className="text-center mb-4 mt-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center mb-1">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">Base64 Encode/Decode</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm mb-3">Convert text to Base64 and vice versa with advanced features</p>
          </div>
          <div className="p-6">
            {/* Notification */}
            {notification.show && (
              <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
                notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {notification.message}
              </div>
            )}

            {/* Mode Selection */}
            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setMode('encode')}
                  className={`px-6 py-2 rounded-md font-medium transition-all ${
                    mode === 'encode' 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Encode
                </button>
                <button
                  onClick={() => setMode('decode')}
                  className={`px-6 py-2 rounded-md font-medium transition-all ${
                    mode === 'decode' 
                      ? 'bg-green-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Decode
                </button>
              </div>
            </div>

            {/* Input/Output Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-200">
                    {mode === 'encode' ? 'Text Input' : 'Base64 Input'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsFileMode(!isFileMode)}
                      className={`p-2 rounded-md transition-colors ${
                        isFileMode ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}
                      title="Toggle file mode"
                    >
                      <Upload size={18} />
                    </button>
                    <span className="text-sm text-gray-500">{stats.inputLength} chars</span>
                  </div>
                </div>

                {isFileMode && mode === 'encode' ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload size={32} className="text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300 transition-colors duration-200">Click to upload file</span>
                      {fileName && <span className="text-sm text-blue-600">{fileName}</span>}
                    </label>
                  </div>
                ) : (
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter Base64 to decode...'}
                    className="w-full h-40 p-4 border-2 rounded-lg resize-none transition-all duration-200 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                  />
                )}

                {/* Input Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={processConversion}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium text-white transition-colors ${
                      mode === 'encode' 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {mode === 'encode' ? 'Encode' : 'Decode'}
                  </button>
                  <button
                    onClick={clearAll}
                    className="p-2 rounded-md transition-colors bg-gray-100 text-gray-600"
                    title="Clear all"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
              </div>

              {/* Output Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-200">
                    {mode === 'encode' ? 'Base64 Output' : 'Decoded Output'}
                  </h3>
                  <div className="flex items-center gap-2">
                    {/* {mode === 'decode' && ( */}
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="p-2 rounded-md transition-colors bg-gray-100 text-gray-600"
                        title="Toggle preview"
                      >
                        {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    {/* )} */}
                    <span className="text-sm text-gray-500">{stats.outputLength} chars</span>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={output}
                    readOnly
                    placeholder="Output will appear here..."
                    className="w-full h-40 p-4 border-2 rounded-lg resize-none transition-all duration-200 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                  />
                  {output && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => copyToClipboard(output)}
                        className="p-1 bg-white hover:bg-gray-100 rounded shadow-sm transition-colors"
                        title="Copy to clipboard"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={downloadResult}
                        className="p-1 bg-white hover:bg-gray-100 rounded shadow-sm transition-colors"
                        title="Download result"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Preview for decoded content */}
                {showPreview && mode === 'decode' && output && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Preview:</h4>
                    <div className="text-sm text-blue-700 whitespace-pre-wrap break-all">
                      {output.slice(0, 200)}
                      {output.length > 200 && '...'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Features Info */}
            <div className="mt-8 p-6 bg-gray-50 rounded-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 dark:text-gray-300 ">Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <FileText className="text-blue-600 mt-1" size={20} />
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-300 ">File Support</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 ">Upload files to encode to Base64</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Copy className="text-green-600 mt-1" size={20} />
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-300 ">One-Click Copy</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 ">Copy results to clipboard instantly</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Download className="text-purple-600 mt-1" size={20} />
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-300 ">Download Results</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 ">Save output as text file</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="mt-8 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300 mb-2">About Base64</h3>
              <p className="text-sm text-purple-700 dark:text-purple-300 space-y-2">
                Base64 is a binary-to-text encoding scheme that represents binary data in an ASCII string format. 
                It's commonly used for encoding data in email, storing complex data in XML or JSON, and embedding 
                images in HTML/CSS. The encoding uses 64 printable ASCII characters to represent binary data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Base64Tool;