interface PillProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function Pill({ active, onClick, children }: PillProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-border text-text-secondary hover:border-text-secondary hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}
