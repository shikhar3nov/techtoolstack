import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { cloneSharedWorkspace, getSharedWorkspace } from '../lib/workspaceApi';
import { trackEvent } from '../lib/analytics';

const SharedWorkspace = () => {
  const { shareId } = useParams();
  const [ownerId, setOwnerId] = useState(() => localStorage.getItem('tts_workspace_owner_id') || 'team-alpha');
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadWorkspace = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await getSharedWorkspace(shareId);
      setWorkspace(data);
      trackEvent('shared_workspace_view', { share_id: shareId });
    } catch (err) {
      setError(err.message || 'Unable to load shared workspace');
    } finally {
      setLoading(false);
    }
  };

  const cloneWorkspace = async () => {
    if (!ownerId.trim()) {
      setError('Owner ID is required to clone workspace.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const clone = await cloneSharedWorkspace({
        shareId,
        ownerId,
        name: workspace?.name ? `${workspace.name} (My Copy)` : undefined
      });
      localStorage.setItem('tts_workspace_owner_id', ownerId);
      setMessage(`Workspace cloned successfully as "${clone.name}".`);
      trackEvent('shared_workspace_cloned', {
        share_id: shareId,
        workspace_id: clone.id
      });
    } catch (err) {
      setError(err.message || 'Unable to clone workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200 p-6">
          <header className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Shared Workspace
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-300">
              View and clone shared execution context for team collaboration.
            </p>
          </header>

          <section className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-5">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <input
                value={ownerId}
                onChange={(event) => setOwnerId(event.target.value)}
                placeholder="Owner ID for cloning"
                className="w-full md:w-72 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-sm"
              />
              <button
                type="button"
                onClick={loadWorkspace}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white text-sm font-semibold"
              >
                Load Shared Workspace
              </button>
              <Link
                to="/workspace-studio"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
              >
                Go To Workspace Studio
              </Link>
            </div>
          </section>

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

          {workspace && (
            <article className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-5">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{workspace.name}</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Role: {workspace.role} • Visibility: {workspace.visibility}
              </p>
              {workspace.description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{workspace.description}</p>}

              {Array.isArray(workspace.tags) && workspace.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {workspace.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-5">
                <button
                  type="button"
                  onClick={cloneWorkspace}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white text-sm font-semibold"
                >
                  Clone To My Workspaces
                </button>
              </div>
            </article>
          )}
        </section>
      </div>
    </div>
  );
};

export default SharedWorkspace;

