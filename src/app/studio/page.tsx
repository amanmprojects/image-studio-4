"use client";

import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { useState } from "react";
import {
  ModeToggle,
  GenerateForm,
  EditForm,
  ImageGallery,
  ErrorAlert,
  FolderSidebar,
} from "./components";
import { useStudio, useFolders } from "./hooks";
import type { ImageResponse } from "@/lib/types";

export default function StudioPage() {
  const {
    folders,
    rootImageCount,
    isLoading: isLoadingFolders,
    selectedFolderId,
    setSelectedFolderId,
    createFolder,
    updateFolder,
    deleteFolder,
    refreshFolders,
  } = useFolders();

  const {
    // Mode
    mode,
    setMode,

    // Shared state
    prompt,
    setPrompt,
    isLoadingImages,
    loadingSourceImageId,
    images,
    error,

    // Pending generations
    pendingGenerations,
    dismissPendingGeneration,

    // Selection state
    selectedImageIds,
    handleSelectImage,
    clearSelection,

    // Generate mode
    generateModel,
    setGenerateModel,
    size,
    setSize,

    // Edit mode
    editModel,
    setEditModel,
    sourceImage,
    sourceImagePreview,
    fileInputRef,

    // Actions
    handleFileSelect,
    clearSourceImage,
    handleGenerate,
    handleEdit,
    handleDownload,
    handleUseAsSource,
    moveImagesToFolder,
    refreshImages,
  } = useStudio(selectedFolderId);

  // Drag state
  const [activeDragImage, setActiveDragImage] = useState<ImageResponse | null>(null);

  // Configure drag sensors with a small delay to allow clicking
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "image") {
      setActiveDragImage(active.data.current.image);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragImage(null);

    if (!over) return;

    // Handle image dropped on folder
    if (active.data.current?.type === "image" && over.data.current?.type === "folder") {
      const targetFolderId = over.data.current.folderId;
      const draggedImage = active.data.current.image as ImageResponse;
      const isSelected = active.data.current.isSelected;

      // If the dragged image is selected, move all selected images
      // Otherwise, just move the dragged image
      const imageIdsToMove = isSelected && selectedImageIds.size > 0
        ? Array.from(selectedImageIds)
        : [draggedImage.id];

      await moveImagesToFolder(imageIdsToMove, targetFolderId);
      await refreshFolders();
    }

    // Handle folder dropped on folder (reparenting)
    if (active.data.current?.type === "folder" && over.data.current?.type === "folder") {
      const draggedFolder = active.data.current.folder;
      const targetFolderId = over.data.current.folderId;
      
      if (draggedFolder.id !== targetFolderId) {
        await updateFolder(draggedFolder.id, { parentId: targetFolderId });
      }
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        {/* Header */}
        <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold tracking-tight">
              <span className="text-emerald-400">Image</span> Studio
            </h1>
            <ModeToggle mode={mode} onChange={setMode} />
            <a
              href="/api/auth/logout"
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Sign out
            </a>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Folder Sidebar */}
          <FolderSidebar
            folders={folders}
            rootImageCount={rootImageCount}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            onCreateFolder={createFolder}
            onRenameFolder={(id, name) => updateFolder(id, { name })}
            onDeleteFolder={deleteFolder}
            onUpdateFolderColor={(id, color) => updateFolder(id, { color })}
            isLoading={isLoadingFolders}
          />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-6 py-8">
              {/* Forms Section */}
              <section className="mb-12">
                {mode === "generate" ? (
                  <GenerateForm
                    prompt={prompt}
                    onPromptChange={setPrompt}
                    model={generateModel}
                    onModelChange={setGenerateModel}
                    size={size}
                    onSizeChange={setSize}
                    onSubmit={handleGenerate}
                  />
                ) : (
                  <EditForm
                    prompt={prompt}
                    onPromptChange={setPrompt}
                    model={editModel}
                    onModelChange={setEditModel}
                    sourceImagePreview={sourceImagePreview}
                    onSubmit={handleEdit}
                    onFileSelect={handleFileSelect}
                    onClearImage={clearSourceImage}
                    hasSourceImage={!!sourceImage}
                    fileInputRef={fileInputRef}
                  />
                )}

                {error && <ErrorAlert message={error} />}
              </section>

              {/* Gallery Header */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-zinc-300">
                    {selectedFolderId === null
                      ? "All Images"
                      : selectedFolderId === "root"
                      ? "Uncategorized"
                      : "Folder Images"}
                  </h2>
                  {selectedImageIds.size > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-zinc-400">
                        {selectedImageIds.size} selected
                      </span>
                      <button
                        onClick={clearSelection}
                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                <ImageGallery
                  images={images}
                  isLoading={isLoadingImages}
                  loadingSourceImageId={loadingSourceImageId}
                  onDownload={handleDownload}
                  onUseAsSource={handleUseAsSource}
                  selectedImageIds={selectedImageIds}
                  onSelectImage={handleSelectImage}
                  enableSelection={true}
                  pendingGenerations={pendingGenerations}
                  onDismissPending={dismissPendingGeneration}
                />
              </section>
            </div>
          </main>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragImage && (
            <div className="w-32 h-32 bg-zinc-800 rounded-lg shadow-2xl border border-zinc-600 overflow-hidden opacity-80">
              <img
                src={activeDragImage.thumbnailUrl || activeDragImage.url}
                alt=""
                className="w-full h-full object-cover"
              />
              {selectedImageIds.has(activeDragImage.id) && selectedImageIds.size > 1 && (
                <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                  {selectedImageIds.size}
                </div>
              )}
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
