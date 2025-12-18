import Image from "next/image";
import { VARIATION_MODELS, ImageModel } from "@/lib/models";

type EditFormProps = {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  model: ImageModel;
  onModelChange: (model: ImageModel) => void;
  sourceImagePreview: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
  hasSourceImage: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
};

/**
 * Form for editing/varying existing images - always enabled, variations show as placeholders in gallery
 */
export function EditForm({
  prompt,
  onPromptChange,
  model,
  onModelChange,
  sourceImagePreview,
  onSubmit,
  onFileSelect,
  onClearImage,
  hasSourceImage,
  fileInputRef,
}: EditFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Image Upload Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ImageUploadArea
          sourceImagePreview={sourceImagePreview}
          onClearImage={onClearImage}
          onFileSelect={onFileSelect}
          fileInputRef={fileInputRef}
        />

        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && prompt.trim() && hasSourceImage) {
                  e.preventDefault();
                  onSubmit(e as unknown as React.FormEvent);
                }
              }}
              placeholder="Describe how you want to modify the image..."
              rows={4}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none transition-all"
            />
            <span className="absolute bottom-2 right-2 text-xs text-zinc-600">⌘/Ctrl + Enter</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-400">Model:</label>
            <select
              value={model}
              onChange={(e) => onModelChange(e.target.value as ImageModel)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              {VARIATION_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!prompt.trim() || !hasSourceImage}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Create Variation
      </button>
    </form>
  );
}

type ImageUploadAreaProps = {
  sourceImagePreview: string | null;
  onClearImage: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
};

// Helper to safely assign ref
const setInputRef = (ref: React.RefObject<HTMLInputElement | null>) => (el: HTMLInputElement | null) => {
  (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
};

function ImageUploadArea({
  sourceImagePreview,
  onClearImage,
  onFileSelect,
  fileInputRef,
}: ImageUploadAreaProps) {
  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-4 transition-colors ${
        sourceImagePreview
          ? "border-emerald-500 bg-emerald-500/5"
          : "border-zinc-700 hover:border-zinc-600"
      }`}
    >
      {sourceImagePreview ? (
        <div className="relative aspect-square">
          <Image
            src={sourceImagePreview}
            alt="Source image"
            fill
            className="object-contain rounded-lg"
          />
          <button
            type="button"
            onClick={onClearImage}
            className="absolute top-2 right-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 p-1.5 rounded-lg transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center aspect-square cursor-pointer">
          <svg className="h-12 w-12 text-zinc-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-zinc-400 text-sm">Click to upload source image</span>
          <span className="text-zinc-500 text-xs mt-1">or drag and drop</span>
          <input
            ref={setInputRef(fileInputRef)}
            type="file"
            accept="image/*"
            onChange={onFileSelect}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
