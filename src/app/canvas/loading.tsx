export default function CanvasLoading() {
  return (
    <div
      className="flex h-screen items-center justify-center"
      style={{ backgroundColor: "var(--bg-canvas)" }}
    >
      <span className="font-display text-2xl font-bold text-text-primary animate-pulse">
        unfog
      </span>
    </div>
  );
}
