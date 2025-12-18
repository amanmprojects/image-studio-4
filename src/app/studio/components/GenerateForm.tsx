import { GENERATION_MODELS, IMAGE_SIZES, ImageModel, ImageSize } from "@/lib/models";

type GenerateFormProps = {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  model: ImageModel;
  onModelChange: (model: ImageModel) => void;
  size: ImageSize;
  onSizeChange: (size: ImageSize) => void;
  onSubmit: (e: React.FormEvent) => void;
};

/**
 * Form for generating new images - always enabled, generates show as placeholders in gallery
 */
export function GenerateForm({
  prompt,
  onPromptChange,
  model,
  onModelChange,
  size,
  onSizeChange,
  onSubmit,
}: GenerateFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && prompt.trim()) {
              e.preventDefault();
              onSubmit(e as unknown as React.FormEvent);
            }
          }}
          placeholder="Describe the image you want to create..."
          rows={3}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none transition-all"
        />
        <span className="absolute bottom-2 right-2 text-xs text-zinc-600">⌘/Ctrl + Enter to generate</span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-400">Model:</label>
          <select
            value={model}
            onChange={(e) => onModelChange(e.target.value as ImageModel)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            {GENERATION_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-400">Size:</label>
          <select
            value={size}
            onChange={(e) => onSizeChange(e.target.value as ImageSize)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            {IMAGE_SIZES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={!prompt.trim()}
          className="ml-auto bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Generate
        </button>
      </div>
    </form>
  );
}
