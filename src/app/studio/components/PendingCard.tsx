import type { PendingGeneration } from "../hooks/useStudio";

type PendingCardProps = {
  pending: PendingGeneration;
  onDismiss: (id: string) => void;
};

/**
 * Placeholder card shown while an image is being generated
 */
export function PendingCard({ pending, onDismiss }: PendingCardProps) {
  const isError = pending.status === "error";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden break-inside-avoid">
      {/* Loading/Error placeholder */}
      <div className="relative aspect-square bg-zinc-800 flex items-center justify-center">
        {isError ? (
          <div className="text-center px-4">
            <svg className="h-10 w-10 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-400 font-medium">Generation failed</p>
            <p className="text-xs text-zinc-500 mt-1">{pending.error}</p>
            <button
              onClick={() => onDismiss(pending.id)}
              className="mt-3 text-xs text-zinc-400 hover:text-white underline"
            >
              Dismiss
            </button>
          </div>
        ) : (
          <div className="text-center">
            {/* Animated loader */}
            <div className="relative w-16 h-16 mx-auto mb-3">
              <div className="absolute inset-0 rounded-full border-2 border-zinc-700" />
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <svg className="absolute inset-0 m-auto h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-sm text-zinc-400">Generating...</p>
          </div>
        )}
      </div>

      {/* Prompt preview */}
      <div className="p-4">
        <p className="text-sm text-zinc-400 line-clamp-2">{pending.prompt}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-400">
            {pending.model}
          </span>
          {!isError && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Processing
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
