type PillProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  role?: "tab" | "radio";
} & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "role" | "className" | "children" | "aria-pressed" | "aria-selected" | "aria-checked"
>;

export function Pill({ active, onClick, children, role, ...rest }: PillProps) {
  const ariaProps =
    role === "tab"
      ? { "aria-selected": active }
      : role === "radio"
        ? { "aria-checked": active }
        : { "aria-pressed": active };

  return (
    <button
      onClick={onClick}
      role={role}
      {...ariaProps}
      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-border text-text-secondary hover:border-text-secondary hover:text-text"
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}
