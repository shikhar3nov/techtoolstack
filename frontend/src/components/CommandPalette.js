import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';

const CommandPalette = ({ commands = [] }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands.slice(0, 12);
    return commands
      .filter((item) => {
        const searchable = `${item.label} ${item.group || ''} ${item.keywords || ''}`.toLowerCase();
        return searchable.includes(q);
      })
      .slice(0, 12);
  }, [commands, query]);

  useEffect(() => {
    const handler = (event) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (isShortcut) {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      if (!open) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, Math.max(filteredCommands.length - 1, 0)));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      } else if (event.key === 'Enter') {
        const selected = filteredCommands[activeIndex];
        if (!selected) return;
        event.preventDefault();
        navigate(selected.path);
        trackEvent('command_palette_navigate', {
          target_path: selected.path,
          command_label: selected.label
        });
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeIndex, filteredCommands, navigate, open]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(timer);
  }, [open, query]);

  useEffect(() => {
    if (open) {
      setOpen(false);
      setQuery('');
    }
    // Close palette on route change.
  }, [location.pathname]);

  const selectCommand = (command) => {
    navigate(command.path);
    trackEvent('command_palette_navigate', {
      target_path: command.path,
      command_label: command.label
    });
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/95 dark:bg-gray-800/95 text-gray-700 dark:text-gray-200 text-sm shadow-lg hover:border-blue-400"
      >
        Quick Open <span className="text-xs opacity-70">Cmd/Ctrl+K</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            className="max-w-2xl mx-auto mt-16 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tools, workflows, guides, solutions..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="max-h-[420px] overflow-auto p-2">
              {filteredCommands.length === 0 && (
                <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">No matching result found.</div>
              )}

              {filteredCommands.map((command, index) => (
                <button
                  key={`${command.path}-${command.label}`}
                  type="button"
                  onClick={() => selectCommand(command)}
                  className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                    index === activeIndex
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{command.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{command.group}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CommandPalette;

