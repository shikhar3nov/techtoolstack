const express = require('express');
const router = express.Router();
const { formatJson } = require('../controllers/jsonFormatter.controller');
const { regexTester } = require('../controllers/regexTester.controller');
const { routeErrorToWorkflow } = require('../controllers/aiRouter.controller');
const { explainDiffController } = require('../controllers/aiDiff.controller');
const { analyzeJsonContractController } = require('../controllers/aiJsonContract.controller');
const {
  listWorkspaceTemplates,
  listWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  markWorkspaceOpened,
  createWorkspaceShare,
  getSharedWorkspace,
  cloneSharedWorkspace
} = require('../controllers/workspace.controller');

// Health check route
router.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running!',
    timestamp: new Date().toISOString(),
    service: 'TechToolStack API'
  });
});

// JSON formatter route
router.post('/json-formatter', formatJson);

// Regex tester route
router.post('/test-regex', regexTester);

// AI router routes
router.post('/ai/error-router', routeErrorToWorkflow);
router.post('/ai/diff-explainer', explainDiffController);
router.post('/ai/json-contract-assistant', analyzeJsonContractController);

// Workspace routes
router.get('/workspaces/templates', listWorkspaceTemplates);
router.get('/workspaces', listWorkspaces);
router.get('/workspaces/:id', getWorkspaceById);
router.post('/workspaces', createWorkspace);
router.put('/workspaces/:id', updateWorkspace);
router.delete('/workspaces/:id', deleteWorkspace);
router.post('/workspaces/:id/open', markWorkspaceOpened);
router.post('/workspaces/:id/share', createWorkspaceShare);
router.get('/workspaces/share/:shareId', getSharedWorkspace);
router.post('/workspaces/share/:shareId/clone', cloneSharedWorkspace);

// Test route for debugging
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Tools routes working!',
    availableEndpoints: [
      'GET /health',
      'POST /json-formatter',
      'POST /test-regex',
      'POST /ai/error-router',
      'POST /ai/diff-explainer',
      'POST /ai/json-contract-assistant',
      'GET /workspaces/templates',
      'GET /workspaces',
      'GET /workspaces/:id',
      'POST /workspaces',
      'PUT /workspaces/:id',
      'DELETE /workspaces/:id',
      'POST /workspaces/:id/open',
      'POST /workspaces/:id/share',
      'GET /workspaces/share/:shareId',
      'POST /workspaces/share/:shareId/clone'
    ]
  });
});

module.exports = router;
