import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { explainFileDiff } from '../lib/aiRouterApi';

const tabs = [
  { id: 'text', label: 'TEXT INPUT', icon: '📝' },
  { id: 'upload', label: 'FILE UPLOAD', icon: '📁' }
];

const CODE_THEME_STORAGE_KEY = 'tts_file_compare_code_theme';

const CODE_THEME_PRESETS = {
  classic: {
    label: 'Classic',
    surfaceLight: { backgroundColor: '#fdfdfd' },
    surfaceDark: { backgroundColor: '#0f172a' },
    gutterLight: { backgroundColor: '#f3f4f6' },
    gutterDark: { backgroundColor: '#1e293b' },
    headerLight: { backgroundColor: '#f3f4f6', color: '#111827' },
    headerDark: { backgroundColor: '#1e293b', color: '#e5e7eb' },
    light: {
      plain: { color: '#1f2937' },
      keyword: { color: '#c026d3', fontWeight: 600 },
      string: { color: '#0f766e' },
      number: { color: '#b45309' },
      comment: { color: '#6b7280', fontStyle: 'italic' },
      function: { color: '#2563eb' },
      variable: { color: '#c2410c' },
      tag: { color: '#2563eb' },
      attr: { color: '#0e7490' },
      property: { color: '#0d9488' },
      operator: { color: '#7c3aed' },
      punctuation: { color: '#64748b' }
    },
    dark: {
      plain: { color: '#e5e7eb' },
      keyword: { color: '#e879f9', fontWeight: 600 },
      string: { color: '#34d399' },
      number: { color: '#fcd34d' },
      comment: { color: '#94a3b8', fontStyle: 'italic' },
      function: { color: '#60a5fa' },
      variable: { color: '#fdba74' },
      tag: { color: '#7dd3fc' },
      attr: { color: '#67e8f9' },
      property: { color: '#5eead4' },
      operator: { color: '#c4b5fd' },
      punctuation: { color: '#9ca3af' }
    }
  },
  monokai: {
    label: 'Monokai',
    surfaceLight: { backgroundColor: '#faf8f0' },
    surfaceDark: { backgroundColor: '#272822' },
    gutterLight: { backgroundColor: '#ece8d8' },
    gutterDark: { backgroundColor: '#3a3b34' },
    headerLight: { backgroundColor: '#ece8d8', color: '#3b3a32' },
    headerDark: { backgroundColor: '#3a3b34', color: '#f8f8f2' },
    light: {
      plain: { color: '#2f3129' },
      keyword: { color: '#c2185b', fontWeight: 600 },
      string: { color: '#6b8e23' },
      number: { color: '#7e57c2' },
      comment: { color: '#8a8f7a', fontStyle: 'italic' },
      function: { color: '#0277bd' },
      variable: { color: '#ef6c00' },
      tag: { color: '#2e7d32' },
      attr: { color: '#0277bd' },
      property: { color: '#558b2f' },
      operator: { color: '#c2185b' },
      punctuation: { color: '#6b7280' }
    },
    dark: {
      plain: { color: '#f8f8f2' },
      keyword: { color: '#f92672', fontWeight: 600 },
      string: { color: '#e6db74' },
      number: { color: '#ae81ff' },
      comment: { color: '#8f8b76', fontStyle: 'italic' },
      function: { color: '#66d9ef' },
      variable: { color: '#fd971f' },
      tag: { color: '#a6e22e' },
      attr: { color: '#66d9ef' },
      property: { color: '#a6e22e' },
      operator: { color: '#f92672' },
      punctuation: { color: '#d4d4cc' }
    }
  },
  lightPro: {
    label: 'Light Pro',
    surfaceLight: { backgroundColor: '#f8fafc' },
    surfaceDark: { backgroundColor: '#111827' },
    gutterLight: { backgroundColor: '#eef2f7' },
    gutterDark: { backgroundColor: '#1f2937' },
    headerLight: { backgroundColor: '#eef2f7', color: '#0f172a' },
    headerDark: { backgroundColor: '#1f2937', color: '#e5e7eb' },
    light: {
      plain: { color: '#1e293b' },
      keyword: { color: '#4338ca', fontWeight: 600 },
      string: { color: '#0f766e' },
      number: { color: '#c2410c' },
      comment: { color: '#64748b', fontStyle: 'italic' },
      function: { color: '#0369a1' },
      variable: { color: '#be123c' },
      tag: { color: '#0f766e' },
      attr: { color: '#0c4a6e' },
      property: { color: '#0d9488' },
      operator: { color: '#6d28d9' },
      punctuation: { color: '#64748b' }
    },
    dark: {
      plain: { color: '#e2e8f0' },
      keyword: { color: '#a5b4fc', fontWeight: 600 },
      string: { color: '#6ee7b7' },
      number: { color: '#fbbf24' },
      comment: { color: '#94a3b8', fontStyle: 'italic' },
      function: { color: '#93c5fd' },
      variable: { color: '#fda4af' },
      tag: { color: '#99f6e4' },
      attr: { color: '#bae6fd' },
      property: { color: '#5eead4' },
      operator: { color: '#c4b5fd' },
      punctuation: { color: '#cbd5e1' }
    }
  }
};

const getLineStats = (text) => ({
  lines: text ? text.split('\n').length : 0,
  chars: text.length
});

const normalizeLine = (line, options) => {
  let normalized = line;
  if (options.ignoreWhitespace) {
    normalized = normalized.replace(/\s+/g, ' ').trim();
  }
  if (options.ignoreCase) {
    normalized = normalized.toLowerCase();
  }
  return normalized;
};

const computeLcsTable = (left, right) => {
  const table = Array(left.length + 1)
    .fill(null)
    .map(() => Array(right.length + 1).fill(0));

  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      if (left[i - 1] === right[j - 1]) {
        table[i][j] = table[i - 1][j - 1] + 1;
      } else {
        table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
      }
    }
  }

  return table;
};

const buildRawDiff = (leftLines, rightLines, options) => {
  const normalizedLeft = leftLines.map((line) => normalizeLine(line, options));
  const normalizedRight = rightLines.map((line) => normalizeLine(line, options));
  const lcs = computeLcsTable(normalizedLeft, normalizedRight);

  const rows = [];
  let i = leftLines.length;
  let j = rightLines.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && normalizedLeft[i - 1] === normalizedRight[j - 1]) {
      rows.unshift({
        kind: 'unchanged',
        leftText: leftLines[i - 1],
        rightText: rightLines[j - 1],
        leftLineNumber: i,
        rightLineNumber: j
      });
      i -= 1;
      j -= 1;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      rows.unshift({
        kind: 'added',
        leftText: '',
        rightText: rightLines[j - 1],
        leftLineNumber: null,
        rightLineNumber: j
      });
      j -= 1;
    } else {
      rows.unshift({
        kind: 'removed',
        leftText: leftLines[i - 1],
        rightText: '',
        leftLineNumber: i,
        rightLineNumber: null
      });
      i -= 1;
    }
  }

  return rows;
};

