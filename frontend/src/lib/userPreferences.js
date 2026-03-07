const PINNED_TOOLS_KEY = 'tts_pinned_tools';
const RECENT_TOOLS_KEY = 'tts_recent_tools';
const MAX_RECENT_TOOLS = 8;

const canUseStorage = typeof window !== 'undefined';

const safeRead = (key, fallback) => {
  if (!canUseStorage) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const safeWrite = (key, value) => {
  if (!canUseStorage) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures in restricted browser modes.
  }
};

export const getPinnedTools = () => safeRead(PINNED_TOOLS_KEY, []);

export const togglePinnedTool = (toolPath) => {
  const current = getPinnedTools();
  const exists = current.includes(toolPath);
  const next = exists ? current.filter((item) => item !== toolPath) : [toolPath, ...current];
  safeWrite(PINNED_TOOLS_KEY, next);
  return next;
};

export const getRecentTools = () => safeRead(RECENT_TOOLS_KEY, []);

export const addRecentTool = (toolPath) => {
  if (!toolPath) return getRecentTools();

  const current = getRecentTools();
  const withoutCurrent = current.filter((item) => item !== toolPath);
  const next = [toolPath, ...withoutCurrent].slice(0, MAX_RECENT_TOOLS);
  safeWrite(RECENT_TOOLS_KEY, next);
  return next;
};

