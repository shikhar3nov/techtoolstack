const STORAGE_KEY = 'tts_saved_content_library_v1';
const CONTENT_TYPES = ['blog', 'workflows', 'problems', 'solutions'];

const defaultLibrary = () => ({
  blog: [],
  workflows: [],
  problems: [],
  solutions: []
});

const sanitizeLibrary = (value) => {
  const next = defaultLibrary();
  if (!value || typeof value !== 'object') {
    return next;
  }

  CONTENT_TYPES.forEach((type) => {
    const items = Array.isArray(value[type]) ? value[type] : [];
    next[type] = [...new Set(items.filter((item) => typeof item === 'string' && item.trim().length > 0))];
  });

  return next;
};

const readLibrary = () => {
  if (typeof window === 'undefined') {
    return defaultLibrary();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultLibrary();
    return sanitizeLibrary(JSON.parse(raw));
  } catch {
    return defaultLibrary();
  }
};

const writeLibrary = (library) => {
  if (typeof window === 'undefined') {
    return;
  }

  const payload = sanitizeLibrary(library);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent('tts:saved-content-updated', { detail: payload }));
};

const isValidType = (type) => CONTENT_TYPES.includes(type);

export const getSavedLibrary = () => readLibrary();

export const isSavedContent = (type, slug) => {
  if (!isValidType(type) || !slug) return false;
  const library = readLibrary();
  return library[type].includes(slug);
};

export const toggleSavedContent = (type, slug) => {
  if (!isValidType(type) || !slug) {
    return readLibrary();
  }

  const library = readLibrary();
  const exists = library[type].includes(slug);
  const next = {
    ...library,
    [type]: exists ? library[type].filter((item) => item !== slug) : [slug, ...library[type]]
  };

  writeLibrary(next);
  return next;
};

export const clearSavedLibrary = () => {
  const empty = defaultLibrary();
  writeLibrary(empty);
  return empty;
};

export const getSavedCount = () => {
  const library = readLibrary();
  return CONTENT_TYPES.reduce((acc, type) => acc + library[type].length, 0);
};

export const CONTENT_LIBRARY_TYPES = CONTENT_TYPES;
