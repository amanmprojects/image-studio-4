export type Mode = "generate" | "edit";

type ModeToggleProps = {
  mode: Mode;
  onChange: (mode: Mode) => void;
  disabled?: boolean;
};

/**
 * Toggle between generate and edit modes
 */
export function ModeToggle({ mode, onChange, disabled }: ModeToggleProps) {
  const baseButtonClasses = "px-6 py-2 rounded-full text-sm font-medium transition-all";
  const activeClasses = "bg-emerald-500/90 text-white shadow-sm backdrop-blur-sm";
  const inactiveClasses = "text-zinc-400 hover:text-zinc-200";
  const disabledClasses = "opacity-50 cursor-not-allowed";

  return (
    <div className="inline-flex rounded-full bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 p-1">
      <button
        type="button"
        onClick={() => onChange("generate")}
        disabled={disabled}
        className={`${baseButtonClasses} ${
          mode === "generate" ? activeClasses : inactiveClasses
        } ${disabled ? disabledClasses : ""}`}
      >
        Generate
      </button>
      <button
        type="button"
        onClick={() => onChange("edit")}
        disabled={disabled}
        className={`${baseButtonClasses} ${
          mode === "edit" ? activeClasses : inactiveClasses
        } ${disabled ? disabledClasses : ""}`}
      >
        Edit
      </button>
    </div>
  );
}
