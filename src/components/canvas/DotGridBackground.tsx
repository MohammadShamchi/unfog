export function DotGridBackground() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `radial-gradient(
          circle,
          var(--dot-color) var(--dot-size),
          transparent var(--dot-size)
        )`,
        backgroundSize: "var(--dot-gap) var(--dot-gap)",
      }}
    />
  );
}
