import clsx from 'clsx';
import { Loader2, Check } from 'lucide-react';

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
                  <Loader2 size={14} className="shrink-0 animate-spin" color="#00c030" />
                ) : (
                  <Check size={14} className="shrink-0" color="#00c030" />
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
