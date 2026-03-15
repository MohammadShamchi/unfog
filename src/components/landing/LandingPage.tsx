import Link from "next/link";
import { Brain, Sparkles, RefreshCw } from "lucide-react";

function DemoNode({
  type,
  label,
  description,
  color,
}: {
  type: string;
  label: string;
  description: string;
  color: string;
}) {
  return (
    <div
      className="rounded-md border px-3 py-2.5 min-w-[180px] max-w-[220px]"
      style={{
        backgroundColor: "var(--bg-elevated)",
        borderColor: "var(--border)",
        borderLeftWidth: 3,
        borderLeftColor: color,
      }}
    >
      <span
        className="inline-block rounded-sm px-1.5 py-0.5 text-[9px] font-display font-semibold uppercase tracking-wider mb-1"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {type}
      </span>
      <p className="font-display text-xs font-semibold text-text-primary">{label}</p>
      <p className="mt-0.5 font-body text-[10px] text-text-secondary line-clamp-2">
        {description}
      </p>
    </div>
  );
}

function StepCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3 max-w-[240px]">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-lg"
        style={{ backgroundColor: "var(--bg-elevated)" }}
      >
        {icon}
      </div>
      <h3 className="font-display text-sm font-semibold text-text-primary">{title}</h3>
      <p className="font-body text-xs text-text-secondary">{description}</p>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-canvas)" }}>
      {/* Dot grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--dot-color) var(--dot-size), transparent var(--dot-size))",
          backgroundSize: "var(--dot-gap) var(--dot-gap)",
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-bold tracking-tight text-text-primary">
            unfog
          </span>
          <span className="text-xs font-body text-text-muted">v0.1</span>
        </div>
        <Link
          href="/canvas"
          className="font-display text-sm font-semibold px-4 py-2 rounded-sm transition-colors"
          style={{
            backgroundColor: "var(--accent)",
            color: "var(--bg-canvas)",
          }}
        >
          Open editor
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center px-8 pt-20 pb-24">
        <h1 className="font-display text-5xl font-bold text-text-primary text-center max-w-[600px] leading-tight">
          Dump your thoughts. See them clearly.
        </h1>
        <p className="mt-5 font-body text-lg text-text-secondary text-center max-w-[480px]">
          AI turns your messy thinking into visual clarity maps. Describe a
          problem, see the structure, refine it together.
        </p>
        <Link
          href="/canvas"
          className="mt-8 inline-flex items-center gap-2 font-display text-base font-semibold px-6 py-3 rounded-sm transition-opacity hover:opacity-90"
          style={{
            backgroundColor: "var(--accent)",
            color: "var(--bg-canvas)",
          }}
        >
          Start thinking
          <span aria-hidden="true">&rarr;</span>
        </Link>

        {/* Demo visual */}
        <div className="mt-16 flex flex-wrap items-start justify-center gap-4">
          <DemoNode
            type="Problem"
            label="Revenue declining"
            description="Sales down 20% quarter over quarter"
            color="#EF4444"
          />
          <div className="flex flex-col gap-4 pt-8">
            <DemoNode
              type="Cause"
              label="Slow product delivery"
              description="Engineering bottleneck on key features"
              color="#F59E0B"
            />
            <DemoNode
              type="Cause"
              label="High team turnover"
              description="Lost 3 senior engineers in Q4"
              color="#F59E0B"
            />
          </div>
          <DemoNode
            type="Solution"
            label="Hire tech lead"
            description="Dedicated hire to unblock delivery pipeline"
            color="#5FE0C1"
          />
        </div>
      </section>

      {/* How it works */}
      <section
        className="relative z-10 py-20 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <h2 className="font-display text-2xl font-bold text-text-primary text-center mb-12">
          How it works
        </h2>
        <div className="flex flex-wrap justify-center gap-16 px-8">
          <StepCard
            icon={<Brain size={24} style={{ color: "var(--accent)" }} />}
            title="Describe"
            description="Write your messy thoughts in any language. No structure needed."
          />
          <StepCard
            icon={<Sparkles size={24} style={{ color: "var(--accent)" }} />}
            title="Visualize"
            description="AI maps problems, causes, and solutions into a clarity map."
          />
          <StepCard
            icon={<RefreshCw size={24} style={{ color: "var(--accent)" }} />}
            title="Refine"
            description="Edit the map. AI re-analyzes. Repeat until it clicks."
          />
        </div>
      </section>

      {/* Footer */}
      <footer
        className="relative z-10 py-8 text-center border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <p className="font-body text-xs text-text-muted">
          Built by Mohammad Shamchi &middot; v0.1
        </p>
      </footer>
    </div>
  );
}
