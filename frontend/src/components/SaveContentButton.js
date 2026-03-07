import React, { useEffect, useState } from 'react';
import { isSavedContent, toggleSavedContent } from '../lib/contentLibrary';
import { trackEvent } from '../lib/analytics';

const SaveContentButton = ({ type, slug, source, className = '', size = 'sm' }) => {
  const [saved, setSaved] = useState(() => isSavedContent(type, slug));

  useEffect(() => {
    setSaved(isSavedContent(type, slug));
  }, [type, slug]);

  useEffect(() => {
    const sync = () => setSaved(isSavedContent(type, slug));
    window.addEventListener('storage', sync);
    window.addEventListener('tts:saved-content-updated', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('tts:saved-content-updated', sync);
    };
  }, [type, slug]);

  const toggle = () => {
    const nextLibrary = toggleSavedContent(type, slug);
    const nextSaved = (nextLibrary[type] || []).includes(slug);
    setSaved(nextSaved);

    trackEvent('saved_content_toggle', {
      content_type: type,
      content_slug: slug,
      source: source || 'unknown',
      action: nextSaved ? 'save' : 'unsave'
    });
  };

  const sizeClass = size === 'md' ? 'px-3 py-2 text-sm' : 'px-2.5 py-1.5 text-xs';

  return (
    <button
      type="button"
      onClick={toggle}
      className={`${sizeClass} rounded-lg border font-semibold transition-colors ${
        saved
          ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700'
          : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-300 hover:text-emerald-700 dark:bg-slate-800 dark:text-gray-200 dark:border-gray-600 dark:hover:border-emerald-600 dark:hover:text-emerald-300'
      } ${className}`}
      aria-pressed={saved}
      title={saved ? 'Saved to your library' : 'Save to your library'}
    >
      {saved ? 'Saved' : 'Save'}
    </button>
  );
};

export default SaveContentButton;
