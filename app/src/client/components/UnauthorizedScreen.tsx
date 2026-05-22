type UnauthorizedScreenProps = {
  message?: string;
};

export const UnauthorizedScreen = ({
  message = 'This spot is reserved for subreddit moderators.',
}: UnauthorizedScreenProps) => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.04),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-5 flex h-36 w-36 items-center justify-center rounded-full border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <img
            src="/snoo_lock.png"
            alt="Snoo holding a lock"
            className="h-full w-full object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
          />
        </div>

        <p className="mb-2 inline-flex rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-orange-200">
          MODS ONLY
        </p>

        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">
          Hold up, this lane is for mods.
        </h1>

        <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">
          {message} If you’re on the mod team, open ModCoPilot from subreddit Mod Tools.
        </p>
      </div>
    </div>
  );
};