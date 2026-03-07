const fs = require('fs');
const path = require('path');
const { completeJson } = require('./aiProvider.service');

const dataRoot = path.join(__dirname, '../../frontend/src/data');

const TOOL_NAME_BY_PATH = {
  '/json-formatter': 'JSON Formatter',
  '/file-compare': 'File Compare',
  '/json-encode-decode': 'JSON Encode/Decode',
  '/jwt-decoder': 'JWT Decoder',
  '/url-encoder-decoder': 'URL Encoder/Decoder',
  '/timestamp-converter': 'Unix Timestamp Converter',
  '/hash-generator': 'Hash Generator',
  '/regex-tester': 'Regular Expression Tester'
};

const readJson = (filename, fallback = []) => {
  try {
    const raw = fs.readFileSync(path.join(dataRoot, filename), 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const workflows = readJson('workflows.json', []);
const problems = readJson('problemPlaybooks.json', []);

const workflowBySlug = workflows.reduce((acc, item) => {
  acc[item.slug] = item;
  return acc;
}, {});

const problemBySlug = problems.reduce((acc, item) => {
  acc[item.slug] = item;
  return acc;
}, {});

const dedupe = (items) => [...new Set(items.filter(Boolean))];

const detectType = (value) => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

const toShortText = (value, max = 180) => {
  if (typeof value !== 'string') return '';
  return value.length > max ? `${value.slice(0, max)}...` : value;
};

const toPath = (parent, key) => (parent ? `${parent}.${key}` : key);

const addEntry = (map, key, type, value) => {
  if (!map[key]) {
    map[key] = { types: new Set(), examples: [] };
  }
  map[key].types.add(type);
  if (map[key].examples.length < 2) {
    try {
      map[key].examples.push(JSON.stringify(value).slice(0, 120));
    } catch {
      map[key].examples.push(String(value).slice(0, 120));
    }
  }
};

const walkSchema = (value, parentPath, map, depth = 0) => {
  const type = detectType(value);
  const pathKey = parentPath || '$';
  addEntry(map, pathKey, type, value);

  if (depth > 24) {
    return;
  }

  if (type === 'object') {
    Object.entries(value).forEach(([key, child]) => {
      walkSchema(child, toPath(parentPath, key), map, depth + 1);
    });
  }

  if (type === 'array') {
    const inspected = value.slice(0, 12);
    inspected.forEach((item) => {
      walkSchema(item, `${pathKey}[]`, map, depth + 1);
    });
  }
};

const materializeSchemaMap = (rawMap) =>
  Object.entries(rawMap).reduce((acc, [key, value]) => {
    acc[key] = {
      types: [...value.types].sort(),
      examples: value.examples
    };
    return acc;
  }, {});

const signature = (types) => types.sort().join('|');

const compareSchemas = (base, candidate) => {
  const basePaths = Object.keys(base);
  const candidatePaths = Object.keys(candidate);

  const added = candidatePaths.filter((pathKey) => !base[pathKey]);
  const removed = basePaths.filter((pathKey) => !candidate[pathKey]);

  const typeChanged = basePaths
    .filter((pathKey) => candidate[pathKey])
    .filter((pathKey) => signature(base[pathKey].types) !== signature(candidate[pathKey].types))
    .map((pathKey) => ({
      path: pathKey,
      from: base[pathKey].types,
      to: candidate[pathKey].types
    }));

  return {
    added,
    removed,
    typeChanged
  };
};

const severityFromPath = (pathKey, fromTypes, toTypes) => {
  const pathText = pathKey.toLowerCase();
  if (/(token|jwt|auth|secret|permission|role|signature|password|key)/i.test(pathText)) return 'high';
  if (/(id|amount|price|currency|schema|status|date|time|timestamp)/i.test(pathText)) return 'high';
  if (fromTypes.includes('array') !== toTypes.includes('array')) return 'high';
  if (fromTypes.includes('object') !== toTypes.includes('object')) return 'high';
  return 'medium';
};

const deriveCompatibility = ({ removed, typeChanged, added }) => {
  if (removed.length > 0 || typeChanged.some((item) => item.severity === 'high')) {
    return 'breaking';
  }
  if (typeChanged.length > 0 || added.length > 20) {
    return 'risky';
  }
  return 'compatible';
};

const deriveRiskSignals = ({ removed, typeChanged, added }) => {
  const signals = [];

  if (removed.length > 0) {
    signals.push({
      label: 'Removed Contract Paths',
      severity: 'high',
      reason: `${removed.length} path(s) removed. Consumers may fail if they rely on these keys.`
    });
  }

  if (typeChanged.length > 0) {
    signals.push({
      label: 'Type Drift Detected',
      severity: typeChanged.some((item) => item.severity === 'high') ? 'high' : 'medium',
      reason: `${typeChanged.length} path(s) changed type between versions.`
    });
  }

  if (added.length > 0) {
    signals.push({
      label: 'New Fields Added',
      severity: added.length > 30 ? 'medium' : 'low',
      reason: `${added.length} new path(s) detected. Validate downstream parsers and payload size assumptions.`
    });
  }

  if (signals.length === 0) {
    signals.push({
      label: 'No Structural Drift',
      severity: 'low',
      reason: 'No added, removed, or type-changed paths were detected.'
    });
  }

  return signals.slice(0, 5);
};

const deriveMigrationSteps = ({ compatibility, removed, typeChanged, context }) => {
  const steps = [];
  steps.push('Run contract comparison in CI and fail release if unapproved breaking paths are detected.');

  if (removed.length > 0) {
    steps.push('Introduce deprecation window: keep removed fields temporarily with fallback values.');
  }
  if (typeChanged.length > 0) {
    steps.push('Add parser compatibility layer to handle both old and new types until all consumers migrate.');
  }
  if (compatibility === 'breaking') {
    steps.push('Publish a versioned contract change note and coordinate rollout with dependent teams.');
  }
  if (context && /(production|customer|critical)/i.test(context)) {
    steps.push('Prepare rollback payload mapping for production-safe fallback deployment.');
  }

  steps.push('Add regression tests for old payload, new payload, and mixed transitional payload.');
  return dedupe(steps).slice(0, 6);
};

const buildTestPayloads = ({ baseline, candidate, removedPaths, changedPaths }) => {
  const payloads = [];
  payloads.push({
    name: 'Baseline Contract Sample',
    purpose: 'Validate current consumer compatibility with previous stable payload.',
    payload: JSON.stringify(baseline, null, 2)
  });

  payloads.push({
    name: 'Candidate Contract Sample',
    purpose: 'Validate new payload shape and downstream parsing behavior.',
    payload: JSON.stringify(candidate, null, 2)
  });

  const edgeCase = {
    _meta: {
      removed_paths: removedPaths.slice(0, 8),
      type_changed_paths: changedPaths.slice(0, 8).map((item) => ({
        path: item.path,
        from: item.from,
        to: item.to
      }))
    }
  };
  payloads.push({
    name: 'Compatibility Edge Case',
    purpose: 'Test migration behavior against removed/type-shifted fields.',
    payload: JSON.stringify(edgeCase, null, 2)
  });

  return payloads.slice(0, 3);
};

const mapWorkflow = (slug) => {
  const workflow = workflowBySlug[slug];
  if (!workflow) return null;
  return {
    slug: workflow.slug,
    title: workflow.title,
    description: workflow.description,
    path: `/workflows/${workflow.slug}`
  };
};

const mapProblem = (slug) => {
  const item = problemBySlug[slug];
  if (!item) return null;
  return {
    slug: item.slug,
    title: item.title,
    category: item.category,
    path: `/problems/${item.slug}`
  };
};

const deriveSuggestions = ({ allChangedText, compatibility }) => {
  const tools = ['/json-formatter', '/file-compare', '/json-encode-decode'];
  const workflowsSuggested = ['api-debug-workflow'];
  const problemsSuggested = ['json-parse-unexpected-token'];

  if (/(token|jwt|auth|signature|permission|secret)/i.test(allChangedText)) {
    tools.push('/jwt-decoder');
    workflowsSuggested.push('security-token-diagnostics-workflow');
    problemsSuggested.push('jwt-expired-or-invalid-signature');
  }
  if (/(url|uri|query|encode|cors)/i.test(allChangedText)) {
    tools.push('/url-encoder-decoder');
    workflowsSuggested.push('cors-and-auth-integration-workflow');
    problemsSuggested.push('url-encoding-breaking-api-request');
  }
  if (/(timestamp|date|time|epoch|timezone)/i.test(allChangedText)) {
    tools.push('/timestamp-converter');
    problemsSuggested.push('timestamp-timezone-mismatch');
  }
  if (compatibility !== 'compatible') {
    workflowsSuggested.push('data-integrity-release-workflow');
    workflowsSuggested.push('release-readiness-diff-workflow');
  }

  return {
    tools: dedupe(tools)
      .slice(0, 6)
      .map((toolPath) => ({
        path: toolPath,
        name: TOOL_NAME_BY_PATH[toolPath] || toolPath
      })),
    workflows: dedupe(workflowsSuggested)
      .map(mapWorkflow)
      .filter(Boolean)
      .slice(0, 3),
    problems: dedupe(problemsSuggested)
      .map(mapProblem)
      .filter(Boolean)
      .slice(0, 3)
  };
};

const parseJsonText = (text, label) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    const formatted = `${label} is invalid JSON: ${error.message}`;
    const validationError = new Error(formatted);
    validationError.code = 'INVALID_JSON';
    throw validationError;
  }
};

const augmentWithProvider = async ({ baseline }) => {
  const completion = await completeJson({
    systemPrompt:
      'You are a JSON contract reviewer. Return JSON only with keys: summary, compatibility (compatible|risky|breaking), migration_steps (array <=6), priority_paths (array <=6), confidence_adjustment (number between -0.15 and 0.15).',
    userPayload: baseline,
    temperature: 0.1
  });

  if (!completion.data || completion.mode === 'heuristic') {
    return {
      mode: 'heuristic',
      providerError: completion.error || null
    };
  }

  const data = completion.data;
  return {
    mode: completion.mode,
    model: completion.model,
    summary: typeof data.summary === 'string' ? toShortText(data.summary, 420) : '',
    compatibility: ['compatible', 'risky', 'breaking'].includes(data.compatibility) ? data.compatibility : null,
    migrationSteps: Array.isArray(data.migration_steps)
      ? data.migration_steps.map((item) => toShortText(item, 180)).filter(Boolean).slice(0, 6)
      : [],
    priorityPaths: Array.isArray(data.priority_paths)
      ? data.priority_paths.map((item) => toShortText(item, 140)).filter(Boolean).slice(0, 6)
      : [],
    confidenceAdjustment:
      typeof data.confidence_adjustment === 'number'
        ? Math.max(-0.15, Math.min(0.15, data.confidence_adjustment))
        : 0
  };
};

const analyzeJsonContract = async (payload = {}) => {
  const baselineText = typeof payload.baselineJson === 'string' ? payload.baselineJson : '';
  const candidateText = typeof payload.candidateJson === 'string' ? payload.candidateJson : '';
  const context = typeof payload.context === 'string' ? payload.context : '';
  const environment = typeof payload.environment === 'string' ? payload.environment : 'production';
  const roleHint = typeof payload.roleHint === 'string' ? payload.roleHint : 'backend';

  const baselineJson = parseJsonText(baselineText, 'Baseline contract');
  const candidateJson = parseJsonText(candidateText, 'Candidate contract');

  const baselineMapRaw = {};
  const candidateMapRaw = {};
  walkSchema(baselineJson, '', baselineMapRaw);
  walkSchema(candidateJson, '', candidateMapRaw);
  const baselineMap = materializeSchemaMap(baselineMapRaw);
  const candidateMap = materializeSchemaMap(candidateMapRaw);

  const compared = compareSchemas(baselineMap, candidateMap);
  const typedChanges = compared.typeChanged.map((item) => ({
    ...item,
    severity: severityFromPath(item.path, item.from, item.to)
  }));
  const compatibilityHeuristic = deriveCompatibility({
    removed: compared.removed,
    typeChanged: typedChanges,
    added: compared.added
  });
  const riskSignals = deriveRiskSignals({
    removed: compared.removed,
    typeChanged: typedChanges,
    added: compared.added
  });
  const migrationSteps = deriveMigrationSteps({
    compatibility: compatibilityHeuristic,
    removed: compared.removed,
    typeChanged: typedChanges,
    context
  });

  const allChangedText = `${compared.added.join(' ')} ${compared.removed.join(' ')} ${typedChanges
    .map((item) => item.path)
    .join(' ')}`.toLowerCase();
  const suggestions = deriveSuggestions({
    allChangedText,
    compatibility: compatibilityHeuristic
  });

  const metrics = {
    baselinePaths: Object.keys(baselineMap).length,
    candidatePaths: Object.keys(candidateMap).length,
    addedPaths: compared.added.length,
    removedPaths: compared.removed.length,
    typeChangedPaths: typedChanges.length,
    totalChanges: compared.added.length + compared.removed.length + typedChanges.length
  };

  const confidenceBase =
    metrics.totalChanges === 0
      ? 0.92
      : Math.max(0.56, Math.min(0.9, 1 - (typedChanges.length * 0.03 + compared.removed.length * 0.025)));

  const baselineReport = {
    context: {
      environment,
      roleHint
    },
    metrics,
    compatibility: compatibilityHeuristic,
    changedPaths: {
      added: compared.added.slice(0, 50),
      removed: compared.removed.slice(0, 50),
      typeChanged: typedChanges.slice(0, 40)
    },
    riskSignals,
    migrationSteps
  };

  const providerAugmentation = await augmentWithProvider({ baseline: baselineReport });

  const confidence =
    providerAugmentation.mode !== 'heuristic'
      ? Math.max(0.4, Math.min(0.98, confidenceBase + (providerAugmentation.confidenceAdjustment || 0)))
      : confidenceBase;

  const compatibility =
    providerAugmentation.compatibility || compatibilityHeuristic;

  const summary =
    providerAugmentation.summary ||
    `Detected ${metrics.totalChanges} structural contract change(s): ${metrics.addedPaths} added, ${metrics.removedPaths} removed, ${metrics.typeChangedPaths} type-changed paths.`;

  const report = {
    requestId: `ajc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    generatedAt: new Date().toISOString(),
    provider: {
      mode: providerAugmentation.mode,
      model: providerAugmentation.model || null,
      providerError: providerAugmentation.providerError || null
    },
    overview: {
      summary,
      compatibility,
      confidence: Number((confidence * 100).toFixed(1))
    },
    metrics,
    changes: {
      added: compared.added.slice(0, 60),
      removed: compared.removed.slice(0, 60),
      typeChanged: typedChanges.slice(0, 60),
      priorityPaths:
        providerAugmentation.priorityPaths?.length > 0
          ? providerAugmentation.priorityPaths
          : typedChanges.slice(0, 6).map((item) => item.path)
    },
    riskSignals,
    migrationSteps:
      providerAugmentation.migrationSteps?.length > 0
        ? providerAugmentation.migrationSteps
        : migrationSteps,
    testPayloads: buildTestPayloads({
      baseline: baselineJson,
      candidate: candidateJson,
      removedPaths: compared.removed,
      changedPaths: typedChanges
    }),
    suggestedTools: suggestions.tools,
    suggestedWorkflows: suggestions.workflows,
    relatedProblems: suggestions.problems,
    workspaceSeed: {
      role: roleHint || 'backend',
      sourceWorkflow: suggestions.workflows[0]?.slug || null,
      sourceProblem: suggestions.problems[0]?.slug || null,
      suggestedTools: suggestions.tools.map((item) => item.path).slice(0, 5),
      suggestedTags: dedupe([
        'json-contract',
        compatibility,
        environment.toLowerCase()
      ]).slice(0, 5)
    }
  };

  return report;
};

module.exports = {
  analyzeJsonContract
};
