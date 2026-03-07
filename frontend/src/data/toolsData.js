const toolsData = [
  {
    name: 'AI Prompt Generator',
    link: '/ai-prompt-generator',
    description: 'Create optimized prompts for AI assistants by providing basic details about your task',
    icon: '✨',
    isAI: true,
    tags: ['AI', 'prompt', 'create', 'generate'],
  },
  {
    name: 'AI Error Router',
    link: '/ai-error-router',
    description: 'Route errors and incident logs to the best workflow, tools, and fix plan',
    icon: '🤖',
    isAI: true,
    tags: ['AI', 'incident', 'error', 'debug', 'workflow', 'triage']
  },
  {
    name: 'AI JSON Contract Assistant',
    link: '/ai-json-contract-assistant',
    description: 'Analyze JSON schema drift, compatibility risk, and migration-ready rollout checks',
    icon: '🧠',
    isAI: true,
    tags: ['AI', 'json', 'schema', 'contract', 'compatibility', 'drift', 'migration', 'api']
  },
  {
    name: 'JSON Formatter',
    link: '/json-formatter',
    description: 'Format, validate, and process JSON, XML, HTML, SQL, CSS, JavaScript, YAML with Monaco Editor',
    icon: '🛠️',
    tags: ['json', 'xml', 'html', 'sql', 'css', 'javascript', 'yaml', 'formatter', 'beautify', 'viewer'],
  },
  {
    name: 'File Compare',
    link: '/file-compare',
    description: 'Compare text/code side-by-side with AI-powered diff explanation and risk insights',
    icon: '📄',
    tags: ['compare', 'diff', 'text', 'code']
  },
  {
    name: 'Regular Expression Tester',
    link: '/regex-tester',
    description: 'Regular expression testing tool ',
    icon: '📄',
    tags: ['regex', 'Regular', 'expression', 'pattern']
  },
  {
    name: 'Base64 Encode/Decode',
    link: '/base64',
    description: 'Easily encode or decode Base64 strings',
    icon: '🛠️',
    tags: ['base64', 'encode', 'decode'],
  },
  {
    name: 'JSON Encode/Decode',
    link: '/json-encode-decode',
    description: 'Encode and decode JSON-safe strings quickly',
    icon: '🔄',
    tags: ['json', 'encode', 'decode', 'stringify', 'parse'],
  },
  {
    name: 'JWT Decoder',
    link: '/jwt-decoder',
    description: 'Decode JSON Web Tokens easily',
    icon: '🛡️',
    tags: ['jwt', 'decode', 'token'],
  },
  {
    name: 'URL Encoder/Decoder',
    link: '/url-encoder-decoder',
    description: 'Encode or decode URL strings',
    icon: '🔗',
    tags: ['url', 'encode', 'decode'],
  },
  // {
  //   name: 'Text Case Converter',
  //   link: '/case-converter',
  //   description: 'Convert text between UPPERCASE, lowercase, Title Case',
  //   icon: '🔠',
  //   tags: ['text', 'case', 'converter', 'uppercase', 'lowercase'],
  // },
  {
    name: 'Unix Timestamp Converter',
    link: '/timestamp-converter',
    description: 'Convert Unix timestamp to human-readable date and time',
    icon: '⏰',
    tags: ['timestamp', 'unix', 'converter', 'date'],
  },
  {
    name: 'Hash Generator',
    link: '/hash-generator',
    description: 'Generate MD5, SHA1, SHA256 hashes',
    icon: '🔒',
    tags: ['hash', 'md5', 'sha1', 'sha256'],
  },
  // {
  //   name: 'Lorem Ipsum Generator',
  //   link: '/lorem-ipsum',
  //   description: 'Generate random placeholder text (Lorem Ipsum)',
  //   icon: '📄',
  //   tags: ['lorem', 'ipsum', 'text', 'placeholder'],
  // },
];

export default toolsData;
