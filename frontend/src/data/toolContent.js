const toolContent = {
  '/ai-prompt-generator': {
    intentTitle: 'Build Higher-Quality AI Prompts Faster',
    summary:
      'Turn rough ideas into structured prompts for technical writing, product requirements, and support automation without rewriting from scratch.',
    useCases: [
      {
        title: 'Engineering Documentation Drafting',
        description:
          'Generate first-pass architecture notes, release summaries, and troubleshooting drafts with consistent tone and structure.'
      },
      {
        title: 'Product Requirement Breakdown',
        description:
          'Convert feature ideas into detailed prompts for acceptance criteria, edge cases, and implementation constraints.'
      },
      {
        title: 'Support Workflow Automation',
        description:
          'Create reusable prompts for ticket triage, response templates, and incident summaries.'
      }
    ],
    faqs: [
      {
        question: 'Does this tool store my prompt data?',
        answer:
          'The prompt generation flow runs in your browser session. Avoid adding secrets or sensitive production data in shared environments.'
      },
      {
        question: 'Can I use this for different AI models?',
        answer:
          'Yes. The output is model-agnostic and can be adapted for ChatGPT, Claude, Gemini, and internal LLM workflows.'
      },
      {
        question: 'How do I improve output quality?',
        answer:
          'Add clear objective, audience, format constraints, and acceptance criteria. Specific context consistently improves model responses.'
      }
    ],
    recommendedToolPaths: ['/json-formatter', '/file-compare']
  },
  '/ai-error-router': {
    intentTitle: 'Route Incidents To Actionable Engineering Workflows',
    summary:
      'Use AI-assisted triage to map raw errors and logs into the right workflow, tools, likely causes, and immediate action plan.',
    useCases: [
      {
        title: 'Production Incident Triage',
        description:
          'Convert unclear error logs into a deterministic next-step workflow for frontend, backend, QA, or security teams.'
      },
      {
        title: 'Release Regression Investigation',
        description:
          'Detect likely root-cause categories quickly and route teams to focused debugging tools.'
      },
      {
        title: 'On-Call Handoff Standardization',
        description:
          'Generate a structured incident summary with recommended actions for cleaner team handoffs.'
      }
    ],
    faqs: [
      {
        question: 'Does this replace engineering diagnosis?',
        answer:
          'No. It accelerates triage by proposing likely categories and workflows, but teams should verify with logs, tests, and code-level analysis.'
      },
      {
        question: 'Can it work without external AI keys?',
        answer:
          'Yes. The router includes deterministic heuristics by default, with optional provider mode when API keys are configured.'
      },
      {
        question: 'What should I paste for best results?',
        answer:
          'Include exact error signatures, stack trace snippets, environment details, and recent deployment context for higher confidence routing.'
      }
    ],
    recommendedToolPaths: ['/file-compare', '/json-formatter', '/json-encode-decode']
  },
  '/ai-json-contract-assistant': {
    intentTitle: 'Detect JSON Contract Drift Before It Breaks Production',
    summary:
      'Use AI-assisted contract analysis to compare baseline and candidate payloads, classify compatibility risk, and plan safe migration steps.',
    useCases: [
      {
        title: 'API Version Rollout Safety',
        description:
          'Validate whether payload shape changes are compatible before publishing a new API version.'
      },
      {
        title: 'Cross-Team Contract Governance',
        description:
          'Give frontend, backend, QA, and security teams one shared compatibility report with priority paths.'
      },
      {
        title: 'Release Readiness Review',
        description:
          'Generate migration steps, risk signals, and test payloads to reduce regression during deployments.'
      }
    ],
    faqs: [
      {
        question: 'Is this analysis deterministic?',
        answer:
          'Core schema drift detection is deterministic. Optional AI provider mode augments explanation depth without replacing structural checks.'
      },
      {
        question: 'Will it detect breaking changes automatically?',
        answer:
          'Yes. Removed paths and high-severity type shifts are flagged as breaking risk with migration guidance.'
      },
      {
        question: 'Can I run it without paid AI APIs?',
        answer:
          'Yes. The assistant works with heuristic mode by default and supports optional local/free providers like Ollama.'
      }
    ],
    recommendedToolPaths: ['/file-compare', '/json-formatter', '/json-encode-decode', '/ai-error-router']
  },
  '/json-formatter': {
    intentTitle: 'Format and Validate Structured Data Without Breaking Payloads',
    summary:
      'Use deterministic formatting and validation to reduce parse errors, improve readability, and make pull-request reviews faster.',
    useCases: [
      {
        title: 'API Payload Debugging',
        description:
          'Validate inbound and outbound JSON before test execution to catch malformed payloads early.'
      },
      {
        title: 'PR Diff Hygiene',
        description:
          'Normalize indentation and ordering so code reviewers can focus on semantic changes instead of formatting noise.'
      },
      {
        title: 'Cross-Team Data Contracts',
        description:
          'Share canonical formatted examples between frontend, backend, and QA teams to align implementation behavior.'
      }
    ],
    faqs: [
      {
        question: 'Can I format only JSON with this tool?',
        answer:
          'No. The formatter also supports XML, HTML, SQL, CSS, JavaScript, and YAML in the same workflow.'
      },
      {
        question: 'Will formatting change data values?',
        answer:
          'Formatting changes structure and spacing only. Values remain the same when the source content is valid.'
      },
      {
        question: 'Why do I see validation errors?',
        answer:
          'Validation errors usually indicate missing quotes, commas, brackets, or invalid tokens in the input payload.'
      }
    ],
    recommendedToolPaths: ['/json-encode-decode', '/file-compare']
  },
  '/file-compare': {
    intentTitle: 'Compare Files with Review-Grade Precision',
    summary:
      'Analyze text and code changes in split or unified view, navigate differences quickly, and use AI diff explanation to prioritize risky changes.',
    useCases: [
      {
        title: 'Code Review Triage',
        description:
          'Inspect only changed lines, jump across diffs, and isolate risky edits before approving pull requests.'
      },
      {
        title: 'AI-Assisted Diff Risk Review',
        description:
          'Generate AI summary, risk signals, and recommended checks for faster release and rollback decisions.'
      },
      {
        title: 'Configuration Drift Detection',
        description:
          'Compare environment configs and deployment files to catch silent differences before release.'
      },
      {
        title: 'Content Revision Audits',
        description:
          'Track wording, policy, or copy changes across document versions with clear visual diffs.'
      }
    ],
    faqs: [
      {
        question: 'Can I ignore case and whitespace while comparing?',
        answer:
          'Yes. Enable ignore-case and ignore-whitespace options to focus on meaningful content differences.'
      },
      {
        question: 'Does the tool support file uploads and pasted text?',
        answer:
          'Yes. You can compare uploaded files or direct text input in the same interface.'
      },
      {
        question: 'How do I review only changed lines?',
        answer:
          'Enable the show-only-changes option, then use next and previous navigation to step through each change block.'
      }
    ],
    recommendedToolPaths: ['/json-formatter', '/regex-tester']
  },
  '/regex-tester': {
    intentTitle: 'Validate Regex Patterns Before They Reach Production',
    summary:
      'Test regular expressions against real-world samples, reduce false positives, and maintain validation logic with lower support cost.',
    useCases: [
      {
        title: 'Form Validation QA',
        description:
          'Stress-test email, phone, and ID patterns with edge-case examples before deployment.'
      },
      {
        title: 'Data Extraction Rules',
        description:
          'Verify capture groups and matching behavior for logs, tokens, and structured text parsing.'
      },
      {
        title: 'Pattern Change Review',
        description:
          'Compare revised patterns and evaluate downstream match impact before merging.'
      }
    ],
    faqs: [
      {
        question: 'Why does my regex work locally but fail in production?',
        answer:
          'Differences in regex flavor, flags, and unicode handling between runtimes commonly cause inconsistent behavior.'
      },
      {
        question: 'Can I inspect matched groups?',
        answer:
          'Yes. The results section exposes matches and captured groups so you can validate extraction logic quickly.'
      },
      {
        question: 'Should regex be used for all validation?',
        answer:
          'Use regex for pattern checks, but combine with business-rule validation for high-risk fields and compliance workflows.'
      }
    ],
    recommendedToolPaths: ['/file-compare', '/url-encoder-decoder']
  },
  '/base64': {
    intentTitle: 'Encode and Decode Base64 Reliably',
    summary:
      'Convert strings and files between raw text and Base64 for APIs, tokens, and data transfer workflows.',
    useCases: [
      {
        title: 'API Payload Encoding',
        description:
          'Encode binary or structured content into transport-safe text for API requests.'
      },
      {
        title: 'Token and Header Debugging',
        description:
          'Decode Base64 segments from auth tokens and inspect values during troubleshooting.'
      },
      {
        title: 'Data Portability',
        description:
          'Package and move content between systems that require Base64-compatible input.'
      }
    ],
    faqs: [
      {
        question: 'Is Base64 encryption?',
        answer:
          'No. Base64 is an encoding format, not encryption. Sensitive data still requires proper encryption controls.'
      },
      {
        question: 'Can I upload files for encoding?',
        answer:
          'Yes. The tool supports file upload workflows in addition to plain text encoding and decoding.'
      },
      {
        question: 'Why is output larger after encoding?',
        answer:
          'Base64 adds overhead by representing binary data in text-safe characters, which increases total size.'
      }
    ],
    recommendedToolPaths: ['/jwt-decoder', '/url-encoder-decoder']
  },
  '/json-encode-decode': {
    intentTitle: 'Safely Encode and Decode JSON Strings',
    summary:
      'Handle escaped JSON payloads, avoid double-encoding bugs, and convert data into readable or transport-safe formats.',
    useCases: [
      {
        title: 'Escaped Payload Debugging',
        description:
          'Decode nested JSON strings returned by logs, queues, or external APIs.'
      },
      {
        title: 'Data Pipeline Validation',
        description:
          'Encode and decode payloads between service boundaries to verify transformation safety.'
      },
      {
        title: 'Client-Side Error Triage',
        description:
          'Normalize suspicious values and inspect parse-ready output before app rendering.'
      }
    ],
    faqs: [
      {
        question: 'What is the difference between JSON encoding and formatting?',
        answer:
          'Encoding converts values into JSON-safe string representations, while formatting adjusts readability of valid structured content.'
      },
      {
        question: 'Can I pretty-print decoded output?',
        answer:
          'Yes. Enable pretty output to render decoded JSON in readable multi-line format.'
      },
      {
        question: 'How can I avoid double-encoding?',
        answer:
          'Track payload type at each system boundary and encode only raw values that are not already JSON strings.'
      }
    ],
    recommendedToolPaths: ['/json-formatter', '/base64']
  },
  '/jwt-decoder': {
    intentTitle: 'Decode JWT Tokens for Faster Security Debugging',
    summary:
      'Inspect JWT headers and claims for diagnostics, expiration checks, and integration troubleshooting without backend deployment cycles.',
    useCases: [
      {
        title: 'Session Expiry Troubleshooting',
        description:
          'Review `iat` and `exp` claims quickly when users report premature logouts or stale sessions.'
      },
      {
        title: 'Claim Inspection During QA',
        description:
          'Verify payload structure and claim presence in staging before rollout.'
      },
      {
        title: 'Auth Integration Debugging',
        description:
          'Validate header algorithm and token shape when connecting third-party identity providers.'
      }
    ],
    faqs: [
      {
        question: 'Does decoding verify token signature?',
        answer:
          'No. Decoding only reads token content. Signature verification and authorization checks must happen on trusted backend services.'
      },
      {
        question: 'Can I trust decoded roles in frontend code?',
        answer:
          'No. Use decoded claims for UI context only. Access control must be enforced server-side.'
      },
      {
        question: 'What token parts can I inspect?',
        answer:
          'The tool exposes header, payload, and signature segments to support troubleshooting workflows.'
      }
    ],
    recommendedToolPaths: ['/base64', '/hash-generator']
  },
  '/url-encoder-decoder': {
    intentTitle: 'Prevent Broken Requests with Correct URL Encoding',
    summary:
      'Encode and decode URLs and query values safely to avoid malformed requests, integration failures, and test instability.',
    useCases: [
      {
        title: 'API Query Construction',
        description:
          'Encode user input and reserved characters before sending request parameters to backend services.'
      },
      {
        title: 'Integration Debugging',
        description:
          'Decode received URLs to inspect final values and identify double-encoding issues.'
      },
      {
        title: 'QA Scenario Validation',
        description:
          'Test edge cases with spaces, symbols, and unicode to ensure consistent transport behavior.'
      }
    ],
    faqs: [
      {
        question: 'Should I encode the full URL or only parameters?',
        answer:
          'In most cases, encode individual path or query values rather than re-encoding complete URLs that may already contain encoded segments.'
      },
      {
        question: 'Why does `%20` appear in output?',
        answer:
          '`%20` is the encoded representation for spaces in URL-safe format.'
      },
      {
        question: 'Can URL decoding break requests?',
        answer:
          'Decoding at the wrong stage can alter reserved characters and routing behavior. Decode only when inspecting or processing raw encoded values.'
      }
    ],
    recommendedToolPaths: ['/regex-tester', '/json-encode-decode']
  },
  '/timestamp-converter': {
    intentTitle: 'Convert Unix Timestamps with Timezone Clarity',
    summary:
      'Translate epoch values to readable date-time formats and convert date inputs back to timestamps for logs, APIs, and analytics.',
    useCases: [
      {
        title: 'Incident Timeline Analysis',
        description:
          'Convert log timestamps quickly to align events during production incident response.'
      },
      {
        title: 'API Payload Validation',
        description:
          'Verify whether integrations use seconds or milliseconds to avoid date parsing failures.'
      },
      {
        title: 'User-Facing Date Debugging',
        description:
          'Cross-check timezone conversions when local-time displays do not match backend events.'
      }
    ],
    faqs: [
      {
        question: 'How do I know if value is seconds or milliseconds?',
        answer:
          'Milliseconds timestamps are typically 13 digits, while seconds-based timestamps are usually 10 digits.'
      },
      {
        question: 'Can I convert both directions?',
        answer:
          'Yes. The tool supports timestamp-to-date and date-to-timestamp workflows.'
      },
      {
        question: 'Why does my local time differ from UTC?',
        answer:
          'UTC is a global reference standard. Local time reflects your system timezone offset and daylight savings rules.'
      }
    ],
    recommendedToolPaths: ['/json-formatter', '/file-compare']
  },
  '/hash-generator': {
    intentTitle: 'Generate Hashes for Integrity and Debug Workflows',
    summary:
      'Create MD5, SHA-1, SHA-256, and SHA-512 hashes for checksums, content verification, and low-friction debugging workflows.',
    useCases: [
      {
        title: 'Checksum Verification',
        description:
          'Confirm whether files or payloads changed across transfer stages by comparing hash values.'
      },
      {
        title: 'Data Integrity Monitoring',
        description:
          'Track expected hash outputs for critical configuration and reference data.'
      },
      {
        title: 'Security Workflow Support',
        description:
          'Generate stable digests for diagnostics and tooling integrations without manual script execution.'
      }
    ],
    faqs: [
      {
        question: 'Which algorithm should I choose?',
        answer:
          'For stronger modern integrity checks, prefer SHA-256 or SHA-512 over MD5 and SHA-1.'
      },
      {
        question: 'Is hashing the same as encryption?',
        answer:
          'No. Hashing is one-way and is mainly used for integrity checks, while encryption is reversible with keys.'
      },
      {
        question: 'Can two inputs have the same hash?',
        answer:
          'Hash collisions are possible in theory. Stronger algorithms significantly reduce practical collision risk.'
      }
    ],
    recommendedToolPaths: ['/jwt-decoder', '/base64']
  }
};

export const getToolContent = (toolPath) => toolContent[toolPath] || null;

export default toolContent;
