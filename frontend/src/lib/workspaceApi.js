const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const error = new Error(payload.error || 'Request failed');
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

export const getWorkspaceTemplates = async (role) => {
  const query = role ? `?role=${encodeURIComponent(role)}` : '';
  const data = await request(`/workspaces/templates${query}`);
  return data.templates || [];
};

export const listWorkspaces = async ({ ownerId, role, q } = {}) => {
  const query = new URLSearchParams();
  if (ownerId) query.set('ownerId', ownerId);
  if (role) query.set('role', role);
  if (q) query.set('q', q);

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const data = await request(`/workspaces${suffix}`);
  return data.workspaces || [];
};

export const getWorkspaceById = async ({ id, ownerId }) => {
  const suffix = ownerId ? `?ownerId=${encodeURIComponent(ownerId)}` : '';
  const data = await request(`/workspaces/${id}${suffix}`);
  return data.workspace;
};

export const createWorkspace = async (payload) => {
  const data = await request('/workspaces', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return data.workspace;
};

export const updateWorkspace = async ({ id, ...payload }) => {
  const data = await request(`/workspaces/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  return data.workspace;
};

export const deleteWorkspace = async ({ id, ownerId }) => {
  const suffix = ownerId ? `?ownerId=${encodeURIComponent(ownerId)}` : '';
  const data = await request(`/workspaces/${id}${suffix}`, {
    method: 'DELETE'
  });
  return data.success;
};

export const markWorkspaceOpened = async ({ id, ownerId }) => {
  const data = await request(`/workspaces/${id}/open`, {
    method: 'POST',
    body: JSON.stringify({ ownerId })
  });
  return data.workspace;
};

export const createWorkspaceShare = async ({ id, ownerId, visibility }) => {
  const data = await request(`/workspaces/${id}/share`, {
    method: 'POST',
    body: JSON.stringify({ ownerId, visibility })
  });
  return data;
};

export const getSharedWorkspace = async (shareId) => {
  const data = await request(`/workspaces/share/${shareId}`);
  return data.workspace;
};

export const cloneSharedWorkspace = async ({ shareId, ownerId, name }) => {
  const data = await request(`/workspaces/share/${shareId}/clone`, {
    method: 'POST',
    body: JSON.stringify({ ownerId, name })
  });
  return data.workspace;
};

export { API_BASE_URL };