const mergeModifiedBlocks = (rows) => {
  const merged = [];
  let index = 0;

  while (index < rows.length) {
    const row = rows[index];

    if (row.kind !== 'removed') {
      merged.push(row);
      index += 1;
      continue;
    }

    const removedBlock = [];
    while (index < rows.length && rows[index].kind === 'removed') {
      removedBlock.push(rows[index]);
      index += 1;
    }

    const addedBlock = [];
    let lookahead = index;
    while (lookahead < rows.length && rows[lookahead].kind === 'added') {
      addedBlock.push(rows[lookahead]);
      lookahead += 1;
    }

    if (!addedBlock.length) {
      merged.push(...removedBlock);
      continue;
    }

    index = lookahead;

    const maxLen = Math.max(removedBlock.length, addedBlock.length);
    for (let i = 0; i < maxLen; i += 1) {
      const removed = removedBlock[i];
      const added = addedBlock[i];

      if (removed && added) {
        merged.push({
          kind: 'modified',
          leftText: removed.leftText,
          rightText: added.rightText,
          leftLineNumber: removed.leftLineNumber,
          rightLineNumber: added.rightLineNumber
        });
      } else if (removed) {
        merged.push(removed);
      } else if (added) {
        merged.push(added);
      }
    }
  }

  return merged;
};

const getInlineDiffSegments = (leftText, rightText) => {
  if (!leftText && !rightText) {
    return {
      prefix: '',
      leftMiddle: '',
      rightMiddle: '',
      suffix: ''
    };
  }

  let prefixLen = 0;
  const minLen = Math.min(leftText.length, rightText.length);

  while (prefixLen < minLen && leftText[prefixLen] === rightText[prefixLen]) {
    prefixLen += 1;
  }

  let leftSuffix = leftText.length - 1;
  let rightSuffix = rightText.length - 1;

  while (
    leftSuffix >= prefixLen &&
    rightSuffix >= prefixLen &&
    leftText[leftSuffix] === rightText[rightSuffix]
  ) {
    leftSuffix -= 1;
    rightSuffix -= 1;
  }

  const prefix = leftText.slice(0, prefixLen);
  const suffix = leftText.slice(leftSuffix + 1);

  return {
    prefix,
    leftMiddle: leftText.slice(prefixLen, leftSuffix + 1),
    rightMiddle: rightText.slice(prefixLen, rightSuffix + 1),
    suffix
  };
};

const EXTENSION_LANGUAGE_MAP = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'javascript',
  tsx: 'javascript',
  json: 'json',
  xml: 'xml',
  html: 'xml',
  htm: 'xml',
  css: 'css',
  scss: 'css',
  php: 'php',
  sql: 'sql',
  yaml: 'yaml',
  yml: 'yaml',
  md: 'markdown',
  txt: 'plain',
  py: 'python',
  java: 'javascript',
  c: 'javascript',
  cpp: 'javascript',
  h: 'javascript',
  go: 'javascript',
  rb: 'javascript',
  sh: 'javascript'
};

const languageLabel = (language) => {
  const labels = {
    javascript: 'JS/TS',
    json: 'JSON',
    xml: 'XML/HTML',
    css: 'CSS',
    php: 'PHP',
    sql: 'SQL',
    yaml: 'YAML',
    markdown: 'Markdown',
    python: 'Python',
    plain: 'Plain Text'
  };

  return labels[language] || 'Plain Text';
};

