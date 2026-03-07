const STORAGE_KEY = 'tts_analytics_events';
const ATTRIBUTION_KEY = 'tts_analytics_attribution';
const SESSION_KEY = 'tts_analytics_session_id';
const MAX_STORED_EVENTS = 400;

const isBrowser = typeof window !== 'undefined';
let initialized = false;

const toId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const safeReadJson = (key, fallback) => {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const safeWriteJson = (key, value) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write failures in strict browser modes.
  }
};

const getSessionId = () => {
  if (!isBrowser) return 'server';

  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const next = toId();
    window.sessionStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return 'anonymous';
  }
};

const normalizeUtm = (search = '') => {
  const params = new URLSearchParams(search);
  const utm = {
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_term: params.get('utm_term') || '',
    utm_content: params.get('utm_content') || ''
  };
  const hasAny = Object.values(utm).some(Boolean);
  return hasAny ? utm : null;
};

const getAttribution = () => safeReadJson(ATTRIBUTION_KEY, null);

const writeAttribution = (attribution) => safeWriteJson(ATTRIBUTION_KEY, attribution);

export const captureAttribution = () => {
  if (!isBrowser) return null;

  const current = getAttribution();
  const currentUtm = normalizeUtm(window.location.search);

  if (!current) {
    const first = {
      firstTouch: currentUtm || { utm_source: 'direct' },
      lastTouch: currentUtm || { utm_source: 'direct' },
      firstLandingPath: window.location.pathname || '/',
      firstReferrer: document.referrer || '',
      updatedAt: new Date().toISOString()
    };
    writeAttribution(first);
    return first;
  }

  if (currentUtm) {
    const updated = {
      ...current,
      lastTouch: currentUtm,
      updatedAt: new Date().toISOString()
    };
    writeAttribution(updated);
    return updated;
  }

  return current;
};

const appendStoredEvent = (eventPayload) => {
  if (!isBrowser) return;
  const existing = safeReadJson(STORAGE_KEY, []);
  const next = [...existing, eventPayload].slice(-MAX_STORED_EVENTS);
  safeWriteJson(STORAGE_KEY, next);
};

const injectScript = (scriptId, src) => {
  if (!isBrowser) return;
  if (document.getElementById(scriptId)) return;

  const script = document.createElement('script');
  script.id = scriptId;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
};

const initGa4 = (measurementId) => {
  if (!measurementId || !isBrowser) return;

  injectScript('tts-ga4-loader', `https://www.googletagmanager.com/gtag/js?id=${measurementId}`);

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false,
    anonymize_ip: true
  });
};

const initGtm = (containerId) => {
  if (!containerId || !isBrowser) return;
  if (document.getElementById('tts-gtm-loader')) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

  const script = document.createElement('script');
  script.id = 'tts-gtm-loader';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
  document.head.appendChild(script);
};

const getGlobalContext = () => {
  const attribution = captureAttribution();
  return {
    session_id: getSessionId(),
    first_touch_source: attribution?.firstTouch?.utm_source || 'direct',
    last_touch_source: attribution?.lastTouch?.utm_source || 'direct',
    page_path: isBrowser ? window.location.pathname || '/' : '/',
    page_search: isBrowser ? window.location.search || '' : ''
  };
};

export const initAnalytics = () => {
  if (!isBrowser || initialized) return;

  const ga4MeasurementId = process.env.REACT_APP_GA4_MEASUREMENT_ID || '';
  const gtmContainerId = process.env.REACT_APP_GTM_CONTAINER_ID || '';

  initGa4(ga4MeasurementId.trim());
  initGtm(gtmContainerId.trim());
  captureAttribution();

  initialized = true;
};

export const trackPageView = (path, title = '') => {
  if (!isBrowser || !path) return;

  const context = getGlobalContext();
  const params = {
    ...context,
    page_path: path,
    page_title: title || document.title || ''
  };

  const payload = {
    name: 'page_view',
    params,
    path,
    timestamp: new Date().toISOString()
  };

  appendStoredEvent(payload);

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: 'page_view', ...params });
  }
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', params);
  }
};

export const trackEvent = (name, params = {}) => {
  if (!isBrowser || !name) return;

  const context = getGlobalContext();
  const finalParams = {
    ...context,
    ...params
  };

  const payload = {
    name,
    params: finalParams,
    path: window.location?.pathname || '/',
    timestamp: new Date().toISOString()
  };

  appendStoredEvent(payload);

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: name, ...finalParams });
  }
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, finalParams);
  }
};

export const getStoredEvents = () => safeReadJson(STORAGE_KEY, []);

export const clearStoredEvents = () => {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage write failures.
  }
};

export const getAttributionData = () => getAttribution();

const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export const exportStoredEventsCsv = (filename = 'tts-analytics-events.csv') => {
  if (!isBrowser) return;

  const events = getStoredEvents();
  const header = ['timestamp', 'name', 'path', 'params_json'];
  const rows = events.map((event) => [
    escapeCsv(event.timestamp),
    escapeCsv(event.name),
    escapeCsv(event.path),
    escapeCsv(JSON.stringify(event.params || {}))
  ]);
  const csv = [header.map(escapeCsv).join(','), ...rows.map((row) => row.join(','))].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

