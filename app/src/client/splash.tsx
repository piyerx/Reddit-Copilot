import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { context } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

export const Splash = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-white px-4 py-4 dark:from-emerald-950 dark:via-slate-950 dark:to-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_34%),radial-gradient(circle_at_bottom,rgba(34,197,94,0.12),transparent_28%)] dark:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.22),transparent_34%),radial-gradient(circle_at_bottom,rgba(34,197,94,0.12),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(16,185,129,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.9)_1px,transparent_1px)] [background-size:48px_48px] dark:opacity-[0.08]" />

      {/* Icon */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl dark:bg-emerald-300/10" />
        <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-emerald-200 bg-white/92 p-2.5 shadow-[0_16px_44px_rgba(16,185,129,0.20)] backdrop-blur dark:border-emerald-500/20 dark:bg-slate-950/70">
          <div className="relative h-full w-full overflow-hidden rounded-full ring-1 ring-emerald-200/80 dark:ring-emerald-400/20">
            <img
              src="/modcop_icon_xl.png"
              alt="ModCoPilot icon"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="flex max-w-sm flex-col items-center gap-1.5">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
          Reddit Mod CoPilot
        </h1>
        <p className="text-center text-sm leading-5 text-slate-600 dark:text-slate-300">
          AI-powered moderation dashboard for r/{context.subredditName}
        </p>
      </div>

      {/* Feature List */}
      <div className="flex w-full max-w-xs flex-col gap-1.5">
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-white/80 px-3 py-2 text-xs text-slate-700 shadow-sm dark:border-emerald-500/15 dark:bg-slate-950/40 dark:text-slate-200">
          <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
          <span className="leading-5"><strong>Real-time AI Analysis</strong> of posts and comments</span>
        </div>
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-white/80 px-3 py-2 text-xs text-slate-700 shadow-sm dark:border-emerald-500/15 dark:bg-slate-950/40 dark:text-slate-200">
          <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
          <span className="leading-5"><strong>Auto-generate removal reasons</strong> based on subreddit rules</span>
        </div>
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-white/80 px-3 py-2 text-xs text-slate-700 shadow-sm dark:border-emerald-500/15 dark:bg-slate-950/40 dark:text-slate-200">
          <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
          <span className="leading-5"><strong>Team coordination</strong> with mod notes and decision logs</span>
        </div>
      </div>

      {/* CTA Button */}
      <button
        className="mt-1.5 flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(22,163,74,0.24)] transition-all hover:scale-[1.02] hover:shadow-[0_14px_28px_rgba(22,163,74,0.30)] active:scale-95 dark:from-emerald-500 dark:to-green-500"
        onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
      >
        Access Moderation Queue
      </button>

      {/* Footer */}
      <footer className="mt-1 text-xs text-slate-600 opacity-80 transition-opacity duration-300 hover:opacity-100 dark:text-slate-400">
        <span>
          Created by{' '}
          <a
            href="https://github.com/piyerx"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors hover:text-slate-950 dark:hover:text-white"
          >
            PiyerX
          </a>{' '}
          &amp;{' '}
          <a
            href="https://github.com/paxyz-4"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors hover:text-slate-950 dark:hover:text-white"
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
