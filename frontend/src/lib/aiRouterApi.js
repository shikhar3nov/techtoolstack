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
    const error = new Error(payload.error || payload.message || 'Request failed');
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

export const routeErrorIncident = async (input) =>
  request('/ai/error-router', {
    method: 'POST',
    body: JSON.stringify(input)
  });

export const explainFileDiff = async (input) =>
  request('/ai/diff-explainer', {
    method: 'POST',
    body: JSON.stringify(input)
  });

export const analyzeJsonContract = async (input) =>
  request('/ai/json-contract-assistant', {
    method: 'POST',
    body: JSON.stringify(input)
  });

export { API_BASE_URL };