const JS_LIKE_TOKEN_REGEX =
  /(?<comment>\/\/.*|\/\*.*?\*\/)|(?<string>"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(?<keyword>\b(?:if|else|for|while|return|function|class|const|let|var|new|try|catch|finally|switch|case|break|continue|throw|import|from|export|default|extends|implements|interface|public|private|protected|static|async|await|null|true|false|in|of|typeof|instanceof|namespace|use|echo)\b)|(?<number>\b\d+(?:\.\d+)?\b)|(?<function>\b[A-Za-z_]\w*(?=\s*\())|(?<variable>\$[A-Za-z_]\w*)|(?<operator>=>|==={0,1}|!==|!=|<=|>=|&&|\|\||[+\-*/%=&|^~!<>?:]+)|(?<punctuation>[{}[\]().,;])/g;

const JSON_TOKEN_REGEX =
  /(?<attr>"(?:\\.|[^"\\])*"(?=\s*:))|(?<string>"(?:\\.|[^"\\])*")|(?<number>-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(?<keyword>\b(?:true|false|null)\b)|(?<punctuation>[{}[\],:])/g;

const XML_TOKEN_REGEX =
  /(?<comment><!--.*?-->)|(?<tag><\/?[A-Za-z][\w:-]*|\/?>)|(?<attr>[A-Za-z_:][\w:.-]*(?=\=))|(?<string>"[^"]*"|'[^']*')|(?<operator>=)/g;

const CSS_TOKEN_REGEX =
  /(?<comment>\/\*.*?\*\/)|(?<keyword>@[a-z-]+)|(?<property>[a-z-]+(?=\s*:))|(?<number>\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|ms|s)?\b)|(?<string>"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(?<punctuation>[{}:;(),])/g;

const SQL_TOKEN_REGEX =
  /(?<comment>--.*)|(?<string>'(?:''|[^'])*')|(?<keyword>\b(?:SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|BY|ORDER|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|ALTER|DROP|TABLE|AND|OR|NOT|NULL|AS|DISTINCT|LIMIT|OFFSET|HAVING|UNION|CASE|WHEN|THEN|END)\b)|(?<number>\b\d+(?:\.\d+)?\b)|(?<function>\b[A-Za-z_][\w$]*(?=\s*\())|(?<punctuation>[(),.;])/gi;

const tokenCache = new Map();

const tokenizeWithRegex = (line, regex) => {
  const tokens = [];
  regex.lastIndex = 0;
  let cursor = 0;
  const matches = line.matchAll(regex);

  for (const match of matches) {
    const index = match.index ?? 0;
    if (index > cursor) {
      tokens.push({ type: 'plain', value: line.slice(cursor, index) });
    }

    const matchedType = Object.entries(match.groups || {}).find(([, value]) => value !== undefined)?.[0] || 'plain';
    tokens.push({ type: matchedType, value: match[0] });
    cursor = index + match[0].length;
  }

  if (cursor < line.length) {
    tokens.push({ type: 'plain', value: line.slice(cursor) });
  }

  return tokens;
};

const tokenizeYamlLine = (line) => {
  const commentIndex = line.indexOf('#');
  const contentPart = commentIndex >= 0 ? line.slice(0, commentIndex) : line;
  const commentPart = commentIndex >= 0 ? line.slice(commentIndex) : '';
  const keyMatch = contentPart.match(/^(\s*-?\s*)([A-Za-z_][\w-]*)(\s*:)(.*)$/);

  if (!keyMatch) {
    if (!commentPart) return [{ type: 'plain', value: line }];
    return [
      { type: 'plain', value: contentPart },
      { type: 'comment', value: commentPart }
    ];
  }

  const [, indent, key, separator, rest] = keyMatch;
  const tokens = [
    { type: 'plain', value: indent },
    { type: 'attr', value: key },
    { type: 'punctuation', value: separator }
  ];

  if (rest) {
    const trimmed = rest.trim();
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      tokens.push({ type: 'number', value: rest });
    } else if (/^(true|false|null)$/i.test(trimmed)) {
      tokens.push({ type: 'keyword', value: rest });
    } else if (/^["'].*["']$/.test(trimmed)) {
      tokens.push({ type: 'string', value: rest });
    } else {
      tokens.push({ type: 'plain', value: rest });
    }
  }

  if (commentPart) {
    tokens.push({ type: 'comment', value: commentPart });
  }

  return tokens;
};

const detectLanguage = (title, content) => {
  const extension = title?.split('.').pop()?.toLowerCase();
  if (extension && EXTENSION_LANGUAGE_MAP[extension]) {
    return EXTENSION_LANGUAGE_MAP[extension];
  }

  const sample = (content || '').slice(0, 3000);
  const trimmed = sample.trim();

  if (!trimmed) return 'plain';
  if (/^<\?php/.test(trimmed) || /\$[A-Za-z_]\w*/.test(sample)) return 'php';
  if (/^(\{|\[)/.test(trimmed) && /"\s*:/.test(sample)) return 'json';
  if (/<!--|<\/?[a-zA-Z][\w:-]*[^>]*>/.test(sample)) return 'xml';
  if (/^\s*[@.#]?[a-zA-Z_-][\w-]*\s*\{[\s\S]*\}/.test(sample) || /\b[a-z-]+\s*:\s*[^;]+;/.test(sample)) return 'css';
  if (/\b(SELECT|FROM|WHERE|JOIN|INSERT|UPDATE|DELETE)\b/i.test(sample)) return 'sql';
  if (/^\s*[A-Za-z_][\w-]*\s*:\s*/m.test(sample) && !/[{};]/.test(sample)) return 'yaml';
  if (/\b(function|const|let|class|import|export|return)\b/.test(sample)) return 'javascript';

  return 'plain';
};

const tokenizeLine = (line, language) => {
  const cacheKey = `${language}:${line}`;
  if (tokenCache.has(cacheKey)) {
    return tokenCache.get(cacheKey);
  }

  let tokens;
  if (!line) {
    tokens = [{ type: 'plain', value: '' }];
  } else if (language === 'json') {
    tokens = tokenizeWithRegex(line, JSON_TOKEN_REGEX);
  } else if (language === 'xml' || language === 'markdown') {
    tokens = tokenizeWithRegex(line, XML_TOKEN_REGEX);
  } else if (language === 'css') {
    tokens = tokenizeWithRegex(line, CSS_TOKEN_REGEX);
  } else if (language === 'sql') {
    tokens = tokenizeWithRegex(line, SQL_TOKEN_REGEX);
  } else if (language === 'yaml') {
    tokens = tokenizeYamlLine(line);
  } else if (language === 'javascript' || language === 'php' || language === 'python') {
    tokens = tokenizeWithRegex(line, JS_LIKE_TOKEN_REGEX);
  } else {
    tokens = [{ type: 'plain', value: line }];
  }

  if (tokenCache.size > 8000) {
    tokenCache.clear();
  }
  tokenCache.set(cacheKey, tokens);

  return tokens;
};

const FileCompare = () => {
  const [activeTab, setActiveTab] = useState('text');
  const [leftContent, setLeftContent] = useState('');
  const [rightContent, setRightContent] = useState('');
  const [leftTitle, setLeftTitle] = useState('');
  const [rightTitle, setRightTitle] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const [showInputs, setShowInputs] = useState(true);
  const [diffRows, setDiffRows] = useState([]);
  const [activeChangePointer, setActiveChangePointer] = useState(0);
  const [aiExplainResult, setAiExplainResult] = useState(null);
  const [aiExplainLoading, setAiExplainLoading] = useState(false);
  const [aiExplainError, setAiExplainError] = useState('');
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [options, setOptions] = useState(() => {
    const fallbackTheme = 'classic';
    if (typeof window === 'undefined') {
      return {
        ignoreWhitespace: false,
        ignoreCase: false,
        showOnlyChanges: false,
        wordWrap: false,
        viewMode: 'split',
        codeTheme: fallbackTheme
      };
    }

    const storedTheme = window.localStorage.getItem(CODE_THEME_STORAGE_KEY) || fallbackTheme;
    const codeTheme = CODE_THEME_PRESETS[storedTheme] ? storedTheme : fallbackTheme;

    return {
      ignoreWhitespace: false,
      ignoreCase: false,
      showOnlyChanges: false,
      wordWrap: false,
      viewMode: 'split',
      codeTheme
    };
  });

  const leftScrollRef = useRef(null);
  const rightScrollRef = useRef(null);
  const unifiedScrollRef = useRef(null);
  const resultSectionRef = useRef(null);
  const leftFileRef = useRef(null);
  const rightFileRef = useRef(null);
  const syncingRef = useRef(false);
  const activePointerRef = useRef(0);

  useEffect(() => {
    const checkDarkTheme = () => {
      setIsDarkTheme(document.documentElement.classList.contains('dark'));
    };

    checkDarkTheme();

    const observer = new MutationObserver(checkDarkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(CODE_THEME_STORAGE_KEY, options.codeTheme);
  }, [options.codeTheme]);

  const visibleRows = useMemo(() => {
    if (!options.showOnlyChanges) {
      return diffRows;
    }
    return diffRows.filter((row) => row.kind !== 'unchanged');
  }, [diffRows, options.showOnlyChanges]);

  const stats = useMemo(
    () =>
      diffRows.reduce(
        (acc, row) => {
          acc.total += 1;
          acc[row.kind] += 1;
          return acc;
        },
        {
          total: 0,
          unchanged: 0,
          added: 0,
          removed: 0,
          modified: 0
        }
      ),
    [diffRows]
  );

  const changeRowIndexes = useMemo(
    () => visibleRows.map((row, index) => ({ row, index })).filter(({ row }) => row.kind !== 'unchanged'),
    [visibleRows]
  );
  const activeVisibleRowIndex = changeRowIndexes[activeChangePointer]?.index ?? -1;

  const similarity = stats.total ? Math.round((stats.unchanged / stats.total) * 100) : 100;

  const leftInputStats = getLineStats(leftContent);
  const rightInputStats = getLineStats(rightContent);
  const leftLanguage = useMemo(() => detectLanguage(leftTitle, leftContent), [leftTitle, leftContent]);
  const rightLanguage = useMemo(() => detectLanguage(rightTitle, rightContent), [rightTitle, rightContent]);
  const selectedCodeTheme = CODE_THEME_PRESETS[options.codeTheme] || CODE_THEME_PRESETS.classic;
  const tokenPalette = selectedCodeTheme[isDarkTheme ? 'dark' : 'light'] || selectedCodeTheme.light;
  const codeSurfaceStyle = isDarkTheme ? selectedCodeTheme.surfaceDark || {} : selectedCodeTheme.surfaceLight || {};
  const codeGutterStyle = isDarkTheme ? selectedCodeTheme.gutterDark || {} : selectedCodeTheme.gutterLight || {};
  const codeHeaderStyle = isDarkTheme ? selectedCodeTheme.headerDark || {} : selectedCodeTheme.headerLight || {};

  const syncScroll = (source) => {
    if (options.viewMode !== 'split' || syncingRef.current) {
      return;
    }

    const sourceRef = source === 'left' ? leftScrollRef.current : rightScrollRef.current;
    const targetRef = source === 'left' ? rightScrollRef.current : leftScrollRef.current;

    if (!sourceRef || !targetRef) {
      return;
    }

    syncingRef.current = true;
    targetRef.scrollTop = sourceRef.scrollTop;
    targetRef.scrollLeft = sourceRef.scrollLeft;
    requestAnimationFrame(() => {
      syncingRef.current = false;
    });
  };

  const scrollToChangeRow = (rowIndex) => {
    if (rowIndex < 0) {
      return;
    }

    if (options.viewMode === 'split') {
      const leftContainer = leftScrollRef.current;
      const rightContainer = rightScrollRef.current;
      const leftRow = leftContainer?.querySelector(`[data-split-left-row="${rowIndex}"]`);
      const rightRow = rightContainer?.querySelector(`[data-split-right-row="${rowIndex}"]`);

      if (!leftContainer || !rightContainer || !leftRow || !rightRow) {
        return;
      }

      const leftContainerRect = leftContainer.getBoundingClientRect();
      const leftRowRect = leftRow.getBoundingClientRect();
      const leftTargetTop =
        leftContainer.scrollTop +
        (leftRowRect.top - leftContainerRect.top) -
        leftContainer.clientHeight / 2 +
        leftRowRect.height / 2;

      const rightContainerRect = rightContainer.getBoundingClientRect();
      const rightRowRect = rightRow.getBoundingClientRect();
      const rightTargetTop =
        rightContainer.scrollTop +
        (rightRowRect.top - rightContainerRect.top) -
        rightContainer.clientHeight / 2 +
        rightRowRect.height / 2;

      leftContainer.scrollTo({ top: Math.max(leftTargetTop, 0), behavior: 'smooth' });
      rightContainer.scrollTo({ top: Math.max(rightTargetTop, 0), behavior: 'smooth' });
      return;
    }

    const unifiedContainer = unifiedScrollRef.current;
    const unifiedRow = unifiedContainer?.querySelector(`[data-unified-row="${rowIndex}"]`);
    if (!unifiedContainer || !unifiedRow) {
      return;
    }

    const unifiedContainerRect = unifiedContainer.getBoundingClientRect();
    const unifiedRowRect = unifiedRow.getBoundingClientRect();
    const targetTop =
      unifiedContainer.scrollTop +
      (unifiedRowRect.top - unifiedContainerRect.top) -
      unifiedContainer.clientHeight / 2 +
      unifiedRowRect.height / 2;
    unifiedContainer.scrollTo({ top: targetTop, behavior: 'smooth' });
  };

  const compare = () => {
    const leftLines = leftContent.split('\n');
    const rightLines = rightContent.split('\n');

    const rawRows = buildRawDiff(leftLines, rightLines, options);
    const mergedRows = mergeModifiedBlocks(rawRows);

    setDiffRows(mergedRows);
    setShowDiff(true);
    setShowInputs(false);
    setActiveChangePointer(0);
    setAiExplainResult(null);
    setAiExplainError('');
    activePointerRef.current = 0;

    if (leftScrollRef.current) {
      leftScrollRef.current.scrollTop = 0;
    }
    if (rightScrollRef.current) {
      rightScrollRef.current.scrollTop = 0;
    }
    if (unifiedScrollRef.current) {
      unifiedScrollRef.current.scrollTop = 0;
    }

    requestAnimationFrame(() => {
      resultSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (mergedRows.some((row) => row.kind !== 'unchanged')) {
        const firstChangeIndex = mergedRows.findIndex((row) => row.kind !== 'unchanged');
        scrollToChangeRow(firstChangeIndex);
      }
    });

    const changeRows = mergedRows.filter((row) => row.kind !== 'unchanged');
    trackEvent('file_compare_run', {
      left_lines: leftLines.length,
      right_lines: rightLines.length,
      total_rows: mergedRows.length,
      changed_rows: changeRows.length,
      ignore_whitespace: options.ignoreWhitespace,
      ignore_case: options.ignoreCase
    });
  };

  const updateOption = (key, value) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
    if (['viewMode', 'showOnlyChanges', 'wordWrap', 'codeTheme'].includes(key)) {
      trackEvent('file_compare_option_change', {
        option_key: key,
        option_value: String(value)
      });
    }
  };

  const clearSide = (side) => {
    if (side === 'left') {
      setLeftContent('');
      setLeftTitle('');
      if (leftFileRef.current) {
        leftFileRef.current.value = '';
      }
      return;
    }

    setRightContent('');
    setRightTitle('');
    if (rightFileRef.current) {
      rightFileRef.current.value = '';
    }
  };

  const clearAll = () => {
    clearSide('left');
    clearSide('right');
    setDiffRows([]);
    setShowDiff(false);
    setShowInputs(true);
    setActiveChangePointer(0);
    setAiExplainResult(null);
    setAiExplainError('');
    setAiExplainLoading(false);
  };

  const swapSides = () => {
    setLeftContent(rightContent);
    setRightContent(leftContent);
    setLeftTitle(rightTitle);
    setRightTitle(leftTitle);
  };

  const handleFileUpload = (event, side) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result || '';
      if (side === 'left') {
        setLeftContent(text);
        setLeftTitle(file.name);
      } else {
        setRightContent(text);
        setRightTitle(file.name);
      }
    };
    reader.readAsText(file);
  };

  const navigateChange = (direction) => {
    if (!changeRowIndexes.length) {
      return;
    }

    const currentPointer = activePointerRef.current;
    const nextPointer =
      direction === 'next'
        ? (currentPointer + 1) % changeRowIndexes.length
        : (currentPointer - 1 + changeRowIndexes.length) % changeRowIndexes.length;

    activePointerRef.current = nextPointer;
    setActiveChangePointer(nextPointer);

    const rowIndex = changeRowIndexes[nextPointer].index;
    scrollToChangeRow(rowIndex);
    trackEvent('file_compare_change_navigate', {
      direction,
      current_index: nextPointer + 1,
      total_changes: changeRowIndexes.length
    });
  };

  useEffect(() => {
    if (!changeRowIndexes.length) {
      setActiveChangePointer(0);
      activePointerRef.current = 0;
      return;
    }
    if (activeChangePointer >= changeRowIndexes.length) {
      setActiveChangePointer(0);
      activePointerRef.current = 0;
      return;
    }
    activePointerRef.current = activeChangePointer;
  }, [changeRowIndexes, activeChangePointer]);

  const exportDiff = () => {
    const lines = visibleRows.map((row) => {
      if (row.kind === 'unchanged') {
        return `  ${row.leftText}`;
      }
      if (row.kind === 'added') {
        return `+ ${row.rightText}`;
      }
      if (row.kind === 'removed') {
        return `- ${row.leftText}`;
      }
      return `~ ${row.leftText} -> ${row.rightText}`;
    });

    const summary = [
      `Similarity: ${similarity}%`,
      `Added: ${stats.added}`,
      `Removed: ${stats.removed}`,
      `Modified: ${stats.modified}`,
      `Unchanged: ${stats.unchanged}`,
      ''
    ];

    const payload = [...summary, ...lines].join('\n');
    const blob = new Blob([payload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'file-compare-result.diff.txt';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    trackEvent('file_compare_export', {
      visible_rows: visibleRows.length,
      similarity
    });
  };

  const runAiDiffExplain = async () => {
    if (!showDiff || diffRows.length === 0 || aiExplainLoading) {
      return;
    }

    setAiExplainLoading(true);
    setAiExplainError('');

    trackEvent('ai_diff_explain_run', {
      changed_rows: stats.total - stats.unchanged,
      similarity
    });

    try {
      const result = await explainFileDiff({
        leftText: leftContent,
        rightText: rightContent,
        leftTitle,
        rightTitle,
        options: {
          ignoreWhitespace: options.ignoreWhitespace,
          ignoreCase: options.ignoreCase
        },
        maxSnippets: 16
      });

      setAiExplainResult(result);
      trackEvent('ai_diff_explain_success', {
        risk_level: result.overview?.riskLevel || 'unknown',
        confidence: result.overview?.confidence || 0
      });
    } catch (error) {
      setAiExplainResult(null);
      setAiExplainError(error.message || 'AI explanation failed');
      trackEvent('ai_diff_explain_failed', {
        status: error.status || 0
      });
    } finally {
      setAiExplainLoading(false);
    }
  };

  const getRiskClass = (riskLevel) => {
    if (riskLevel === 'high') {
      return isDarkTheme
        ? 'bg-red-900/30 text-red-300 border-red-700'
        : 'bg-red-100 text-red-700 border-red-300';
    }
    if (riskLevel === 'medium') {
      return isDarkTheme
        ? 'bg-amber-900/30 text-amber-200 border-amber-700'
        : 'bg-amber-100 text-amber-700 border-amber-300';
    }
    return isDarkTheme
      ? 'bg-green-900/30 text-green-300 border-green-700'
      : 'bg-green-100 text-green-700 border-green-300';
  };

  const canCompare = leftContent.trim().length > 0 && rightContent.trim().length > 0;

  const getTokenStyle = (type) => {
    return tokenPalette[type] || tokenPalette.plain || {};
  };

  const renderHighlightedText = (text, language, keyPrefix) => {
    const tokens = tokenizeLine(text, language);
    return tokens.map((token, index) => (
      <span key={`${keyPrefix}-${index}`} style={getTokenStyle(token.type)}>
        {token.value}
      </span>
    ));
  };

  const getLineLanguage = (side) => (side === 'left' ? leftLanguage : rightLanguage);

  const renderInlineDiff = (row, side, rowIndex) => {
    const language = getLineLanguage(side);

    if (row.kind !== 'modified') {
      const plainLine = side === 'left' ? row.leftText : row.rightText;
      return renderHighlightedText(plainLine, language, `${side}-${rowIndex}-plain`);
    }

    const segments = getInlineDiffSegments(row.leftText, row.rightText);
    const middle = side === 'left' ? segments.leftMiddle : segments.rightMiddle;

    return (
      <>
        {renderHighlightedText(segments.prefix, language, `${side}-${rowIndex}-prefix`)}
        <span
          className={`px-1 rounded ${
            side === 'left'
              ? isDarkTheme
                ? 'bg-red-900/50 text-red-200'
                : 'bg-red-200 text-red-800'
              : isDarkTheme
              ? 'bg-green-900/50 text-green-200'
              : 'bg-green-200 text-green-800'
          }`}
        >
          {renderHighlightedText(middle || ' ', language, `${side}-${rowIndex}-middle`)}
        </span>
        {renderHighlightedText(segments.suffix, language, `${side}-${rowIndex}-suffix`)}
      </>
    );
  };

  const getRowClass = (kind, side) => {
    const neutral = isDarkTheme ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white hover:bg-gray-50';

    if (kind === 'unchanged') {
      return neutral;
    }

    if (kind === 'removed') {
      return side === 'left'
        ? isDarkTheme
          ? 'bg-red-950/40 border-l-4 border-red-500'
          : 'bg-red-50 border-l-4 border-red-400'
        : neutral;
    }

    if (kind === 'added') {
      return side === 'right'
        ? isDarkTheme
          ? 'bg-green-950/40 border-l-4 border-green-500'
          : 'bg-green-50 border-l-4 border-green-400'
        : neutral;
    }

    return isDarkTheme
      ? 'bg-amber-900/20 border-l-4 border-amber-400'
      : 'bg-amber-50 border-l-4 border-amber-400';
  };

  const getBadgeClass = (tone) => {
    const classMap = {
      added: isDarkTheme ? 'bg-green-900/40 text-green-300 border-green-500/50' : 'bg-green-100 text-green-700 border-green-300',
      removed: isDarkTheme ? 'bg-red-900/40 text-red-300 border-red-500/50' : 'bg-red-100 text-red-700 border-red-300',
      modified: isDarkTheme ? 'bg-amber-900/40 text-amber-200 border-amber-500/50' : 'bg-amber-100 text-amber-700 border-amber-300',
      unchanged: isDarkTheme ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'
    };

    return classMap[tone];
  };

  const getActiveRowClass = (rowIndex, rowKind) => {
    if (rowIndex !== activeVisibleRowIndex || rowKind === 'unchanged') {
      return '';
    }
    return isDarkTheme
      ? 'bg-blue-900/40 shadow-[inset_0_0_0_2px_rgba(96,165,250,0.95)]'
      : 'bg-blue-100 shadow-[inset_0_0_0_2px_rgba(37,99,235,0.95)]';
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200">
          <div className="text-center mb-4 mt-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center mb-1">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                File Compare
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm mb-3">
              Advanced side-by-side comparison with change navigation, filters, and export
            </p>
          </div>

          <div className="p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-40 flex items-center justify-center px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-500 text-blue-100 hover:bg-purple-600 hover:text-white'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <button
                type="button"
                onClick={compare}
                disabled={!canCompare}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Compare
              </button>
              <button
                type="button"
                onClick={swapSides}
                className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-medium transition-colors"
              >
                Swap Sides
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-medium transition-colors"
              >
                Clear All
              </button>
              {showDiff && (
                <button
                  type="button"
                  onClick={exportDiff}
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                >
                  Download Result
                </button>
              )}
              {showDiff && (
                <button
                  type="button"
                  onClick={runAiDiffExplain}
                  disabled={aiExplainLoading}
                  className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-medium transition-colors"
                >
                  {aiExplainLoading ? 'Analyzing Diff...' : 'AI Explain Diff'}
                </button>
              )}
              {showDiff && (
                <button
                  type="button"
                  onClick={() => setShowInputs((prev) => !prev)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
                >
                  {showInputs ? 'Hide Inputs' : 'Edit Inputs'}
                </button>
              )}
            </div>

            {showInputs && activeTab === 'text' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className={`rounded-lg border ${isDarkTheme ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                  <div className={`p-3 border-b ${isDarkTheme ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={leftTitle}
                        onChange={(e) => setLeftTitle(e.target.value)}
                        placeholder="Left title (optional)"
                        className={`flex-1 px-3 py-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          isDarkTheme
                            ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => clearSide('left')}
                        className="px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
                      >
                        Clear
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-300">
                      {leftInputStats.lines} lines • {leftInputStats.chars} chars
                    </p>
                  </div>
                  <textarea
                    value={leftContent}
                    onChange={(e) => setLeftContent(e.target.value)}
                    placeholder="Paste first content here"
                    className={`w-full h-72 p-4 font-mono text-sm resize-none border-0 focus:outline-none ${
                      isDarkTheme
                        ? 'bg-gray-800 text-gray-100 placeholder-gray-500'
                        : 'bg-white text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>

                <div className={`rounded-lg border ${isDarkTheme ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                  <div className={`p-3 border-b ${isDarkTheme ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={rightTitle}
                        onChange={(e) => setRightTitle(e.target.value)}
                        placeholder="Right title (optional)"
                        className={`flex-1 px-3 py-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          isDarkTheme
                            ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => clearSide('right')}
                        className="px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
                      >
                        Clear
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-300">
                      {rightInputStats.lines} lines • {rightInputStats.chars} chars
                    </p>
                  </div>
                  <textarea
                    value={rightContent}
                    onChange={(e) => setRightContent(e.target.value)}
                    placeholder="Paste second content here"
                    className={`w-full h-72 p-4 font-mono text-sm resize-none border-0 focus:outline-none ${
                      isDarkTheme
                        ? 'bg-gray-800 text-gray-100 placeholder-gray-500'
                        : 'bg-white text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>
            )}

            {showInputs && activeTab === 'upload' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className={`rounded-lg border p-6 ${isDarkTheme ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Upload Left File</h4>
                  <input
                    ref={leftFileRef}
                    type="file"
                    onChange={(e) => handleFileUpload(e, 'left')}
                    className="hidden"
                    accept=".txt,.md,.js,.jsx,.ts,.tsx,.json,.xml,.html,.css,.yaml,.yml,.php"
                  />
                  <button
                    type="button"
                    onClick={() => leftFileRef.current?.click()}
                    className={`w-full py-10 border-2 border-dashed rounded-lg ${
                      isDarkTheme
                        ? 'border-gray-600 hover:border-purple-400 hover:bg-purple-900/20'
                        : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                    }`}
                  >
                    <span className="block text-3xl mb-2">📄</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Click to choose first file</span>
                  </button>
                  {leftTitle && <p className="mt-2 text-sm text-green-600">Loaded: {leftTitle}</p>}
                </div>

                <div className={`rounded-lg border p-6 ${isDarkTheme ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Upload Right File</h4>
                  <input
                    ref={rightFileRef}
                    type="file"
                    onChange={(e) => handleFileUpload(e, 'right')}
                    className="hidden"
                    accept=".txt,.md,.js,.jsx,.ts,.tsx,.json,.xml,.html,.css,.yaml,.yml,.php"
                  />
                  <button
                    type="button"
                    onClick={() => rightFileRef.current?.click()}
                    className={`w-full py-10 border-2 border-dashed rounded-lg ${
                      isDarkTheme
                        ? 'border-gray-600 hover:border-purple-400 hover:bg-purple-900/20'
                        : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                    }`}
                  >
                    <span className="block text-3xl mb-2">📄</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Click to choose second file</span>
                  </button>
                  {rightTitle && <p className="mt-2 text-sm text-green-600">Loaded: {rightTitle}</p>}
                </div>
              </div>
            )}

            {!showInputs && showDiff && (
              <div className="mb-4 text-xs text-gray-600 dark:text-gray-300">
                Inputs are hidden. Use <span className="font-semibold">Edit Inputs</span> to modify content.
              </div>
            )}

            {aiExplainError && (
              <div className="mb-4 px-3 py-2 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                {aiExplainError}
              </div>
            )}

            {showDiff && (
              <div
                ref={resultSectionRef}
                className={`rounded-lg border overflow-hidden ${isDarkTheme ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-white'}`}
              >
                <div className={`sticky top-0 z-20 p-4 border-b ${isDarkTheme ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`text-xs px-2 py-1 border rounded-full ${getBadgeClass('added')}`}>Added {stats.added}</span>
                    <span className={`text-xs px-2 py-1 border rounded-full ${getBadgeClass('removed')}`}>Deleted {stats.removed}</span>
                    <span className={`text-xs px-2 py-1 border rounded-full ${getBadgeClass('modified')}`}>Changed {stats.modified}</span>
                    <span className={`text-xs px-2 py-1 border rounded-full ${getBadgeClass('unchanged')}`}>Unchanged {stats.unchanged}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-600 text-white">Similarity {similarity}%</span>
                    <span
                      className={`text-xs px-2 py-1 border rounded-full ${
                        isDarkTheme ? 'bg-purple-900/30 text-purple-200 border-purple-700' : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}
                    >
                      Theme: {selectedCodeTheme.label}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 border rounded-full ${
                        isDarkTheme ? 'bg-blue-900/30 text-blue-200 border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      Left: {languageLabel(leftLanguage)}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 border rounded-full ${
                        isDarkTheme ? 'bg-indigo-900/30 text-indigo-200 border-indigo-700' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}
                    >
                      Right: {languageLabel(rightLanguage)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 items-center">
                    <label className="text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.ignoreWhitespace}
                        onChange={(e) => updateOption('ignoreWhitespace', e.target.checked)}
                      />
                      Ignore whitespace
                    </label>
                    <label className="text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.ignoreCase}
                        onChange={(e) => updateOption('ignoreCase', e.target.checked)}
                      />
                      Ignore case
                    </label>
                    <label className="text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.showOnlyChanges}
                        onChange={(e) => updateOption('showOnlyChanges', e.target.checked)}
                      />
                      Show only changes
                    </label>
                    <label className="text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.wordWrap}
                        onChange={(e) => updateOption('wordWrap', e.target.checked)}
                      />
                      Word wrap
                    </label>
                    <label className="text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                      Code theme
                      <select
                        value={options.codeTheme}
                        onChange={(e) => updateOption('codeTheme', e.target.value)}
                        className={`px-2 py-1 rounded border text-sm ${
                          isDarkTheme
                            ? 'bg-gray-800 border-gray-600 text-gray-100'
                            : 'bg-white border-gray-300 text-gray-800'
                        }`}
                      >
                        {Object.entries(CODE_THEME_PRESETS).map(([themeKey, themeValue]) => (
                          <option key={themeKey} value={themeKey}>
                            {themeValue.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        type="button"
                        onClick={() => navigateChange('prev')}
                        className="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateChange('next')}
                        className="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        Next
                      </button>
                      <span className="text-xs text-gray-600 dark:text-gray-300 px-2">
                        {changeRowIndexes.length ? activeChangePointer + 1 : 0}/{changeRowIndexes.length} changes
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => updateOption('viewMode', 'split')}
                      className={`px-3 py-1 text-sm rounded ${
                        options.viewMode === 'split' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      Split View
                    </button>
                    <button
                      type="button"
                      onClick={() => updateOption('viewMode', 'unified')}
                      className={`px-3 py-1 text-sm rounded ${
                        options.viewMode === 'unified' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      Unified View
                    </button>
                    <button
                      type="button"
                      onClick={compare}
                      className="px-3 py-1 text-sm rounded bg-purple-600 text-white"
                    >
                      Re-Compare
                    </button>
                  </div>
                </div>

                {options.viewMode === 'split' ? (
                  <div className="grid grid-cols-1 xl:grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
                    <div>
                      <div
                        className="sticky top-0 z-10 px-4 py-2 text-sm font-semibold border-b border-gray-200 dark:border-gray-700"
                        style={codeHeaderStyle}
                      >
                        {leftTitle || 'Left'}
                      </div>
                      <div
                        ref={leftScrollRef}
                        onScroll={() => syncScroll('left')}
                        className="max-h-[560px] overflow-auto"
                        style={{ fontFamily: 'Consolas, Monaco, monospace', ...codeSurfaceStyle }}
                      >
                        {visibleRows.map((row, rowIndex) => (
                          <div
                            key={`left-${rowIndex}`}
                            data-split-left-row={rowIndex}
                            className={`flex text-xs border-b border-gray-200 dark:border-gray-800 ${
                              getActiveRowClass(rowIndex, row.kind)
                            } ${getRowClass(row.kind, 'left')}`}
                          >
                            <div
                              className={`w-14 flex-shrink-0 px-2 py-1 text-right border-r border-gray-200 dark:border-gray-700 ${
                                rowIndex === activeVisibleRowIndex && row.kind !== 'unchanged'
                                  ? 'font-bold text-blue-700 dark:text-blue-300'
                                  : 'text-gray-500'
                              }`}
                              style={codeGutterStyle}
                            >
                              {row.leftLineNumber || ''}
                            </div>
                            <div className={`flex-1 px-3 py-1 ${options.wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}`}>
                              {row.kind === 'added' ? <span className="text-gray-400"> </span> : renderInlineDiff(row, 'left', rowIndex)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div
                        className="sticky top-0 z-10 px-4 py-2 text-sm font-semibold border-b border-gray-200 dark:border-gray-700"
                        style={codeHeaderStyle}
                      >
                        {rightTitle || 'Right'}
                      </div>
                      <div
                        ref={rightScrollRef}
                        onScroll={() => syncScroll('right')}
                        className="max-h-[560px] overflow-auto"
                        style={{ fontFamily: 'Consolas, Monaco, monospace', ...codeSurfaceStyle }}
                      >
                        {visibleRows.map((row, rowIndex) => (
                          <div
                            key={`right-${rowIndex}`}
                            data-split-right-row={rowIndex}
                            className={`flex text-xs border-b border-gray-200 dark:border-gray-800 ${
                              getActiveRowClass(rowIndex, row.kind)
                            } ${getRowClass(row.kind, 'right')}`}
                          >
                            <div
                              className={`w-14 flex-shrink-0 px-2 py-1 text-right border-r border-gray-200 dark:border-gray-700 ${
                                rowIndex === activeVisibleRowIndex && row.kind !== 'unchanged'
                                  ? 'font-bold text-blue-700 dark:text-blue-300'
                                  : 'text-gray-500'
                              }`}
                              style={codeGutterStyle}
                            >
                              {row.rightLineNumber || ''}
                            </div>
                            <div className={`flex-1 px-3 py-1 ${options.wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}`}>
                              {row.kind === 'removed' ? <span className="text-gray-400"> </span> : renderInlineDiff(row, 'right', rowIndex)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    ref={unifiedScrollRef}
                    className="max-h-[560px] overflow-auto"
                    style={{ fontFamily: 'Consolas, Monaco, monospace', ...codeSurfaceStyle }}
                  >
                    {visibleRows.map((row, rowIndex) => (
                      <div
                        key={`unified-${rowIndex}`}
                        data-unified-row={rowIndex}
                        className={`text-xs border-b border-gray-200 dark:border-gray-800 ${
                          getActiveRowClass(rowIndex, row.kind)
                        } ${
                          row.kind === 'added'
                            ? isDarkTheme
                              ? 'bg-green-950/40'
                              : 'bg-green-50'
                            : row.kind === 'removed'
                            ? isDarkTheme
                              ? 'bg-red-950/40'
                              : 'bg-red-50'
                            : row.kind === 'modified'
                            ? isDarkTheme
                              ? 'bg-amber-900/20'
                              : 'bg-amber-50'
                            : isDarkTheme
                            ? 'bg-gray-900'
                            : 'bg-white'
                        }`}
                      >
                        {row.kind === 'modified' ? (
                          <>
                            <div className="flex">
                              <div
                                className="w-14 px-2 py-1 text-right text-gray-500 border-r border-gray-200 dark:border-gray-700"
                                style={codeGutterStyle}
                              >
                                {row.leftLineNumber}
                              </div>
                              <div className="w-8 px-2 py-1 text-red-600 dark:text-red-300">-</div>
                              <div className={`flex-1 px-2 py-1 ${options.wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}`}>
                                {renderInlineDiff(row, 'left', rowIndex)}
                              </div>
                            </div>
                            <div className="flex border-t border-gray-200 dark:border-gray-700">
                              <div
                                className="w-14 px-2 py-1 text-right text-gray-500 border-r border-gray-200 dark:border-gray-700"
                                style={codeGutterStyle}
                              >
                                {row.rightLineNumber}
                              </div>
                              <div className="w-8 px-2 py-1 text-green-600 dark:text-green-300">+</div>
                              <div className={`flex-1 px-2 py-1 ${options.wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}`}>
                                {renderInlineDiff(row, 'right', rowIndex)}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex">
                            <div
                              className="w-14 px-2 py-1 text-right text-gray-500 border-r border-gray-200 dark:border-gray-700"
                              style={codeGutterStyle}
                            >
                              {row.leftLineNumber ?? row.rightLineNumber ?? ''}
                            </div>
                            <div
                              className={`w-8 px-2 py-1 ${
                                row.kind === 'added'
                                  ? 'text-green-600 dark:text-green-300'
                                  : row.kind === 'removed'
                                  ? 'text-red-600 dark:text-red-300'
                                  : 'text-gray-400'
                              }`}
                            >
                              {row.kind === 'added' ? '+' : row.kind === 'removed' ? '-' : ' '}
                            </div>
                            <div className={`flex-1 px-2 py-1 ${options.wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}`}>
                              {row.kind === 'added'
                                ? renderHighlightedText(row.rightText, rightLanguage, `unified-right-${rowIndex}`)
                                : renderHighlightedText(row.leftText, leftLanguage, `unified-left-${rowIndex}`)}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {showDiff && aiExplainResult && (
              <section className="mt-5 rounded-lg border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300">AI Diff Explainer</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs px-2 py-1 border rounded-full ${getRiskClass(aiExplainResult.overview?.riskLevel)}`}>
                      Risk {aiExplainResult.overview?.riskLevel || 'unknown'}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-indigo-600 text-white">
                      Confidence {aiExplainResult.overview?.confidence || 0}%
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      Provider {aiExplainResult.provider?.mode || 'heuristic'}
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{aiExplainResult.overview?.summary}</p>

                <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <article className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-4">
                    <h4 className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">Risk Signals</h4>
                    <ul className="mt-3 space-y-2">
                      {(aiExplainResult.riskSignals || []).map((signal) => (
                        <li key={signal.label} className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">{signal.label}:</span> {signal.reason}
                        </li>
                      ))}
                    </ul>
                  </article>

                  <article className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-4">
                    <h4 className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">Recommended Checks</h4>
                    <ul className="mt-3 space-y-2">
                      {(aiExplainResult.recommendedChecks || []).map((item) => (
                        <li key={item} className="text-sm text-gray-700 dark:text-gray-300">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </article>

                  <article className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-4">
                    <h4 className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">Diff Metrics</h4>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded border border-gray-200 dark:border-gray-700 px-2 py-1">Added: {aiExplainResult.metrics?.added ?? 0}</div>
                      <div className="rounded border border-gray-200 dark:border-gray-700 px-2 py-1">Removed: {aiExplainResult.metrics?.removed ?? 0}</div>
                      <div className="rounded border border-gray-200 dark:border-gray-700 px-2 py-1">Modified: {aiExplainResult.metrics?.modified ?? 0}</div>
                      <div className="rounded border border-gray-200 dark:border-gray-700 px-2 py-1">Similarity: {aiExplainResult.metrics?.similarity ?? 0}%</div>
                    </div>
                  </article>
                </div>

                <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <article className="rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 p-4">
                    <h4 className="text-xs uppercase tracking-wide font-semibold text-blue-700 dark:text-blue-300">Suggested Tools</h4>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(aiExplainResult.suggestedTools || []).map((tool) => (
                        <Link
                          key={tool.path}
                          to={tool.path}
                          onClick={() =>
                            trackEvent('ai_diff_explain_tool_click', {
                              target_tool: tool.path
                            })
                          }
                          className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-xs font-semibold hover:border-blue-500"
                        >
                          {tool.name}
                        </Link>
                      ))}
                    </div>
                  </article>

                  <article className="rounded-lg border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 p-4">
                    <h4 className="text-xs uppercase tracking-wide font-semibold text-indigo-700 dark:text-indigo-300">Suggested Workflows</h4>
                    <div className="mt-3 space-y-2">
                      {(aiExplainResult.suggestedWorkflows || []).map((workflow) => (
                        <Link
                          key={workflow.slug}
                          to={workflow.path}
                          onClick={() =>
                            trackEvent('ai_diff_explain_workflow_click', {
                              target_workflow: workflow.slug
                            })
                          }
                          className="block rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-800 p-3 hover:border-indigo-400"
                        >
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{workflow.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">{workflow.description}</p>
                        </Link>
                      ))}
                    </div>
                  </article>

                  <article className="rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4">
                    <h4 className="text-xs uppercase tracking-wide font-semibold text-amber-700 dark:text-amber-300">Related Problems</h4>
                    <div className="mt-3 space-y-2">
                      {(aiExplainResult.suggestedProblems || []).map((problem) => (
                        <Link
                          key={problem.slug}
                          to={problem.path}
                          onClick={() =>
                            trackEvent('ai_diff_explain_problem_click', {
                              target_problem: problem.slug
                            })
                          }
                          className="block rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-slate-800 p-3 hover:border-amber-400"
                        >
                          <p className="text-xs text-gray-500 dark:text-gray-400">{problem.category}</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{problem.title}</p>
                        </Link>
                      ))}
                    </div>
                  </article>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileCompare;
