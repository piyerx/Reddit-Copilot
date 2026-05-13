import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { context } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Sparkles } from 'lucide-react';

export const Splash = () => {
  return (
    <div className="flex relative flex-col justify-center items-center min-h-screen gap-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 px-4">
      {/* Icon */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur-xl opacity-20" />
        <div className="relative bg-white dark:bg-gray-800 rounded-full p-4 shadow-lg">
          <Sparkles className="w-10 h-10 text-orange-500 dark:text-orange-400" />
        </div>
      </div>

      {/* Welcome Message */}
      <div className="flex flex-col items-center gap-3 max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
          Reddit Mod CoPilot
        </h1>
        <p className="text-base text-center text-gray-600 dark:text-gray-300">
          AI-powered moderation dashboard for r/{context.subredditName}
        </p>
      </div>

      {/* Feature List */}
      <div className="flex flex-col gap-2 w-full max-w-sm">
        <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
          <span>✨</span>
          <span><strong>Real-time AI Analysis</strong> of posts and comments</span>
        </div>
        <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
          <span>🚀</span>
          <span><strong>Auto-generate removal reasons</strong> based on subreddit rules</span>
        </div>
        <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
          <span>📝</span>
          <span><strong>Team coordination</strong> with mod notes and decision logs</span>
        </div>
      </div>

      {/* CTA Button */}
      <button
        className="flex items-center justify-center bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-500 dark:to-red-500 text-white font-semibold px-8 py-3 rounded-full cursor-pointer transition-all hover:shadow-lg hover:scale-105 active:scale-95 text-base mt-2"
        onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
      >
        Access Moderation Queue
      </button>

      {/* Footer */}
      <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 text-sm text-gray-600 dark:text-gray-400 opacity-80 hover:opacity-100 transition-opacity duration-300">
  <span>
    Created by{" "}
    <a
      href="https://github.com/piyerx"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-black dark:hover:text-white transition-colors underline underline-offset-2"
    >
      PiyerX
    </a>{" "}
    &amp;{" "}
    <a
      href="https://github.com/paxyz-4"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-black dark:hover:text-white transition-colors underline underline-offset-2"
    >
      Paxyz
    </a>
  </span>
</footer>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
