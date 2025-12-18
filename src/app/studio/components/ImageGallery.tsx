import { useDraggable } from "@dnd-kit/core";
import { ImageCard } from "./ImageCard";
import { PendingCard } from "./PendingCard";
import { LoadingSpinner } from "./LoadingSpinner";
import type { ImageResponse } from "@/lib/types";
import type { PendingGeneration } from "../hooks/useStudio";

type ImageGalleryProps = {
  images: ImageResponse[];
  isLoading: boolean;
  loadingSourceImageId: string | null;
  onDownload: (image: ImageResponse) => void;
  onUseAsSource: (image: ImageResponse) => void;
  selectedImageIds?: Set<string>;
  onSelectImage?: (image: ImageResponse, selected: boolean) => void;
  enableSelection?: boolean;
  pendingGenerations?: PendingGeneration[];
  onDismissPending?: (id: string) => void;
};

function DraggableImageCard({
  image,
  onDownload,
  onUseAsSource,
  isLoadingAsSource,
  isSelected,
  onSelect,
  selectedCount,
}: {
  image: ImageResponse;
  onDownload: (image: ImageResponse) => void;
  onUseAsSource: (image: ImageResponse) => void;
  isLoadingAsSource: boolean;
  isSelected: boolean;
  onSelect?: (image: ImageResponse, selected: boolean) => void;
  selectedCount: number;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `image-${image.id}`,
    data: {
      type: "image",
      image,
      isSelected,
      // If dragging a selected image, include count of all selected
      draggedCount: isSelected ? selectedCount : 1,
    },
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <ImageCard
        image={image}
        onDownload={onDownload}
        onUseAsSource={onUseAsSource}
        isLoadingAsSource={isLoadingAsSource}
        isSelected={isSelected}
        onSelect={onSelect}
        isDragging={isDragging}
      />
      {/* Drag count indicator */}
      {isDragging && isSelected && selectedCount > 1 && (
        <div className="fixed pointer-events-none z-50 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full -translate-x-1/2 -translate-y-1/2">
          {selectedCount}
        </div>
      )}
    </div>
  );
}

/**
 * Gallery displaying user's generated images with drag-and-drop support
 */
export function ImageGallery({
  images,
  isLoading,
  loadingSourceImageId,
  onDownload,
  onUseAsSource,
  selectedImageIds = new Set(),
  onSelectImage,
  enableSelection = true,
  pendingGenerations = [],
  onDismissPending,
}: ImageGalleryProps) {
  if (isLoading) {
    return (
      <div className="text-center py-16 text-zinc-500">
        <LoadingSpinner className="mx-auto h-8 w-8 mb-4" />
        <p>Loading your images...</p>
      </div>
    );
  }

  const hasPending = pendingGenerations.length > 0;
  const hasImages = images.length > 0;

  if (!hasPending && !hasImages) {
    return (
      <div className="text-center py-16 text-zinc-500">
        <svg className="mx-auto h-12 w-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p>No images yet. Create your first one above!</p>
      </div>
    );
  }

  const selectedCount = selectedImageIds.size;

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
      {/* Pending generations appear first */}
      {pendingGenerations.map((pending) => (
        <PendingCard
          key={pending.id}
          pending={pending}
          onDismiss={onDismissPending || (() => {})}
        />
      ))}
      
      {/* Completed images */}
      {images.map((image) => (
        <DraggableImageCard
          key={image.id}
          image={image}
          onDownload={onDownload}
          onUseAsSource={onUseAsSource}
          isLoadingAsSource={loadingSourceImageId === image.id}
          isSelected={selectedImageIds.has(image.id)}
          onSelect={enableSelection ? onSelectImage : undefined}
          selectedCount={selectedCount}
        />
      ))}
    </div>
  );
}
