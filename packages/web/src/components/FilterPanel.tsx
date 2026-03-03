type FilterPanelProps = {
  categories: string[];
  selectedCategories: string[];
  onCategoriesChange: (v: string[]) => void;
  selectedRuntimes: string[];
  onRuntimesChange: (v: string[]) => void;
  selectedTransports: string[];
  onTransportsChange: (v: string[]) => void;
};

const RUNTIMES = ["node", "python", "docker", "binary"] as const;
const TRANSPORTS = ["stdio", "remote"] as const;

function CheckIcon() {
  return (
    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 6l2.5 2.5 4.5-5"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
        checked ? "bg-accent border-accent" : "border-border"
      }`}
      aria-hidden="true"
    >
      {checked && <CheckIcon />}
    </span>
  );
}

function FilterOption({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onClick}
      className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-left transition-colors hover:bg-surface-hover"
    >
      <Checkbox checked={checked} />
      <span className={`text-sm ${checked ? "text-text" : "text-text-secondary"}`}>{label}</span>
    </button>
  );
}

function toggle(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function FilterPanel({
  categories,
  selectedCategories,
  onCategoriesChange,
  selectedRuntimes,
  onRuntimesChange,
  selectedTransports,
  onTransportsChange,
}: FilterPanelProps) {
  return (
    <div>
      {/* Category */}
      <fieldset>
        <legend className="text-xs h-7.5 text-text-secondary uppercase tracking-wider font-medium mb-3 flex items-center">
          Category
        </legend>
        <div className="space-y-0.5">
          <FilterOption
            label="All"
            checked={selectedCategories.length === 0}
            onClick={() => onCategoriesChange([])}
          />
          {categories.map((cat) => (
            <FilterOption
              key={cat}
              label={cat}
              checked={selectedCategories.includes(cat)}
              onClick={() => onCategoriesChange(toggle(selectedCategories, cat))}
            />
          ))}
        </div>
      </fieldset>

      {/* Runtime */}
      <fieldset className="mt-6">
        <legend className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-3">
          Runtime
        </legend>
        <div className="space-y-0.5">
          <FilterOption
            label="All"
            checked={selectedRuntimes.length === 0}
            onClick={() => onRuntimesChange([])}
          />
          {RUNTIMES.map((rt) => (
            <FilterOption
              key={rt}
              label={rt}
              checked={selectedRuntimes.includes(rt)}
              onClick={() => onRuntimesChange(toggle(selectedRuntimes, rt))}
            />
          ))}
        </div>
      </fieldset>

      {/* Transport */}
      <fieldset className="mt-6">
        <legend className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-3">
          Transport
        </legend>
        <div className="space-y-0.5">
          <FilterOption
            label="All"
            checked={selectedTransports.length === 0}
            onClick={() => onTransportsChange([])}
          />
          {TRANSPORTS.map((tp) => (
            <FilterOption
              key={tp}
              label={tp}
              checked={selectedTransports.includes(tp)}
              onClick={() => onTransportsChange(toggle(selectedTransports, tp))}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
