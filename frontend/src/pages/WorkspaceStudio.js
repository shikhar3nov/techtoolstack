import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  API_BASE_URL,
  createWorkspace,
  createWorkspaceShare,
  deleteWorkspace,
  getWorkspaceTemplates,
  listWorkspaces,
  markWorkspaceOpened
} from '../lib/workspaceApi';
import { trackEvent } from '../lib/analytics';
import toolsData from '../data/toolsData';

const roleOptions = ['frontend', 'backend', 'qa', 'security', 'product', 'general'];
const visibilityOptions = ['private', 'team', 'public'];

const toolByPath = toolsData.reduce((acc, tool) => {
  acc[tool.link] = tool;
  return acc;
}, {});

const WorkspaceStudio = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [ownerId, setOwnerId] = useState(() => localStorage.getItem('tts_workspace_owner_id') || 'team-alpha');
  const [role, setRole] = useState('frontend');
  const [visibility, setVisibility] = useState('private');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [templates, setTemplates] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');

  const queryContext = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const sourceRole = params.get('role');
    return {
      sourceTool: params.get('tool'),
      sourceWorkflow: params.get('workflow'),
      sourceProblem: params.get('problem'),
      sourceRole: roleOptions.includes(sourceRole) ? sourceRole : null
    };
  }, [location.search]);

  const refreshData = async () => {
    setLoading(true);
    setError('');
    try {
      const [templateItems, workspaceItems] = await Promise.all([
        getWorkspaceTemplates(role),
        listWorkspaces({ ownerId, role, q: query })
      ]);
      setTemplates(templateItems);
      setWorkspaces(workspaceItems);
    } catch (err) {
      setError(err.message || 'Failed to load workspace data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('tts_workspace_owner_id', ownerId);
  }, [ownerId]);

  useEffect(() => {
    refreshData();
  }, [ownerId, role, query]);

  useEffect(() => {
    if (queryContext.sourceRole && queryContext.sourceRole !== role) {
      setRole(queryContext.sourceRole);
      trackEvent('workspace_role_prefill', {
        role: queryContext.sourceRole
      });
    }
  }, [queryContext.sourceRole, role]);

  useEffect(() => {
    if (!queryContext.sourceTool && !queryContext.sourceWorkflow && !queryContext.sourceProblem) return;
    const parts = [];
    if (queryContext.sourceTool) {
      parts.push(`Tool: ${toolByPath[queryContext.sourceTool]?.name || queryContext.sourceTool}`);
    }
    if (queryContext.sourceWorkflow) {
      parts.push(`Workflow: ${queryContext.sourceWorkflow}`);
    }
    if (queryContext.sourceProblem) {
      parts.push(`Problem: ${queryContext.sourceProblem}`);
    }
    if (queryContext.sourceRole) {
      parts.push(`Role: ${queryContext.sourceRole}`);
    }
    setDescription(parts.join(' | '));
    if (!name) {
      setName(`Workspace - ${new Date().toLocaleDateString()}`);
    }
  }, [queryContext, name]);

  const handleCreateWorkspace = async () => {
    if (!ownerId.trim() || !name.trim()) {
      setError('Owner ID and workspace name are required.');
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);
    try {
      const workspace = await createWorkspace({
        ownerId,
        name,
        description,
        role,
        visibility,
        tags: tags
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        toolState: {
          sourceTool: queryContext.sourceTool || null,
          sourceWorkflow: queryContext.sourceWorkflow || null,
          sourceProblem: queryContext.sourceProblem || null,
          createdFromPath: location.pathname
        }
      });

      setMessage(`Workspace "${workspace.name}" created successfully.`);
      setName('');
      setDescription('');
      setTags('');
      await refreshData();
      trackEvent('workspace_created', {
        role,
        visibility,
        workspace_id: workspace.id
      });
    } catch (err) {
      setError(err.message || 'Unable to create workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromTemplate = async (template) => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const workspace = await createWorkspace({
        ownerId,
        name: template.name,
        description: template.description,
        role: template.role,
        visibility,
        tags: ['template', template.role],
        toolState: {
          suggestedTools: template.suggestedTools || [],
          checklist: template.checklist || []
        }
      });
      setMessage(`Template "${template.name}" added to your workspaces.`);
      await refreshData();
      trackEvent('workspace_template_applied', {
        template_id: template.id,
        workspace_id: workspace.id
      });
    } catch (err) {
      setError(err.message || 'Unable to apply template');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWorkspace = async (workspace) => {
    try {
      await markWorkspaceOpened({ id: workspace.id, ownerId });
    } catch {
      // Non-blocking
    }

    const firstTool = workspace.toolState?.suggestedTools?.[0] || workspace.toolState?.sourceTool;
    if (firstTool) {
      navigate(firstTool);
      trackEvent('workspace_open_to_tool', {
        workspace_id: workspace.id,
        target_tool: firstTool
      });
      return;
    }

    setMessage(`Workspace "${workspace.name}" opened. No direct tool configured.`);
    trackEvent('workspace_opened', { workspace_id: workspace.id });
  };

  const handleShareWorkspace = async (workspace) => {
    setError('');
    setMessage('');
    try {
      const share = await createWorkspaceShare({
        id: workspace.id,
        ownerId,
        visibility: workspace.visibility === 'private' ? 'public' : workspace.visibility
      });
      const absoluteShareUrl = `${window.location.origin}${share.sharePath}`;
      await navigator.clipboard.writeText(absoluteShareUrl);
      setMessage(`Share link copied: ${absoluteShareUrl}`);
      await refreshData();
      trackEvent('workspace_shared', {
        workspace_id: workspace.id,
        share_id: share.shareId
      });
    } catch (err) {
      setError(err.message || 'Unable to share workspace');
    }
  };

  const handleDeleteWorkspace = async (workspace) => {
    setError('');
    setMessage('');
    try {
      await deleteWorkspace({ id: workspace.id, ownerId });
      setMessage(`Workspace "${workspace.name}" deleted.`);
      await refreshData();
      trackEvent('workspace_deleted', { workspace_id: workspace.id });
    } catch (err) {
      setError(err.message || 'Unable to delete workspace');
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200 p-6">
          <header className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
              Workspace Studio
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-300 max-w-3xl">
              Create role-based workspaces, sync them via API, and share execution contexts with your team.
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              API Endpoint: <code>{API_BASE_URL}</code>
            </p>
          </header>

          <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-5">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Create Workspace</h2>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Owner ID</label>
                  <input
                    value={ownerId}
                    onChange={(event) => setOwnerId(event.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                    placeholder="team-alpha"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Role</label>
                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                  >
                    {roleOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Workspace Name</label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                    placeholder="API Debug - Sprint 14"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Visibility</label>
                  <select
                    value={visibility}
                    onChange={(event) => setVisibility(event.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                  >
                    {visibilityOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Description</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 resize-none"
                  placeholder="What this workspace is solving, assumptions, and expected outcomes."
                />
              </div>

              <div className="mt-4">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Tags (comma-separated)</label>
                <input
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                  placeholder="release, auth, api"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleCreateWorkspace}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white text-sm font-semibold"
                >
                  Create Workspace
                </button>
                <button
                  type="button"
                  onClick={refreshData}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white text-sm font-semibold"
                >
                  Refresh
                </button>
                <Link
                  to="/workflows"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
                >
                  Open Workflow Hub
                </Link>
              </div>

              {error && (
                <div className="mt-4 px-3 py-2 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}
              {message && (
                <div className="mt-4 px-3 py-2 rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm">
                  {message}
                </div>
              )}
            </div>

            <aside className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-5">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Role Templates</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Ready-made workspace structures for each team role.
              </p>
              <div className="mt-4 space-y-3">
                {templates.map((template) => (
                  <div key={template.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 p-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{template.name}</h3>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{template.description}</p>
                    <button
                      type="button"
                      onClick={() => handleCreateFromTemplate(template)}
                      disabled={loading}
                      className="mt-2 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white text-xs font-semibold"
                    >
                      Use Template
                    </button>
                  </div>
                ))}
                {!templates.length && <p className="text-sm text-gray-500 dark:text-gray-400">No templates found.</p>}
              </div>
            </aside>
          </section>

          <section className="mt-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Workspace Cloud Sync</h2>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search workspaces"
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-sm w-full md:w-72"
              />
            </div>
            <div className="mt-4 space-y-3">
              {workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{workspace.name}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {workspace.role} • {workspace.visibility} • updated {new Date(workspace.updatedAt).toLocaleString()}
                      </p>
                      {workspace.description && (
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{workspace.description}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenWorkspace(workspace)}
                        className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShareWorkspace(workspace)}
                        className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                      >
                        Share
                      </button>
                      {workspace.shareId && (
                        <Link
                          to={`/shared-workspace/${workspace.shareId}`}
                          className="px-3 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
                        >
                          View Shared
                        </Link>
                      )}
                      {workspace.ownerId === ownerId && (
                        <button
                          type="button"
                          onClick={() => handleDeleteWorkspace(workspace)}
                          className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!workspaces.length && !loading && (
                <p className="text-sm text-gray-500 dark:text-gray-400">No workspaces found for current owner/role filter.</p>
              )}
            </div>
          </section>
        </section>
      </div>
    </div>
  );
};

export default WorkspaceStudio;
