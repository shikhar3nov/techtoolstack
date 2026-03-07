const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const dbPath = path.join(dataDir, 'workspaces.json');

const roleTemplates = [
  {
    id: 'tpl-api-debug-frontend',
    role: 'frontend',
    name: 'Frontend API Debug',
    description: 'JSON parse errors, token decoding, URL parameter validation, and payload diff checks.',
    suggestedTools: ['/json-formatter', '/json-encode-decode', '/jwt-decoder', '/url-encoder-decoder', '/file-compare'],
    checklist: [
      'Validate request and response payload syntax.',
      'Decode escaped JSON values and verify object shape.',
      'Inspect auth claims and expiration timing.',
      'Compare working vs failing payload snapshots.'
    ]
  },
  {
    id: 'tpl-release-qa',
    role: 'qa',
    name: 'Release Validation QA',
    description: 'Regression-oriented release checks for changed data contracts and validation behavior.',
    suggestedTools: ['/file-compare', '/json-formatter', '/regex-tester', '/url-encoder-decoder'],
    checklist: [
      'Run file diff against previous stable release.',
      'Validate transformed request/response artifacts.',
      'Test regex rules against edge-case samples.',
      'Verify encoded URL behavior for special inputs.'
    ]
  },
  {
    id: 'tpl-security-token-ops',
    role: 'security',
    name: 'Token Security Diagnostics',
    description: 'Troubleshoot auth incidents with token decode, integrity checks, and config comparisons.',
    suggestedTools: ['/jwt-decoder', '/base64', '/hash-generator', '/file-compare'],
    checklist: [
      'Inspect token header and payload claims.',
      'Check token timestamps and signature assumptions.',
      'Validate hashing workflow consistency.',
      'Compare auth config across environments.'
    ]
  },
  {
    id: 'tpl-backend-contract',
    role: 'backend',
    name: 'Backend Contract Integrity',
    description: 'Maintain request/response contract consistency across services and deployments.',
    suggestedTools: ['/json-formatter', '/file-compare', '/hash-generator'],
    checklist: [
      'Normalize JSON contract artifacts.',
      'Compare schema or payload revisions.',
      'Verify deployment artifact integrity hashes.'
    ]
  },
  {
    id: 'tpl-product-investigation',
    role: 'product',
    name: 'Product Incident Investigation',
    description: 'Translate user-reported incidents into technical reproduction and validation steps.',
    suggestedTools: ['/file-compare', '/json-formatter', '/url-encoder-decoder'],
    checklist: [
      'Capture user-facing symptom and expected behavior.',
      'Compare affected payload or config versions.',
      'Validate request encoding and input transformations.',
      'Document fix verification criteria.'
    ]
  }
];

const ensureDbFile = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ workspaces: [] }, null, 2), 'utf8');
  }
};

const readDb = () => {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(dbPath, 'utf8');
    const parsed = JSON.parse(raw);
    return { workspaces: Array.isArray(parsed.workspaces) ? parsed.workspaces : [] };
  } catch {
    return { workspaces: [] };
  }
};

const writeDb = (data) => {
  ensureDbFile();
  const payload = JSON.stringify(data, null, 2);
  const tempPath = `${dbPath}.tmp`;
  fs.writeFileSync(tempPath, payload, 'utf8');
  fs.renameSync(tempPath, dbPath);
};

const toId = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const sanitizeString = (value, fallback = '') => (typeof value === 'string' ? value.trim() : fallback);

const canAccessWorkspace = (workspace, ownerId) => {
  if (!workspace) return false;
  if (workspace.visibility === 'public' || workspace.visibility === 'team') return true;
  return ownerId && workspace.ownerId === ownerId;
};

exports.listWorkspaceTemplates = (req, res) => {
  const role = sanitizeString(req.query.role).toLowerCase();
  const templates = role ? roleTemplates.filter((item) => item.role === role) : roleTemplates;
  res.json({ templates });
};

