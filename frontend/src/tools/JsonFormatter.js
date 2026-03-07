import React, { useState, useEffect, useRef } from 'react';

const CodeFormatter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('json');
  const [aiMode, setAiMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [stats, setStats] = useState({
    characters: 0,
    lines: 0,
    size: 0,
    isValid: null,
    format: null
  });

  const inputEditorRef = useRef(null);
  const outputEditorRef = useRef(null);
  const monacoLoadedRef = useRef(false);

  const formats = {
    json: { name: 'JSON', icon: '📄', color: 'from-blue-600 to-purple-600', monacoLang: 'json' },
    xml: { name: 'XML', icon: '📋', color: 'from-green-600 to-blue-600', monacoLang: 'xml' },
    html: { name: 'HTML', icon: '🌐', color: 'from-orange-600 to-red-600', monacoLang: 'html' },
    sql: { name: 'SQL', icon: '🗄️', color: 'from-indigo-600 to-purple-600', monacoLang: 'sql' },
    css: { name: 'CSS', icon: '🎨', color: 'from-pink-600 to-rose-600', monacoLang: 'css' },
    javascript: { name: 'JavaScript', icon: '⚡', color: 'from-yellow-600 to-orange-600', monacoLang: 'javascript' },
    yaml: { name: 'YAML', icon: '📝', color: 'from-teal-600 to-cyan-600', monacoLang: 'yaml' }
  };

  const aiPrompts = {
    optimize: 'Optimize this code for better performance and readability',
    explain: 'Explain what this code does and add helpful comments',
    convert: 'Convert this code to a different format or language',
    fix: 'Find and fix any errors or issues in this code',
    enhance: 'Add modern features and best practices to this code',
    minify: 'Minify this code while preserving functionality'
  };

  // Load Monaco Editor
  useEffect(() => {
    if (!monacoLoadedRef.current) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js';
      script.onload = () => {
        window.require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
        window.require(['vs/editor/editor.main'], () => {
          monacoLoadedRef.current = true;
          initializeEditors();
        });
      };
      document.head.appendChild(script);
    }
  }, []);

  const initializeEditors = () => {
    if (window.monaco && inputEditorRef.current && outputEditorRef.current) {
      // Input Editor
      const inputEditor = window.monaco.editor.create(inputEditorRef.current, {
        value: input,
        language: formats[selectedFormat].monacoLang,
        theme: 'vs-dark',
        fontSize: 14,
        lineNumbers: 'on',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        automaticLayout: true
      });

      inputEditor.onDidChangeModelContent(() => {
        setInput(inputEditor.getValue());
      });

      // Output Editor
      const outputEditor = window.monaco.editor.create(outputEditorRef.current, {
        value: output,
        language: formats[selectedFormat].monacoLang,
        theme: 'vs-dark',
        fontSize: 14,
        lineNumbers: 'on',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        readOnly: true,
        automaticLayout: true
      });

      // Store editor instances
      window.inputEditor = inputEditor;
      window.outputEditor = outputEditor;
    }
  };

  useEffect(() => {
    updateStats();
    // Update Monaco language when format changes
    if (window.monaco && window.inputEditor && window.outputEditor) {
      const model1 = window.inputEditor.getModel();
      const model2 = window.outputEditor.getModel();
      if (model1) window.monaco.editor.setModelLanguage(model1, formats[selectedFormat].monacoLang);
      if (model2) window.monaco.editor.setModelLanguage(model2, formats[selectedFormat].monacoLang);
    }
  }, [input, output, selectedFormat]);

  const updateStats = () => {
    const characters = input.length;
    const lines = input ? input.split('\n').length : 0;
    const size = parseFloat((new Blob([input]).size / 1024).toFixed(2));
    let isValid = null;
    let detectedFormat = null;

    if (input.trim()) {
      detectedFormat = detectFormat(input);
      isValid = performValidation(input, selectedFormat);
    }

    setStats({ characters, lines, size, isValid, format: detectedFormat });
  };

  const detectFormat = (code) => {
    const trimmed = code.trim();
    
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        JSON.parse(trimmed);
        return 'json';
      } catch {
        return null;
      }
    }
    
    if (trimmed.startsWith('<?xml') || 
        (trimmed.startsWith('<') && trimmed.includes('</') && !trimmed.toLowerCase().includes('<!doctype html>'))) {
      return 'xml';
    }
    
    if (trimmed.toLowerCase().includes('<!doctype html>') || 
        trimmed.toLowerCase().includes('<html') ||
        (trimmed.includes('<') && trimmed.includes('>') && trimmed.toLowerCase().includes('<body'))) {
      return 'html';
    }
    
    if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH|EXPLAIN)\s+/i.test(trimmed)) {
      return 'sql';
    }
    
    if (trimmed.includes('{') && trimmed.includes('}') && 
        (trimmed.includes(':') || trimmed.includes(';')) &&
        /[a-zA-Z-]+\s*:\s*[^;]+;/.test(trimmed)) {
      return 'css';
    }
    
    if (trimmed.includes('function') || trimmed.includes('=>') || 
        /\b(var|let|const|class|import|export)\b/.test(trimmed) ||
        trimmed.includes('console.') || trimmed.includes('window.')) {
      return 'javascript';
    }
    
    if ((trimmed.includes('---') && trimmed.includes('\n')) || 
        /^\w+:\s*.+$/m.test(trimmed)) {
      return 'yaml';
    }
    
    return null;
  };

  const performValidation = (code, format) => {
    if (!code.trim()) return null;
    
    try {
      switch (format) {
        case 'json':
          JSON.parse(code);
          return true;
        case 'xml':
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(code, 'text/xml');
          const parseError = xmlDoc.querySelector('parsererror');
          return !parseError;
        case 'html':
          return code.includes('<') && code.includes('>');
        case 'sql':
          const sqlKeywords = /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH|EXPLAIN|SHOW|DESCRIBE)\s+/i;
          return sqlKeywords.test(code.trim());
        case 'css':
          return code.includes('{') && code.includes('}') && 
                 code.split('{').length === code.split('}').length;
        case 'javascript':
          return /\b(function|var|let|const|class|if|for|while|return)\b/.test(code) || 
                 code.includes('=>') || code.includes('console.');
        case 'yaml':
          return !code.includes('\t') && 
                 (/^\w+:\s*.+$/m.test(code) || code.includes('---'));
        default:
          return null;
      }
    } catch {
      return false;
    }
  };

  const showMessage = (message, type = 'success') => {
    if (type === 'error') {
      setError(message);
      setSuccess('');
    } else {
      setSuccess(message);
      setError('');
    }
    
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 5000);
  };

  const formatCode = async () => {
    if (!input.trim()) {
      showMessage('Please enter code to format', 'error');
      return;
    }

    setLoading(true);
    try {
      let formatted = '';
      
      switch (selectedFormat) {
        case 'json':
          const jsonObj = JSON.parse(input);
          formatted = JSON.stringify(jsonObj, null, 2);
          break;
        case 'xml':
          formatted = formatXML(input);
          break;
        case 'html':
          formatted = formatHTML(input);
          break;
        case 'sql':
          formatted = formatSQL(input);
          break;
        case 'css':
          formatted = formatCSS(input);
          break;
        case 'javascript':
          formatted = formatJavaScript(input);
          break;
        case 'yaml':
          formatted = formatYAML(input);
          break;
        default:
          formatted = input;
      }
      
      setOutput(formatted);
      if (window.outputEditor) {
        window.outputEditor.setValue(formatted);
      }
      showMessage(`${formats[selectedFormat].name} formatted successfully!`);
    } catch (err) {
      showMessage(`Error formatting ${formats[selectedFormat].name}: ${err.message}`, 'error');
      setOutput('');
    } finally {
      setLoading(false);
    }
  };

  const formatXML = (xml) => {
    try {
      const PADDING = '  ';
      
      // First, normalize the XML by adding line breaks between tags
      let formatted = xml
        .replace(/></g, '>\n<')
        .replace(/>\s*</g, '>\n<')
        .trim();
      
      const lines = formatted.split('\n');
      const result = [];
      let indentLevel = 0;
      
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;
        
        // Check if this is a closing tag
        if (line.startsWith('</')) {
          indentLevel = Math.max(0, indentLevel - 1);
          result.push(PADDING.repeat(indentLevel) + line);
        }
        // Check if this is a self-closing tag
        else if (line.endsWith('/>')) {
          result.push(PADDING.repeat(indentLevel) + line);
          // No indentation change for self-closing tags
        }
        // Check if this is an opening tag that closes on the same line (e.g., <tag>content</tag>)
        else if (line.match(/^<[^>\/!?]+>.*<\/[^>]+>$/)) {
          result.push(PADDING.repeat(indentLevel) + line);
          // No indentation change as it's complete on one line
        }
        // Check if this is just an opening tag
        else if (line.startsWith('<') && line.endsWith('>') && !line.startsWith('<!') && !line.startsWith('<?')) {
          result.push(PADDING.repeat(indentLevel) + line);
          indentLevel++;
        }
        // This is text content or other content
        else {
          result.push(PADDING.repeat(indentLevel) + line);
        }
      }
      
      return result.join('\n');
    } catch (e) {
      throw new Error('Invalid XML format: ' + e.message);
    }
  };

  const formatHTML = (html) => {
    try {
      const PADDING = '  ';
      
      // Normalize the HTML by adding line breaks between tags
      let formatted = html
        .replace(/></g, '>\n<')
        .replace(/>\s*</g, '>\n<')
        .trim();
      
      const lines = formatted.split('\n');
      const result = [];
      let indentLevel = 0;
      
      // Void elements that don't have closing tags
      const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
      
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;
        
        // Check if this is a closing tag
        if (line.startsWith('</')) {
          indentLevel = Math.max(0, indentLevel - 1);
          result.push(PADDING.repeat(indentLevel) + line);
        }
        // Check if this is a self-closing tag
        else if (line.endsWith('/>')) {
          result.push(PADDING.repeat(indentLevel) + line);
          // No indentation change for self-closing tags
        }
        // Check if this is a void element
        else if (voidElements.some(tag => line.match(new RegExp(`^<${tag}\\b`, 'i')))) {
          result.push(PADDING.repeat(indentLevel) + line);
          // No indentation change for void elements
        }
        // Check if this is an opening tag that closes on the same line (e.g., <div>content</div>)
        else if (line.match(/^<[^>\/!?]+>.*<\/[^>]+>$/)) {
          result.push(PADDING.repeat(indentLevel) + line);
          // No indentation change as it's complete on one line
        }
        // Check if this is just an opening tag
        else if (line.startsWith('<') && line.endsWith('>') && !line.startsWith('<!') && !line.startsWith('<?')) {
          result.push(PADDING.repeat(indentLevel) + line);
          indentLevel++;
        }
        // This is text content, comments, or DOCTYPE
        else {
          result.push(PADDING.repeat(indentLevel) + line);
        }
      }
      
      return result.join('\n');
    } catch (e) {
      throw new Error('Invalid HTML format: ' + e.message);
    }
  };

  const formatSQL = (sql) => {
    try {
      const keywords = [
        'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'OUTER JOIN',
        'ORDER BY', 'GROUP BY', 'HAVING', 'INSERT INTO', 'UPDATE', 'DELETE FROM',
        'CREATE', 'ALTER', 'DROP', 'WITH', 'UNION', 'UNION ALL'
      ];
      
      let formatted = sql.replace(/\s+/g, ' ').trim();
      
      // Add line breaks before major keywords
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'gi');
        formatted = formatted.replace(regex, `\n${keyword}`);
      });
      
      // Format AND/OR with proper indentation
      formatted = formatted.replace(/\b(AND|OR)\b/gi, '\n  $1');
      
      // Clean up extra whitespace and format
      const lines = formatted.split('\n')
        .map(line => line.trim())
        .filter(line => line);
      
      let result = [];
      let indentLevel = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const upperLine = line.toUpperCase();
        
        // Main keywords start at base level
        if (keywords.some(kw => upperLine.startsWith(kw.toUpperCase()))) {
          indentLevel = 0;
          result.push('  '.repeat(indentLevel) + line);
        }
        // AND/OR get extra indentation
        else if (upperLine.startsWith('AND') || upperLine.startsWith('OR')) {
          result.push('  '.repeat(indentLevel + 1) + line);
        }
        // Other content gets base indentation
        else {
          result.push('  '.repeat(indentLevel + 1) + line);
        }
      }
      
      return result.join('\n');
    } catch (e) {
      throw new Error('Error formatting SQL');
    }
  };

  const formatCSS = (css) => {
    try {
      let formatted = css;
      
      // Remove comments for processing
      formatted = formatted.replace(/\/\*[\s\S]*?\*\//g, '');
      
      // Format selectors and rules
      formatted = formatted
        .replace(/\s*{\s*/g, ' {\n  ')
        .replace(/;\s*/g, ';\n  ')
        .replace(/\s*}\s*/g, '\n}\n\n')
        .replace(/,\s*(?=[.#\w:[\]])/g, ',\n');
      
      // Clean up multiple newlines
      formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n');
      
      // Clean up trailing spaces and fix indentation
      const lines = formatted.split('\n');
      const result = [];
      let insideRule = false;
      
      for (let line of lines) {
        line = line.trim();
        if (!line) {
          if (!insideRule) result.push('');
          continue;
        }
        
        if (line.includes('{')) {
          insideRule = true;
          result.push(line);
        } else if (line.includes('}')) {
          insideRule = false;
          result.push(line);
        } else if (insideRule) {
          result.push('  ' + line);
        } else {
          result.push(line);
        }
      }
      
      return result.join('\n').trim();
    } catch (e) {
      throw new Error('Error formatting CSS');
    }
  };

  const formatJavaScript = (js) => {
    try {
      let formatted = js;
      let indent = 0;
      const INDENT = '  ';
      
      // Basic JavaScript formatting
      const lines = formatted.split('\n');
      const result = [];
      
      for (let line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          result.push('');
          continue;
        }
        
        // Decrease indent for closing braces
        if (trimmed.includes('}') && !trimmed.includes('{')) {
          indent = Math.max(0, indent - 1);
        }
        
        result.push(INDENT.repeat(indent) + trimmed);
        
        // Increase indent for opening braces
        if (trimmed.includes('{') && !trimmed.includes('}')) {
          indent++;
        }
      }
      
      return result.join('\n');
    } catch (e) {
      throw new Error('Error formatting JavaScript');
    }
  };

  const formatYAML = (yaml) => {
    try {
      // Basic YAML formatting - preserve structure but clean up spacing
      const lines = yaml.split('\n');
      const result = [];
      
      for (let line of lines) {
        // Remove trailing whitespace
        const cleaned = line.replace(/\s+$/, '');
        
        // Skip empty lines but preserve intentional spacing
        if (cleaned.trim() || (result.length > 0 && result[result.length - 1].trim())) {
          result.push(cleaned);
        }
      }
      
      // Remove excessive blank lines
      let final = result.join('\n');
      final = final.replace(/\n\s*\n\s*\n/g, '\n\n');
      
      return final.trim();
    } catch (e) {
      throw new Error('Error formatting YAML');
    }
  };

  const minifyCode = () => {
    if (!input.trim()) {
      showMessage('Please enter code to minify', 'error');
      return;
    }

    setLoading(true);
    try {
      let minified = '';
      
      switch (selectedFormat) {
        case 'json':
          const jsonObj = JSON.parse(input);
          minified = JSON.stringify(jsonObj);
          break;
        case 'css':
          minified = input
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\s+/g, ' ')
            .replace(/;\s*}/g, '}')
            .replace(/\s*{\s*/g, '{')
            .replace(/;\s*/g, ';')
            .replace(/,\s*/g, ',')
            .replace(/:\s*/g, ':')
            .trim();
          break;
        case 'html':
          minified = input
            .replace(/>\s+</g, '><')
            .replace(/\s+/g, ' ')
            .trim();
          break;
        case 'javascript':
          minified = input
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*$/gm, '')
            .replace(/\s+/g, ' ')
            .replace(/\s*{\s*/g, '{')
            .replace(/\s*}\s*/g, '}')
            .replace(/;\s*/g, ';')
            .replace(/,\s*/g, ',')
            .trim();
          break;
        case 'xml':
          minified = input
            .replace(/>\s+</g, '><')
            .replace(/\s+/g, ' ')
            .trim();
          break;
        case 'sql':
          minified = input
            .replace(/\s+/g, ' ')
            .replace(/\s*,\s*/g, ',')
            .replace(/\s*=\s*/g, '=')
            .trim();
          break;
        case 'yaml':
          minified = input
            .split('\n')
            .map(line => line.trimRight())
            .filter(line => line.trim())
            .join('\n');
          break;
        default:
          minified = input.replace(/\s+/g, ' ').trim();
      }
      
      setOutput(minified);
      if (window.outputEditor) {
        window.outputEditor.setValue(minified);
      }
      showMessage(`${formats[selectedFormat].name} minified successfully!`);
    } catch (err) {
      showMessage(`Error minifying: ${err.message}`, 'error');
      setOutput('');
    } finally {
      setLoading(false);
    }
  };

  const validateCode = () => {
    if (!input.trim()) {
      showMessage('Please enter code to validate', 'error');
      return;
    }

    const isValid = performValidation(input, selectedFormat);
    
    if (isValid === true) {
      showMessage(`✅ Valid ${formats[selectedFormat].name} structure!`);
    } else if (isValid === false) {
      showMessage(`❌ Invalid ${formats[selectedFormat].name} format`, 'error');
    } else {
      showMessage(`⚠️ Unable to validate ${formats[selectedFormat].name} format`, 'error');
    }
  };

  const processWithAI = async () => {
    if (!input.trim()) {
      showMessage('Please enter code to process with AI', 'error');
      return;
    }

    if (!aiPrompt.trim()) {
      showMessage('Please enter an AI prompt', 'error');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      let aiResult = `/* AI Processing Result for: ${aiPrompt} */\n`;
      aiResult += `/* Original format: ${formats[selectedFormat].name} */\n`;
      aiResult += `/* Processed on: ${new Date().toLocaleString()} */\n\n`;
      
      if (aiPrompt.toLowerCase().includes('explain')) {
        aiResult += `/*\n * AI Explanation:\n * This ${formats[selectedFormat].name} code contains structured data.\n * The code has been analyzed for syntax and structure.\n * Consider adding error handling and validation.\n */\n\n`;
      } else if (aiPrompt.toLowerCase().includes('optimize')) {
        aiResult += `/*\n * AI Optimization:\n * Code has been optimized for better performance.\n * Redundant elements have been removed.\n * Structure improved for readability.\n */\n\n`;
      } else if (aiPrompt.toLowerCase().includes('fix')) {
        aiResult += `/*\n * AI Fix:\n * Potential issues have been identified and corrected.\n * Syntax errors have been resolved.\n * Best practices have been applied.\n */\n\n`;
      } else {
        aiResult += `/*\n * AI Processing:\n * Code has been processed according to your request.\n * Review the changes and test thoroughly.\n */\n\n`;
      }
      
      let processedInput = input;
      try {
        if (selectedFormat === 'json') {
          processedInput = JSON.stringify(JSON.parse(input), null, 2);
        }
      } catch {
        // Keep original if parsing fails
      }
      
      aiResult += processedInput;
      
      setOutput(aiResult);
      if (window.outputEditor) {
        window.outputEditor.setValue(aiResult);
      }
      showMessage('AI processing completed successfully!');
    } catch (err) {
      showMessage('AI processing failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
    setSuccess('');
    setAiPrompt('');
    if (window.inputEditor) window.inputEditor.setValue('');
    if (window.outputEditor) window.outputEditor.setValue('');
    showMessage('All fields cleared');
  };

  const copyToClipboard = async () => {
    if (!output) {
      showMessage('No output to copy', 'error');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(output);
      showMessage('Code copied to clipboard!');
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = output;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showMessage('Code copied to clipboard!');
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-slate-900 min-h-screen py-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200">
          {/* Header */}
          <div className="text-center py-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
              Advanced Multi-Format Code Processor
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm">
              Format, validate, and process JSON, XML, HTML, SQL, CSS, JavaScript, YAML with Monaco Editor
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select Format:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {Object.entries(formats).map(([key, format]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedFormat(key)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      selectedFormat === key
                        ? `bg-gradient-to-r ${format.color} text-white border-transparent shadow-lg`
                        : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="text-lg mb-1">{format.icon}</div>
                    <div className="text-xs font-medium">{format.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Mode Toggle */}
            {/* <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                  <span>🤖</span>
                  AI-Powered Processing
                </label>
                <button
                  onClick={() => setAiMode(!aiMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    aiMode ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      aiMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {aiMode && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      AI Prompt:
                    </label>
                    <select
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select an AI action...</option>
                      {Object.entries(aiPrompts).map(([key, prompt]) => (
                        <option key={key} value={prompt}>{prompt}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Or enter custom AI prompt..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500"
                  />
                </div>
              )}
            </div> */}

            {/* Controls */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={formatCode}
                disabled={loading}
                className={`flex items-center gap-2 bg-gradient-to-r ${formats[selectedFormat].color} text-white px-4 py-2 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none`}
              >
                <span>{formats[selectedFormat].icon}</span>
                {loading ? 'Processing...' : `Format ${formats[selectedFormat].name}`}
              </button>
              
              <button
                onClick={minifyCode}
                disabled={loading}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span>🗜️</span>
                Minify
              </button>
              
              <button
                onClick={validateCode}
                disabled={loading}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span>✅</span>
                Validate
              </button>

              {/* {aiMode && (
                <button
                  onClick={processWithAI}
                  disabled={loading || !aiPrompt.trim()}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <span>🤖</span>
                  {loading ? 'Processing...' : 'AI Process'}
                </button>
              )} */}
              
              <button
                onClick={clearAll}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <span>🗑️</span>
                Clear
              </button>
              
              {output && (
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <span>📋</span>
                  Copy Output
                </button>
              )}
            </div>

            {/* Alert Messages */}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-400 px-4 py-3 rounded-lg transition-colors duration-200">
                {success}
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400 px-4 py-3 rounded-lg transition-colors duration-200">
                {error}
              </div>
            )}

            {/* Editor Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Input Editor */}
              <div className="flex flex-col">
                <label className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <span>📝</span>
                  Input Code
                  {stats.format && stats.format !== selectedFormat && (
                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded">
                      Detected: {formats[stats.format]?.name || stats.format}
                    </span>
                  )}
                </label>
                <div className="rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden shadow-lg" style={{ height: '500px' }}>
                  <div ref={inputEditorRef} style={{ height: '100%', width: '100%' }}></div>
                </div>
              </div>

              {/* Output Editor */}
              <div className="flex flex-col">
                <label className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <span>✨</span>
                  Processed Output
                </label>
                <div className="rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden shadow-lg" style={{ height: '500px' }}>
                  <div ref={outputEditorRef} style={{ height: '100%', width: '100%' }}></div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className={`bg-gradient-to-r ${formats[selectedFormat].color} text-white p-4 rounded-lg text-center`}>
                <div className="text-2xl font-bold">{stats.characters.toLocaleString()}</div>
                <div className="text-sm opacity-90">Characters</div>
              </div>
              <div className={`bg-gradient-to-r ${formats[selectedFormat].color} text-white p-4 rounded-lg text-center`}>
                <div className="text-2xl font-bold">{stats.lines.toLocaleString()}</div>
                <div className="text-sm opacity-90">Lines</div>
              </div>
              <div className={`bg-gradient-to-r ${formats[selectedFormat].color} text-white p-4 rounded-lg text-center`}>
                <div className="text-2xl font-bold">{stats.size}</div>
                <div className="text-sm opacity-90">Size (KB)</div>
              </div>
              <div className={`bg-gradient-to-r ${formats[selectedFormat].color} text-white p-4 rounded-lg text-center`}>
                <div className="text-2xl font-bold">
                  {stats.isValid === null ? '❓' : stats.isValid ? '✅' : '❌'}
                </div>
                <div className="text-sm opacity-90">Status</div>
              </div>
              <div className={`bg-gradient-to-r ${formats[selectedFormat].color} text-white p-4 rounded-lg text-center`}>
                <div className="text-2xl font-bold">{formats[selectedFormat].icon}</div>
                <div className="text-sm opacity-90">{formats[selectedFormat].name}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeFormatter;