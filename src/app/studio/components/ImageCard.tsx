import Image from "next/image";
import { IMAGE_MODELS, VARIATION_MODELS } from "@/lib/models";
import type { ImageResponse } from "@/lib/types";

type ImageCardProps = {
  image: ImageResponse;
  onDownload: (image: ImageResponse) => void;
  onUseAsSource: (image: ImageResponse) => void;
  isLoadingAsSource?: boolean;
  isSelected?: boolean;
  onSelect?: (image: ImageResponse, selected: boolean) => void;
  isDragging?: boolean;
};

function getModelLabel(modelId: string): string {
  const model = IMAGE_MODELS.find((m) => m.id === modelId);
  return model?.label ?? modelId;
}

function getAspectRatioClass(width: number, height: number): string {
  const ratio = width / height;
  if (ratio > 1.2) return "aspect-[1440/1024]";
  if (ratio < 0.8) return "aspect-[1024/1440]";
  return "aspect-square";
}

/**
 * Individual image card in the gallery
 */
export function ImageCard({ image, onDownload, onUseAsSource, isLoadingAsSource, isSelected, onSelect, isDragging }: ImageCardProps) {
  // Use thumbnail URL if available for gallery display (much smaller file size)
  const displayUrl = image.thumbnailUrl || image.url;
  
  return (
    <div 
      className={`group bg-zinc-900 border rounded-xl overflow-hidden transition-all break-inside-avoid ${
        isSelected 
          ? "border-emerald-500 ring-2 ring-emerald-500/20" 
          : "border-zinc-800 hover:border-zinc-700"
      } ${isDragging ? "opacity-50 scale-95" : ""}`}
    >
      {/* Selection checkbox */}
      {onSelect && (
        <div className="absolute top-2 left-2 z-20">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(image, e.target.checked)}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900 cursor-pointer"
          />
        </div>
      )}
      <div className={`relative ${getAspectRatioClass(image.width, image.height)} bg-zinc-800`}>
        <Image
          src={displayUrl}
          alt={image.prompt}
          fill
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIRAAAgEDBAMBAAAAAAAAAAAAAQIDAAQRBQYSIRMxQVH/xAAVAQEBAAAAAAAAAAAAAAAAAAADBP/EABkRAAIDAQAAAAAAAAAAAAAAAAEDABEhAv/aAAwDAQACEQMRAD8AqbU3Hqmn7gh0+8v7ie0lOYpTKSh/uPuKKQO4qPHQcj8+0pTXQWHUFYWt0pjsn//Z"
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Loading overlay */}
        {isLoadingAsSource && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-white">
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm font-medium">Loading...</span>
            </div>
          </div>
        )}
        {/* Overlay buttons */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={() => onDownload(image)}
            className="bg-white/90 hover:bg-white text-zinc-900 px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          {VARIATION_MODELS.length > 0 && (
            <button
              onClick={() => onUseAsSource(image)}
              disabled={isLoadingAsSource}
              className={`bg-emerald-500/90 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-colors ${isLoadingAsSource ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isLoadingAsSource ? (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              {isLoadingAsSource ? "Loading..." : "Vary"}
            </button>
          )}
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-zinc-300 line-clamp-2">{image.prompt}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-300">
            {getModelLabel(image.model)}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800/50 text-zinc-400">
            {image.provider}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800/50 text-zinc-400">
            {image.width}×{image.height}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800/50 text-zinc-400">
            {new Date(image.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
