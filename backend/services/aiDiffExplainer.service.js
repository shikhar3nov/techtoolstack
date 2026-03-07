const fs = require('fs');
const path = require('path');
const { completeJson } = require('./aiProvider.service');

const dataRoot = path.join(__dirname, '../../frontend/src/data');

const TOOL_NAME_BY_PATH = {
  '/file-compare': 'File Compare',
  '/json-formatter': 'JSON Formatter',
  '/json-encode-decode': 'JSON Encode/Decode',
  '/jwt-decoder': 'JWT Decoder',
  '/url-encoder-decoder': 'URL Encoder/Decoder',
  '/regex-tester': 'Regular Expression Tester',
  '/hash-generator': 'Hash Generator',
  '/timestamp-converter': 'Unix Timestamp Converter',
  '/base64': 'Base64 Encode/Decode'
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

const workflowBySlug = workflowList.reduce((acc, item) => {
  acc[item.slug] = item;
  return acc;
}, {});

const problemBySlug = problemList.reduce((acc, item) => {
  acc[item.slug] = item;
  return acc;
}, {});

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

const dedupe = (items) => [...new Set(items.filter(Boolean))];

const toShortText = (value, max = 180) => {
  if (!value || typeof value !== 'string') return '';
  return value.length > max ? `${value.slice(0, max)}...` : value;
};

const buildMetrics = (rows, leftLines, rightLines) => {
  const counts = rows.reduce(
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
  );

  const similarity = counts.total ? Math.round((counts.unchanged / counts.total) * 100) : 100;

  return {
    leftLines: leftLines.length,
    rightLines: rightLines.length,
    totalRows: counts.total,
    unchanged: counts.unchanged,
    added: counts.added,
    removed: counts.removed,
    modified: counts.modified,
    changedRows: counts.total - counts.unchanged,
    similarity
  };
};

const extractChangedSnippets = (rows, maxSnippets) =>
  rows
    .filter((row) => row.kind !== 'unchanged')
    .slice(0, maxSnippets)
    .map((row) => ({
      kind: row.kind,
      leftLineNumber: row.leftLineNumber,
      rightLineNumber: row.rightLineNumber,
      leftText: toShortText(row.leftText, 220),
      rightText: toShortText(row.rightText, 220)
    }));

const pushRisk = (collection, item) => {
  if (collection.some((risk) => risk.label === item.label)) return;
  collection.push(item);
};

const deriveRiskSignals = ({ changedText, metrics }) => {
  const risks = [];

  if (/(jwt|token|secret|password|auth|signature|permission|oauth|cors)/i.test(changedText)) {
    pushRisk(risks, {
      label: 'Auth/Security Surface Changed',
      severity: 'high',
      reason: 'Detected auth, token, credential, or CORS-related changes.'
    });
  }

  if (/(drop table|alter table|migration|schema|delete from|truncate|primary key|foreign key)/i.test(changedText)) {
    pushRisk(risks, {
      label: 'Database Contract Risk',
      severity: 'high',
      reason: 'Detected schema or destructive data-operation changes.'
    });
  }

  if (/(timeout|retry|queue|cache|circuit|deadlock|transaction)/i.test(changedText)) {
    pushRisk(risks, {
      label: 'Runtime Stability Risk',
      severity: 'medium',
      reason: 'Detected reliability or resilience behavior changes.'
    });
  }

  if (/(env|config|feature flag|staging|production|base url|endpoint)/i.test(changedText)) {
    pushRisk(risks, {
      label: 'Configuration Drift Risk',
      severity: 'medium',
      reason: 'Detected config/environment related updates.'
    });
  }

  const deletionRatio = metrics.changedRows ? metrics.removed / metrics.changedRows : 0;
  if (metrics.changedRows >= 20 && deletionRatio > 0.35) {
    pushRisk(risks, {
      label: 'High Removal Ratio',
      severity: 'high',
      reason: 'Large proportion of deleted lines may indicate behavior removal.'
    });
  }

  if (metrics.changedRows >= 60 || metrics.similarity < 70) {
    pushRisk(risks, {
      label: 'Large Change Set',
      severity: 'medium',
      reason: 'Diff size indicates elevated regression probability.'
    });
  }

  if (risks.length === 0) {
    pushRisk(risks, {
      label: 'Low Structural Risk',
      severity: 'low',
      reason: 'No high-risk patterns detected in changed lines.'
    });
  }

  return risks.slice(0, 5);
};

const deriveChecks = (riskSignals) => {
  const checks = [];
  const labels = riskSignals.map((item) => item.label.toLowerCase()).join(' ');

  checks.push('Re-run comparison on clean baseline and verify only intended lines changed.');

  if (labels.includes('auth/security')) {
    checks.push('Validate JWT/auth claims, secret configuration, and CORS policy in target environment.');
  }
  if (labels.includes('database')) {
    checks.push('Run migration dry-run and rollback validation before release cut.');
  }
  if (labels.includes('configuration')) {
    checks.push('Diff staging vs production config snapshots to prevent environment drift.');
  }
  if (labels.includes('runtime stability')) {
    checks.push('Run load/retry/timeout smoke tests for affected services.');
  }
  if (labels.includes('large change set') || labels.includes('high removal ratio')) {
    checks.push('Add focused regression checklist for impacted modules and critical paths.');
  }

  checks.push('Document risky deltas in release notes and assign explicit owner for post-release monitoring.');
  return dedupe(checks).slice(0, 6);
};

const deriveSuggestedTools = (changedText, riskSignals) => {
  const toolPaths = ['/file-compare'];
  const riskText = riskSignals.map((item) => item.label).join(' ').toLowerCase();

  if (/(json|payload|schema|parse)/i.test(changedText)) {
    toolPaths.push('/json-formatter', '/json-encode-decode');
  }
  if (/(jwt|token|auth|signature|secret|cors)/i.test(changedText) || riskText.includes('auth/security')) {
    toolPaths.push('/jwt-decoder', '/url-encoder-decoder');
  }
  if (/(regex|pattern)/i.test(changedText)) {
    toolPaths.push('/regex-tester');
  }
  if (/(hash|checksum|integrity|artifact)/i.test(changedText)) {
    toolPaths.push('/hash-generator');
  }
  if (/(timestamp|epoch|timezone|date)/i.test(changedText)) {
    toolPaths.push('/timestamp-converter');
  }

  return dedupe(toolPaths)
    .slice(0, 6)
    .map((pathKey) => ({
      path: pathKey,
      name: TOOL_NAME_BY_PATH[pathKey] || pathKey
    }));
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
  const problem = problemBySlug[slug];
  if (!problem) return null;
  return {
    slug: problem.slug,
    title: problem.title,
    category: problem.category,
    path: `/problems/${problem.slug}`
  };
};

const deriveWorkflowAndProblems = (changedText, riskSignals) => {
  const riskText = riskSignals.map((item) => item.label).join(' ').toLowerCase();
  const suggestions = {
    workflows: [],
    problems: []
  };

  const pushWorkflow = (slug) => {
    const mapped = mapWorkflow(slug);
    if (!mapped) return;
    if (!suggestions.workflows.some((item) => item.slug === mapped.slug)) {
      suggestions.workflows.push(mapped);
    }
  };

  const pushProblem = (slug) => {
    const mapped = mapProblem(slug);
    if (!mapped) return;
    if (!suggestions.problems.some((item) => item.slug === mapped.slug)) {
      suggestions.problems.push(mapped);
    }
  };

  pushWorkflow('release-readiness-diff-workflow');

  if (riskText.includes('auth/security') || /(jwt|token|auth|cors|signature)/i.test(changedText)) {
    pushWorkflow('security-token-diagnostics-workflow');
    pushWorkflow('cors-and-auth-integration-workflow');
    pushProblem('jwt-expired-or-invalid-signature');
    pushProblem('cors-policy-blocked-request');
  }

  if (riskText.includes('database') || /(migration|schema|checksum|integrity)/i.test(changedText)) {
    pushWorkflow('data-integrity-release-workflow');
    pushProblem('hash-mismatch-after-file-transfer');
  }

  if (/(json|parse|payload)/i.test(changedText)) {
    pushWorkflow('api-debug-workflow');
    pushProblem('json-parse-unexpected-token');
  }

  if (/(timestamp|timezone|epoch)/i.test(changedText)) {
    pushProblem('timestamp-timezone-mismatch');
  }

  if (/(regex|pattern)/i.test(changedText)) {
    pushProblem('regex-not-matching-expected-inputs');
  }

  if (/(url|query parameter|uri|encoding)/i.test(changedText)) {
    pushProblem('url-encoding-breaking-api-request');
  }

  return {
    workflows: suggestions.workflows.slice(0, 3),
    problems: suggestions.problems.slice(0, 3)
  };
};

const severityScore = (severity) => {
  if (severity === 'high') return 3;
  if (severity === 'medium') return 2;
  return 1;
};

const deriveRiskLevel = (riskSignals, metrics) => {
  const combinedScore =
    riskSignals.reduce((acc, item) => acc + severityScore(item.severity), 0) +
    (metrics.changedRows >= 80 ? 2 : metrics.changedRows >= 30 ? 1 : 0);

  if (combinedScore >= 8) return 'high';
  if (combinedScore >= 4) return 'medium';
  return 'low';
};

const buildHeuristicSummary = ({ metrics, riskSignals }) => {
  const topRisk = riskSignals[0];
  const riskLine = topRisk ? `Primary risk signal: ${topRisk.label}.` : 'No strong risk signals detected.';
  return `Detected ${metrics.changedRows} changed rows across ${metrics.totalRows} total rows (${metrics.similarity}% similarity). ${riskLine}`;
};

const augmentWithProvider = async ({ baseline, snippets }) => {
  const completion = await completeJson({
    systemPrompt:
      'You are a senior software reviewer. Return JSON only with keys: summary, risk_level (low|medium|high), recommended_checks (array <=6), confidence_adjustment (number between -0.15 and 0.15).',
    userPayload: {
      baseline,
      changed_snippets: snippets
    },
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
    riskLevel: ['low', 'medium', 'high'].includes(data.risk_level) ? data.risk_level : null,
    recommendedChecks: Array.isArray(data.recommended_checks)
      ? data.recommended_checks.map((item) => toShortText(item, 180)).filter(Boolean).slice(0, 6)
      : [],
    confidenceAdjustment:
      typeof data.confidence_adjustment === 'number'
        ? Math.max(-0.15, Math.min(0.15, data.confidence_adjustment))
        : 0
  };
};

const explainDiff = async (payload = {}) => {
  const leftText = typeof payload.leftText === 'string' ? payload.leftText : '';
  const rightText = typeof payload.rightText === 'string' ? payload.rightText : '';
  const leftTitle = typeof payload.leftTitle === 'string' ? payload.leftTitle : 'Left';
  const rightTitle = typeof payload.rightTitle === 'string' ? payload.rightTitle : 'Right';
  const options = {
    ignoreWhitespace: Boolean(payload.options?.ignoreWhitespace),
    ignoreCase: Boolean(payload.options?.ignoreCase)
  };
  const maxSnippets = Math.min(Math.max(Number(payload.maxSnippets || 16), 4), 30);

  const leftLines = leftText.split('\n');
  const rightLines = rightText.split('\n');
  const rawRows = buildRawDiff(leftLines, rightLines, options);
  const rows = mergeModifiedBlocks(rawRows);
  const metrics = buildMetrics(rows, leftLines, rightLines);
  const snippets = extractChangedSnippets(rows, maxSnippets);
  const changedText = snippets
    .map((snippet) => `${snippet.leftText}\n${snippet.rightText}`)
    .join('\n')
    .toLowerCase();

  const riskSignals = deriveRiskSignals({ changedText, metrics });
  const heuristicRiskLevel = deriveRiskLevel(riskSignals, metrics);
  const recommendedChecks = deriveChecks(riskSignals);
  const suggestedTools = deriveSuggestedTools(changedText, riskSignals);
  const mapped = deriveWorkflowAndProblems(changedText, riskSignals);

  const baseline = {
    file: {
      leftTitle,
      rightTitle
    },
    metrics,
    riskSignals,
    recommendedChecks,
    suggestedTools,
    suggestedWorkflows: mapped.workflows,
    suggestedProblems: mapped.problems
  };

  const providerAugmentation = await augmentWithProvider({ baseline, snippets });

  const confidenceBase = metrics.changedRows === 0 ? 0.92 : Math.max(0.55, Math.min(0.9, 1 - metrics.similarity / 220));
  const confidence =
    providerAugmentation.mode !== 'heuristic'
      ? Math.max(
          0.4,
          Math.min(0.98, confidenceBase + (providerAugmentation.confidenceAdjustment || 0))
        )
      : confidenceBase;

  return {
    requestId: `aid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    generatedAt: new Date().toISOString(),
    provider: {
      mode: providerAugmentation.mode,
      model: providerAugmentation.model || null,
      providerError: providerAugmentation.providerError || null
    },
    overview: {
      summary: providerAugmentation.summary || buildHeuristicSummary({ metrics, riskSignals }),
      riskLevel: providerAugmentation.riskLevel || heuristicRiskLevel,
      confidence: Number((confidence * 100).toFixed(1))
    },
    metrics,
    riskSignals,
    recommendedChecks:
      providerAugmentation.recommendedChecks?.length > 0
        ? providerAugmentation.recommendedChecks
        : recommendedChecks,
    suggestedTools,
    suggestedWorkflows: mapped.workflows,
    suggestedProblems: mapped.problems,
    snippets
  };
};

module.exports = {
  explainDiff
};
