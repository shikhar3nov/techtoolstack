const fs = require('fs');
const path = require('path');
const { completeJson } = require('./aiProvider.service');

const dataRoot = path.join(__dirname, '../../frontend/src/data');

const TOOL_NAME_BY_PATH = {
  '/ai-prompt-generator': 'AI Prompt Generator',
  '/ai-error-router': 'AI Error Router',
  '/json-formatter': 'JSON Formatter',
  '/file-compare': 'File Compare',
  '/regex-tester': 'Regular Expression Tester',
  '/base64': 'Base64 Encode/Decode',
  '/json-encode-decode': 'JSON Encode/Decode',
  '/jwt-decoder': 'JWT Decoder',
  '/url-encoder-decoder': 'URL Encoder/Decoder',
  '/timestamp-converter': 'Unix Timestamp Converter',
  '/hash-generator': 'Hash Generator'
};

const readJson = (filename, fallback = []) => {
  try {
    const raw = fs.readFileSync(path.join(dataRoot, filename), 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const workflowList = readJson('workflows.json', []);
const problemList = readJson('problemPlaybooks.json', []);
const blogList = readJson('blogPosts.json', []);

const workflowBySlug = workflowList.reduce((acc, item) => {
  acc[item.slug] = item;
  return acc;
}, {});

const problemBySlug = problemList.reduce((acc, item) => {
  acc[item.slug] = item;
  return acc;
}, {});

const blogBySlug = blogList.reduce((acc, item) => {
  acc[item.slug] = item;
  return acc;
}, {});

const PATTERN_LIBRARY = [
  {
    id: 'cors_auth_failure',
    label: 'CORS/Auth Integration Failure',
    role: 'frontend',
    workflowSlug: 'cors-and-auth-integration-workflow',
    problemSlug: 'cors-policy-blocked-request',
    fallbackWorkflowSlug: 'api-debug-workflow',
    relatedGuideSlugs: ['how-to-fix-cors-errors-in-react-and-node', 'decode-jwt-safely-in-frontend-applications'],
    tools: ['/url-encoder-decoder', '/json-formatter', '/jwt-decoder', '/file-compare'],
    likelyCauses: [
      'Access-Control headers differ between environments.',
      'Preflight request handling is missing or blocked.',
      'Credentialed requests are combined with wildcard origin policy.'
    ],
    immediateActions: [
      'Capture browser network/preflight response headers for failing request.',
      'Compare working and failing middleware/config snapshots line-by-line.',
      'Validate token expiry and audience claims if 401/403 appears with CORS errors.'
    ],
    signals: [
      { regex: /(blocked by cors policy|access-control-allow-origin|preflight|has been blocked by cors)/gi, weight: 5 },
      { regex: /\b(401|403)\b/gi, weight: 1 },
      { regex: /(unauthorized|forbidden|token)/gi, weight: 1 }
    ]
  },
  {
    id: 'json_parse_failure',
    label: 'JSON Parse Failure',
    role: 'frontend',
    workflowSlug: 'api-debug-workflow',
    problemSlug: 'json-parse-unexpected-token',
    relatedGuideSlugs: [
      'how-to-format-json-in-react-without-breaking-data',
      'json-stringify-vs-json-parse-practical-debugging-guide'
    ],
    tools: ['/json-formatter', '/json-encode-decode', '/file-compare'],
    likelyCauses: [
      'Malformed JSON (missing comma/quote/bracket) from upstream service.',
      'Double-encoded JSON string treated as object payload.',
      'Unexpected character encoding or escaped sequence.'
    ],
    immediateActions: [
      'Validate raw payload in JSON formatter before app parsing.',
      'Decode nested escaped content once, then re-check object shape.',
      'Compare known-good and failing payloads to isolate exact drift.'
    ],
    signals: [
      { regex: /(unexpected token|json at position|invalid json|json parse|syntaxerror)/gi, weight: 5 },
      { regex: /(malformed|cannot parse|parse error)/gi, weight: 2 }
    ]
  },
  {
    id: 'jwt_token_failure',
    label: 'JWT Token Failure',
    role: 'security',
    workflowSlug: 'security-token-diagnostics-workflow',
    problemSlug: 'jwt-expired-or-invalid-signature',
    fallbackWorkflowSlug: 'cors-and-auth-integration-workflow',
    relatedGuideSlugs: ['decode-jwt-safely-in-frontend-applications'],
    tools: ['/jwt-decoder', '/base64', '/hash-generator', '/file-compare'],
    likelyCauses: [
      'Token expiration window mismatch or system clock skew.',
      'Signing key/algorithm mismatch across environments.',
      'Token transport corruption during encoding/decoding.'
    ],
    immediateActions: [
      'Decode token and inspect exp/iat/aud claims.',
      'Cross-check signing configuration between environments.',
      'Compare auth config revisions near incident start time.'
    ],
    signals: [
      { regex: /(jwt expired|invalid signature|token malformed|invalid token|bearer)/gi, weight: 5 },
      { regex: /\b(401|403)\b/gi, weight: 2 },
      { regex: /(auth|authorization|session)/gi, weight: 1 }
    ]
  },
  {
    id: 'regex_validation_failure',
    label: 'Regex Validation Failure',
    role: 'qa',
    workflowSlug: 'release-readiness-diff-workflow',
    problemSlug: 'regex-not-matching-expected-inputs',
    relatedGuideSlugs: ['regex-tester-workflow-for-form-validation'],
    tools: ['/regex-tester', '/file-compare'],
    likelyCauses: [
      'Incorrect anchors/flags causing false positive or false negative matches.',
      'Pattern quantifier boundaries too permissive or restrictive.',
      'Runtime flavor mismatch between test and production.'
    ],
    immediateActions: [
      'Run failing sample set against current regex with explicit flags.',
      'Diff previous and current pattern versions to isolate behavior change.',
      'Add edge-case test corpus before releasing new pattern.'
    ],
    signals: [
      { regex: /(regex|regular expression|pattern)/gi, weight: 4 },
      { regex: /(not matching|validation failed|does not match|invalid format)/gi, weight: 3 }
    ]
  },
  {
    id: 'url_encoding_failure',
    label: 'URL Encoding Failure',
    role: 'backend',
    workflowSlug: 'api-debug-workflow',
    problemSlug: 'url-encoding-breaking-api-request',
    relatedGuideSlugs: ['url-encoding-best-practices-for-api-testing'],
    tools: ['/url-encoder-decoder', '/file-compare', '/json-formatter'],
    likelyCauses: [
      'Double encoding or decoding at mismatched boundary.',
      'Special characters in query/path segments are not encoded consistently.',
      'Signed URLs were modified after signature creation.'
    ],
    immediateActions: [
      'Encode/decode problematic parameter values and inspect differences.',
      'Compare working and failing request URLs character-by-character.',
      'Standardize request URL construction in a shared helper.'
    ],
    signals: [
      { regex: /(url encoding|percent-encoding|malformed url|urierror|bad request)/gi, weight: 4 },
      { regex: /(query parameter|signature mismatch|request uri)/gi, weight: 2 }
    ]
  },
  {
    id: 'hash_integrity_failure',
    label: 'Hash Integrity Failure',
    role: 'security',
    workflowSlug: 'data-integrity-release-workflow',
    problemSlug: 'hash-mismatch-after-file-transfer',
    relatedGuideSlugs: ['base64-encoding-for-api-payloads-and-images'],
    tools: ['/hash-generator', '/file-compare'],
    likelyCauses: [
      'Artifact changed during transfer or packaging.',
      'Different hash algorithm used between producer and verifier.',
      'Line-ending normalization altered file bytes.'
    ],
    immediateActions: [
      'Generate hash from source and destination artifacts using same algorithm.',
      'Diff content versions to locate changed segments.',
      'Lock hash algorithm and newline policy in release pipeline.'
    ],
    signals: [
      { regex: /(hash mismatch|checksum mismatch|integrity check failed|sha256|md5|sha1)/gi, weight: 5 }
    ]
  },
  {
    id: 'timestamp_timezone_failure',
    label: 'Timestamp/Timezone Failure',
    role: 'backend',
    workflowSlug: 'data-integrity-release-workflow',
    problemSlug: 'timestamp-timezone-mismatch',
    relatedGuideSlugs: ['unix-timestamp-debugging-across-time-zones'],
    tools: ['/timestamp-converter', '/json-formatter', '/file-compare'],
    likelyCauses: [
      'Seconds/milliseconds mismatch in timestamp processing.',
      'Timezone conversion applied multiple times.',
      'UTC/local assumptions differ across systems.'
    ],
    immediateActions: [
      'Convert affected timestamps in UTC and local timezone side-by-side.',
      'Inspect payload transforms where timestamp is rewritten.',
      'Add edge-case tests for timezone and DST boundaries.'
    ],
    signals: [
      { regex: /(timestamp|epoch|timezone|utc|local time|date conversion)/gi, weight: 4 },
      { regex: /(expired early|late|wrong date|wrong time)/gi, weight: 2 }
    ]
  }
];

const dedupe = (items) => [...new Set(items.filter(Boolean))];

const toSeverity = (text) => {
  if (/(critical|fatal|panic|security breach|data loss|sev1|outage|500 internal)/i.test(text)) return 'high';
  if (/(error|exception|failed|401|403|400|timeout)/i.test(text)) return 'medium';
  return 'low';
};

const scorePattern = (pattern, text) => {
  let score = 0;
  const matchedSignals = [];

  pattern.signals.forEach((signal) => {
    const matches = text.match(signal.regex);
    if (!matches) return;
    const weighted = matches.length * signal.weight;
    score += weighted;
    matchedSignals.push({
      phrase: matches[0],
      count: matches.length,
      weight: signal.weight
    });
  });

  return {
    score,
    matchedSignals
  };
};

const selectWorkflow = (pattern) => {
  const workflow =
    workflowBySlug[pattern.workflowSlug] ||
    workflowBySlug[pattern.fallbackWorkflowSlug] ||
    workflowList[0] ||
    null;

  if (!workflow) return null;

  return {
    slug: workflow.slug,
    title: workflow.title,
    description: workflow.description,
    path: `/workflows/${workflow.slug}`
  };
};

const selectProblems = (pattern, maxRecommendations) => {
  const primaryProblem = problemBySlug[pattern.problemSlug];
  const fallback = problemList.filter((item) => item.category?.toLowerCase().includes('error')).slice(0, maxRecommendations);

  const list = primaryProblem ? [primaryProblem, ...fallback] : fallback;

  return dedupe(list.map((item) => item?.slug))
    .slice(0, maxRecommendations)
    .map((slug) => problemBySlug[slug])
    .filter(Boolean)
    .map((item) => ({
      slug: item.slug,
      title: item.title,
      category: item.category,
      errorSignature: item.errorSignature,
      path: `/problems/${item.slug}`
    }));
};

const selectGuides = (pattern, toolPaths, maxRecommendations) => {
  const guidePool = [
    ...pattern.relatedGuideSlugs.map((slug) => blogBySlug[slug]).filter(Boolean),
    ...blogList.filter(
      (post) => toolPaths.includes(post.primaryTool) || (post.secondaryTools || []).some((toolPath) => toolPaths.includes(toolPath))
    )
  ];

  return dedupe(guidePool.map((item) => item?.slug))
    .slice(0, maxRecommendations)
    .map((slug) => blogBySlug[slug])
    .filter(Boolean)
    .map((item) => ({
      slug: item.slug,
      title: item.title,
      category: item.category,
      readTime: item.readTime,
      path: `/blog/${item.slug}`
    }));
};

const mapTools = (paths) =>
  dedupe(paths).map((toolPath) => ({
    path: toolPath,
    name: TOOL_NAME_BY_PATH[toolPath] || toolPath
  }));

const toShortText = (value, max = 160) => {
  if (!value || typeof value !== 'string') return '';
  return value.length > max ? `${value.slice(0, max)}...` : value;
};

const augmentWithProvider = async ({ incidentText, contextText, baseline }) => {
  const completion = await completeJson({
    systemPrompt:
      'You are an incident triage assistant. Return compact JSON only with keys: summary, likely_causes (array <=4), immediate_actions (array <=4), confidence_adjustment (number between -0.15 and 0.15).',
    userPayload: {
      incident: toShortText(incidentText, 2000),
      context: toShortText(contextText, 1200),
      baseline
    },
    temperature: 0.1
  });

  if (!completion.data || completion.mode === 'heuristic') {
    return { mode: 'heuristic', providerError: completion.error || null };
  }

  const parsed = completion.data;
  return {
    mode: completion.mode,
    model: completion.model,
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    likelyCauses: Array.isArray(parsed.likely_causes)
      ? parsed.likely_causes.slice(0, 4).map((item) => toShortText(item, 160))
      : [],
    immediateActions: Array.isArray(parsed.immediate_actions)
      ? parsed.immediate_actions.slice(0, 4).map((item) => toShortText(item, 160))
      : [],
    confidenceAdjustment:
      typeof parsed.confidence_adjustment === 'number'
        ? Math.max(-0.15, Math.min(0.15, parsed.confidence_adjustment))
        : 0
  };
};

const generateRequestId = () =>
  `air_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const routeErrorIncident = async (payload = {}) => {
  const incidentText = toShortText(payload.errorText || '', 50000);
  const contextText = toShortText(payload.context || '', 8000);
  const environment = toShortText(payload.environment || '', 64) || 'unknown';
  const roleHint = toShortText(payload.roleHint || '', 64).toLowerCase();
  const maxRecommendations = Math.min(Math.max(Number(payload.maxRecommendations || 3), 1), 5);

  const searchableText = `${incidentText}\n${contextText}\n${environment}`.toLowerCase();

  const scored = PATTERN_LIBRARY.map((pattern) => {
    const scoreInfo = scorePattern(pattern, searchableText);
    let roleBonus = 0;
    if (roleHint && roleHint === pattern.role) {
      roleBonus = 2;
    }
    if (environment.toLowerCase() === 'production' && pattern.id.includes('security')) {
      roleBonus += 1;
    }

    return {
      pattern,
      score: scoreInfo.score + roleBonus,
      matchedSignals: scoreInfo.matchedSignals
    };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0] && scored[0].score > 0 ? scored[0] : null;
  const fallbackPattern = PATTERN_LIBRARY.find((item) => item.id === 'json_parse_failure') || PATTERN_LIBRARY[0];
  const selected = best ? best.pattern : fallbackPattern;
  const selectedSignals = best ? best.matchedSignals : [];

  const workflow = selectWorkflow(selected);
  const toolPaths = dedupe([
    ...selected.tools,
    ...(workflow?.slug ? workflowBySlug[workflow.slug]?.primaryTools || [] : [])
  ]);
  const tools = mapTools(toolPaths).slice(0, maxRecommendations + 2);
  const relatedProblems = selectProblems(selected, maxRecommendations);
  const relatedGuides = selectGuides(selected, toolPaths, maxRecommendations);

  const totalScore = scored.reduce((acc, item) => acc + Math.max(item.score, 0), 0);
  const baselineConfidence = best ? Math.max(0.45, Math.min(0.95, best.score / Math.max(totalScore, best.score))) : 0.42;

  const baselineOutput = {
    incident: {
      category: selected.id,
      label: selected.label,
      severity: toSeverity(searchableText),
      role: roleHint || selected.role,
      confidence: Number((baselineConfidence * 100).toFixed(1)),
      matchedSignals: selectedSignals.map((signal) => signal.phrase).slice(0, 5)
    },
    recommendedWorkflow: workflow,
    recommendedTools: tools,
    likelyCauses: selected.likelyCauses.slice(0, maxRecommendations + 1),
    immediateActions: selected.immediateActions.slice(0, maxRecommendations + 1),
    relatedProblems,
    relatedGuides
  };

  const providerAugmentation = await augmentWithProvider({
    incidentText,
    contextText,
    baseline: baselineOutput
  });

  const confidenceWithProvider =
    providerAugmentation.mode !== 'heuristic'
      ? Math.max(
          0.35,
          Math.min(0.98, baselineConfidence + (providerAugmentation.confidenceAdjustment || 0))
        )
      : baselineConfidence;

  return {
    requestId: generateRequestId(),
    generatedAt: new Date().toISOString(),
    provider: {
      mode: providerAugmentation.mode,
      model: providerAugmentation.model || null,
      providerError: providerAugmentation.providerError || null
    },
    incident: {
      ...baselineOutput.incident,
      confidence: Number((confidenceWithProvider * 100).toFixed(1))
    },
    summary:
      providerAugmentation.summary ||
      `Detected ${baselineOutput.incident.label} in ${environment} context. Run the recommended workflow to validate root cause and prevent repeat regressions.`,
    recommendedWorkflow: baselineOutput.recommendedWorkflow,
    recommendedTools: baselineOutput.recommendedTools,
    likelyCauses:
      providerAugmentation.likelyCauses?.length > 0
        ? providerAugmentation.likelyCauses
        : baselineOutput.likelyCauses,
    immediateActions:
      providerAugmentation.immediateActions?.length > 0
        ? providerAugmentation.immediateActions
        : baselineOutput.immediateActions,
    relatedProblems: baselineOutput.relatedProblems,
    relatedGuides: baselineOutput.relatedGuides,
    workspaceSeed: {
      role: baselineOutput.incident.role,
      sourceWorkflow: baselineOutput.recommendedWorkflow?.slug || null,
      sourceProblem: baselineOutput.relatedProblems[0]?.slug || null,
      suggestedTools: baselineOutput.recommendedTools.map((item) => item.path).slice(0, 5),
      suggestedTags: dedupe([
        baselineOutput.incident.category,
        environment.toLowerCase(),
        baselineOutput.incident.severity
      ]).slice(0, 5)
    }
  };
};

module.exports = {
  routeErrorIncident
};
