"use client";

export default function CanvasError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="flex h-screen flex-col items-center justify-center gap-4"
      style={{ backgroundColor: "var(--bg-canvas)" }}
    >
      <h2 className="font-display text-lg font-semibold text-text-primary">
        Something went wrong
      </h2>
      <p className="font-body text-sm text-text-secondary">
        The canvas encountered an error. Try again.
      </p>
      <button
        onClick={reset}
        className="font-display text-sm font-semibold px-4 py-2 rounded-sm transition-opacity hover:opacity-90"
        style={{
          backgroundColor: "var(--accent)",
          color: "var(--bg-canvas)",
        }}
      >
        Try again
      </button>
    </div>
  );
}
