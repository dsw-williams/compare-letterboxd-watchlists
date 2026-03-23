'use client';
import { useState } from 'react';
import { readJsonStream } from '@/lib/stream-reader';

type ProgressStep = { step: string; message: string };

interface UseImportStreamOptions {
  endpoint: string;
  buildBody: (value: string) => object;
  onSuccess: () => Promise<void>;
}

export function useImportStream({ endpoint, buildBody, onSuccess }: UseImportStreamOptions) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progressDone, setProgressDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    setProgress([]);
    setError(null);
    setProgressDone(false);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody(value.trim())),
      });

      if (!res.body) throw new Error('No response stream');

      for await (const data of readJsonStream(res.body)) {
        if (data.step === 'error') {
          setError(data.message);
        } else if (data.step === 'done') {
          setProgressDone(true);
          setTimeout(() => setProgress([]), 1800);
          setValue('');
          await onSuccess();
        } else {
          setProgress((prev) => {
            const filtered = prev.filter((p) => p.step !== data.step);
            return [...filtered, { step: data.step, message: data.message }];
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  return { value, setValue, loading, progress, error, progressDone, handleSubmit };
}
