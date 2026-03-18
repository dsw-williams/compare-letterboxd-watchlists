import clsx from 'clsx';

type ProgressStep = { step: string; message: string };

interface ImportProgressProps {
  progress: ProgressStep[];
  error: string | null;
  loading: boolean;
  progressDone: boolean;
}

export default function ImportProgress({ progress, error, loading, progressDone }: ImportProgressProps) {
  return (
    <>
      {progress.length > 0 && (
        <div
          className="mt-4 transition-opacity duration-[1200ms] ease-in-out"
          style={{ opacity: progressDone ? 0 : 1 }}
        >
          {progress.map((p, i) => {
            const isActive = loading && i === progress.length - 1;
            return (
              <div
                key={p.step}
                className={clsx(
                  'flex items-center gap-[10px] py-[5px] text-sm transition-colors duration-300',
                  isActive ? 'text-text-primary' : 'text-text-tertiary'
                )}
              >
                {isActive ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" className="shrink-0 animate-spin">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="#2a2d35" strokeWidth="3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#00c030" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" className="shrink-0">
                    <circle cx="12" cy="12" r="10" fill="#00c030" opacity="0.15"/>
                    <path d="M7 12l3.5 3.5L17 8" fill="none" stroke="#00c030" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {p.message}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="mt-3 px-3 py-[10px] bg-bg-danger border border-border-danger rounded-lg text-text-danger text-13">
          {error}
        </div>
      )}
    </>
  );
}