exports.listWorkspaces = (req, res) => {
  const ownerId = sanitizeString(req.query.ownerId);
  const role = sanitizeString(req.query.role).toLowerCase();
  const query = sanitizeString(req.query.q).toLowerCase();

  const { workspaces } = readDb();
  const filtered = workspaces
    .filter((item) => {
      if (!ownerId) {
        return item.visibility === 'public';
      }
      return item.ownerId === ownerId || item.visibility === 'team' || item.visibility === 'public';
    })
    .filter((item) => (role ? sanitizeString(item.role).toLowerCase() === role : true))
    .filter((item) => {
      if (!query) return true;
      const searchable = `${item.name} ${item.description} ${(item.tags || []).join(' ')}`.toLowerCase();
      return searchable.includes(query);
    })
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

  res.json({ workspaces: filtered });
};

exports.getWorkspaceById = (req, res) => {
  const { id } = req.params;
  const ownerId = sanitizeString(req.query.ownerId);
  const { workspaces } = readDb();
  const workspace = workspaces.find((item) => item.id === id);

  if (!workspace || !canAccessWorkspace(workspace, ownerId)) {
    return res.status(404).json({ error: 'Workspace not found' });
  }

  return res.json({ workspace });
};

exports.createWorkspace = (req, res) => {
  const ownerId = sanitizeString(req.body.ownerId);
  const name = sanitizeString(req.body.name);
  const description = sanitizeString(req.body.description);
  const role = sanitizeString(req.body.role);
  const visibility = sanitizeString(req.body.visibility, 'private') || 'private';
  const tags = Array.isArray(req.body.tags) ? req.body.tags.filter(Boolean).slice(0, 12) : [];
  const toolState = typeof req.body.toolState === 'object' && req.body.toolState !== null ? req.body.toolState : {};

  if (!ownerId) {
    return res.status(400).json({ error: 'ownerId is required' });
  }
  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  const now = new Date().toISOString();
  const workspace = {
    id: toId('ws'),
    ownerId,
    name,
    description,
    role: role || 'general',
    visibility: ['private', 'team', 'public'].includes(visibility) ? visibility : 'private',
    tags,
    toolState,
    shareId: null,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now
  };

  const db = readDb();
  db.workspaces.push(workspace);
  writeDb(db);

  return res.status(201).json({ workspace });
};

exports.updateWorkspace = (req, res) => {
  const { id } = req.params;
  const ownerId = sanitizeString(req.body.ownerId);
  if (!ownerId) {
    return res.status(400).json({ error: 'ownerId is required' });
  }

  const db = readDb();
  const index = db.workspaces.findIndex((item) => item.id === id);
  if (index < 0) {
    return res.status(404).json({ error: 'Workspace not found' });
  }

  const workspace = db.workspaces[index];
  if (workspace.ownerId !== ownerId) {
    return res.status(403).json({ error: 'You do not have permission to update this workspace' });
  }

  const next = {
    ...workspace,
    name: sanitizeString(req.body.name, workspace.name) || workspace.name,
    description: sanitizeString(req.body.description, workspace.description),
    role: sanitizeString(req.body.role, workspace.role) || workspace.role,
    visibility: ['private', 'team', 'public'].includes(req.body.visibility) ? req.body.visibility : workspace.visibility,
    tags: Array.isArray(req.body.tags) ? req.body.tags.filter(Boolean).slice(0, 12) : workspace.tags,
    toolState:
      typeof req.body.toolState === 'object' && req.body.toolState !== null ? req.body.toolState : workspace.toolState,
    updatedAt: new Date().toISOString()
  };

  db.workspaces[index] = next;
  writeDb(db);

  return res.json({ workspace: next });
};

