'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-6 gap-4">
      <h1 className="text-2xl font-bold text-text-primary">Something went wrong</h1>
      <p className="text-sm text-text-secondary">{error.message}</p>
      <button onClick={reset} className="text-accent-green text-sm cursor-pointer">Try again</button>
    </div>
  );
}
