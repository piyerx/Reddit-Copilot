import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { context } from '@devvit/web/client';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { ModQueueResponse } from '../shared/api';
import { UnauthorizedScreen } from './components/UnauthorizedScreen';

export const Splash = () => {
  const [queueTotal, setQueueTotal] = useState<number | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchQueueTotal = async (): Promise<void> => {
      try {
        const response = await fetch('/api/modqueue');
        if (response.status === 403) {
          if (mounted) {
            setUnauthorized(true);
          }
          return;
        }

        if (!response.ok) return;

        const data = (await response.json()) as ModQueueResponse;
        if (mounted) {
          setQueueTotal(data.total);
        }
      } catch {
        // Keep badge hidden when queue total is unavailable.
      }
    };

    void fetchQueueTotal();

    return () => {
      mounted = false;
    };
  }, []);

  if (unauthorized) {
    return <UnauthorizedScreen />;
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-white px-4 py-4 dark:from-emerald-950 dark:via-slate-950 dark:to-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_34%),radial-gradient(circle_at_bottom,rgba(34,197,94,0.12),transparent_28%)] dark:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.22),transparent_34%),radial-gradient(circle_at_bottom,rgba(34,197,94,0.12),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(16,185,129,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.9)_1px,transparent_1px)] [background-size:48px_48px] dark:opacity-[0.08]" />

      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        {/* Icon */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl dark:bg-emerald-300/10" />
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-emerald-500/70 shadow-[0_16px_44px_rgba(16,185,129,0.20)] dark:border-emerald-400/55">
            <img
              src="/modcop_icon_xl.png"
              alt="ModCoPilot icon"
              className="h-full w-full object-cover"
            />
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

        {/* CTA Button */}
        <div className="mt-1.5 flex items-center gap-2">
          <button
            className="flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(22,163,74,0.24)] transition-all hover:scale-[1.02] hover:shadow-[0_14px_28px_rgba(22,163,74,0.30)] active:scale-95 dark:from-emerald-500 dark:to-green-500"
            onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
          >
            Access Moderation Queue
          </button>

          {queueTotal !== null && (
            <span
              aria-label={`${queueTotal} queued posts`}
              title={`${queueTotal} queued posts`}
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-emerald-500/35 bg-emerald-50 px-2.5 text-sm font-bold text-emerald-700 shadow-sm dark:border-emerald-400/35 dark:bg-emerald-950/35 dark:text-emerald-300"
            >
              {queueTotal}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-4 text-xs text-slate-600 opacity-80 transition-opacity duration-300 hover:opacity-100 dark:text-slate-400">
        <span>
          Created by{' '}
          <a
            href="https://github.com/piyerx"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-500 underline underline-offset-2 transition-colors hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300"
          >
            PiyerX
          </a>{' '}
          &amp;{' '}
          <a
            href="https://github.com/paxyz-4"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-500 underline underline-offset-2 transition-colors hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300"
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