exports.deleteWorkspace = (req, res) => {
  const { id } = req.params;
  const ownerId = sanitizeString(req.query.ownerId);
  if (!ownerId) {
    return res.status(400).json({ error: 'ownerId is required' });
  }

  const db = readDb();
  const index = db.workspaces.findIndex((item) => item.id === id);
  if (index < 0) {
    return res.status(404).json({ error: 'Workspace not found' });
  }

  if (db.workspaces[index].ownerId !== ownerId) {
    return res.status(403).json({ error: 'You do not have permission to delete this workspace' });
  }

  db.workspaces.splice(index, 1);
  writeDb(db);
  return res.json({ success: true });
};

exports.markWorkspaceOpened = (req, res) => {
  const { id } = req.params;
  const ownerId = sanitizeString(req.body.ownerId);
  const db = readDb();
  const index = db.workspaces.findIndex((item) => item.id === id);

  if (index < 0) {
    return res.status(404).json({ error: 'Workspace not found' });
  }

  const workspace = db.workspaces[index];
  if (!canAccessWorkspace(workspace, ownerId)) {
    return res.status(403).json({ error: 'You do not have access to this workspace' });
  }

  db.workspaces[index] = {
    ...workspace,
    lastOpenedAt: new Date().toISOString()
  };
  writeDb(db);

  return res.json({ workspace: db.workspaces[index] });
};

exports.createWorkspaceShare = (req, res) => {
  const { id } = req.params;
  const ownerId = sanitizeString(req.body.ownerId);
  if (!ownerId) {
    return res.status(400).json({ error: 'ownerId is required' });
  }

  const db = readDb();
  const index = db.workspaces.findIndex((item) => item.id === id);
  if (index < 0) {
    return res.status(404).json({ error: 'Workspace not found' });
  }

  const workspace = db.workspaces[index];
  if (workspace.ownerId !== ownerId) {
    return res.status(403).json({ error: 'You do not have permission to share this workspace' });
  }

  const shareId = workspace.shareId || toId('share');
  const visibility = ['private', 'team', 'public'].includes(req.body.visibility) ? req.body.visibility : 'public';

  const nextWorkspace = {
    ...workspace,
    shareId,
    visibility,
    updatedAt: new Date().toISOString()
  };
  db.workspaces[index] = nextWorkspace;
  writeDb(db);

  return res.json({
    shareId,
    workspace: nextWorkspace,
    sharePath: `/shared-workspace/${shareId}`
  });
};

exports.getSharedWorkspace = (req, res) => {
  const { shareId } = req.params;
  const { workspaces } = readDb();
  const workspace = workspaces.find((item) => item.shareId === shareId && item.visibility !== 'private');

  if (!workspace) {
    return res.status(404).json({ error: 'Shared workspace not found' });
  }

  const sharedView = {
    id: workspace.id,
    name: workspace.name,
    description: workspace.description,
    role: workspace.role,
    tags: workspace.tags,
    toolState: workspace.toolState,
    visibility: workspace.visibility,
    updatedAt: workspace.updatedAt,
    shareId: workspace.shareId
  };

  return res.json({ workspace: sharedView });
};

exports.cloneSharedWorkspace = (req, res) => {
  const { shareId } = req.params;
  const ownerId = sanitizeString(req.body.ownerId);
  const name = sanitizeString(req.body.name);

  if (!ownerId) {
    return res.status(400).json({ error: 'ownerId is required' });
  }

  const db = readDb();
  const source = db.workspaces.find((item) => item.shareId === shareId && item.visibility !== 'private');
  if (!source) {
    return res.status(404).json({ error: 'Shared workspace not found' });
  }

  const now = new Date().toISOString();
  const clone = {
    id: toId('ws'),
    ownerId,
    name: name || `${source.name} (Copy)`,
    description: source.description,
    role: source.role,
    visibility: 'private',
    tags: source.tags || [],
    toolState: source.toolState || {},
    shareId: null,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now
  };

  db.workspaces.push(clone);
  writeDb(db);

  return res.status(201).json({ workspace: clone });
};

