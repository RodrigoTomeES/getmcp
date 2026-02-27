interface PillProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  role?: "tab";
}

export function Pill({ active, onClick, children, role }: PillProps) {
  return (
    <button
      onClick={onClick}
      role={role}
      {...(role === "tab" ? { "aria-selected": active } : { "aria-pressed": active })}
      className={`text-xs px-3 py-2 rounded-full border font-medium transition-colors ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-border text-text-secondary hover:border-text-secondary hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}
