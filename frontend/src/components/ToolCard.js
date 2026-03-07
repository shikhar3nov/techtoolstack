import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { trackEvent } from '../lib/analytics';

const ToolCard = ({ name, link, description, icon, isPinned = false, isAI = false, onTogglePin }) => {
  const handleTogglePin = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!onTogglePin) return;
    onTogglePin(link);
    trackEvent('tool_pin_toggle', {
      target_tool: link,
      pinned: !isPinned
    });
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between hover:bg-gray-50 dark:hover:bg-gray-900"
    >
      {onTogglePin && (
        <button
          type="button"
          onClick={handleTogglePin}
          className={`absolute top-3 right-3 z-10 px-2 py-1 rounded-md text-xs font-semibold border transition-colors ${
            isPinned
              ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700'
              : 'bg-gray-100 text-gray-600 border-gray-300 hover:border-blue-400 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
          }`}
        >
          {isPinned ? 'Pinned' : 'Pin'}
        </button>
      )}

      <Link
        to={link}
        onClick={() =>
          trackEvent('tool_card_click', {
            source: 'home_tools_grid',
            target_tool: link,
            tool_name: name
          })
        }
        className="flex flex-col justify-between h-full"
      >
        <div>
          <div className="flex items-center space-x-3 mb-2 pr-16">
            <div className="text-2xl">{icon}</div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold group-hover:text-blue-600 transition-colors duration-300">
                  {name}
                </h3>
                {isAI && (
                  <span className="text-[11px] px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/20">
                    AI
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{description}</p>
        </div>

        <div className="mt-4">
          <span className="inline-block text-sm text-blue-600 dark:text-blue-400 font-medium border border-blue-500 dark:border-blue-400 px-3 py-1 rounded-md transition duration-200 group-hover:bg-blue-100 dark:group-hover:bg-blue-900">
            View Tool →
          </span>
        </div>
      </Link>
    </motion.div>
  );
};

export default ToolCard;
