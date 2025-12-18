"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GENERATION_MODELS, VARIATION_MODELS, ImageModel, ImageSize } from "@/lib/models";
import type { ImageResponse } from "@/lib/types";
import type { Mode } from "../components/ModeToggle";

/**
 * Pending generation placeholder - shows as loading card in gallery
 */
export type PendingGeneration = {
  id: string;
  prompt: string;
  model: string;
  status: "pending" | "error";
  error?: string;
  createdAt: Date;
};

/**
 * Custom hook that manages all studio page state and actions
 */
export function useStudio(folderId: string | null = null) {
  // Mode state
  const [mode, setMode] = useState<Mode>("generate");

  // Shared state
  const [prompt, setPrompt] = useState("");
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [isLoadingSourceImage, setIsLoadingSourceImage] = useState(false);
  const [loadingSourceImageId, setLoadingSourceImageId] = useState<string | null>(null);
  const [images, setImages] = useState<ImageResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Pending generations (shown as loading placeholders)
  const [pendingGenerations, setPendingGenerations] = useState<PendingGeneration[]>([]);

  // Selection state for bulk operations
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());

  // Generate mode state
  const [generateModel, setGenerateModel] = useState<ImageModel>(
    GENERATION_MODELS[0]?.id as ImageModel
  );
  const [size, setSize] = useState<ImageSize>("1024x1024");

  // Edit mode state
  const [editModel, setEditModel] = useState<ImageModel>(
    VARIATION_MODELS[0]?.id as ImageModel
  );
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceImagePreview, setSourceImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = useCallback(async (folderFilter: string | null) => {
    try {
      setIsLoadingImages(true);
      const params = new URLSearchParams();
      if (folderFilter !== null) {
        params.set("folderId", folderFilter);
      }
      const url = `/api/images${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);
      if (res.status === 401) {
        window.location.href = "/api/auth/login";
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch images");
      const data = await res.json();
      setImages(data.images || []);
      // Clear selection when folder changes
      setSelectedImageIds(new Set());
    } catch (err) {
      console.error("Error fetching images:", err);
    } finally {
      setIsLoadingImages(false);
    }
  }, []);

  // Fetch images when folder changes
  useEffect(() => {
    fetchImages(folderId);
  }, [folderId, fetchImages]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview URL
    setSourceImagePreview(URL.createObjectURL(file));

    // Read as base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setSourceImage(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const clearSourceImage = useCallback(() => {
    setSourceImage(null);
    setSourceImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleGenerate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // Create a pending generation placeholder
    const pendingId = crypto.randomUUID();
    const currentPrompt = prompt;
    const currentModel = generateModel;
    const currentSize = size;
    const targetFolderId = folderId && folderId !== "root" ? folderId : null;

    // Add placeholder and clear form immediately
    setPendingGenerations((prev) => [
      {
        id: pendingId,
        prompt: currentPrompt,
        model: currentModel,
        status: "pending",
        createdAt: new Date(),
      },
      ...prev,
    ]);
    setPrompt("");
    setError(null);

    try {
      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: currentPrompt,
          size: currentSize,
          model: currentModel,
          folderId: targetFolderId,
        }),
      });

      if (res.status === 401) {
        window.location.href = "/api/auth/login";
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate image");
      }

      const newImage = await res.json();
      
      // Remove placeholder and add real image
      setPendingGenerations((prev) => prev.filter((p) => p.id !== pendingId));
      setImages((prev) => [newImage, ...prev]);
    } catch (err) {
      // Mark placeholder as error
      setPendingGenerations((prev) =>
        prev.map((p) =>
          p.id === pendingId
            ? { ...p, status: "error" as const, error: err instanceof Error ? err.message : "Failed" }
            : p
        )
      );
    }
  }, [prompt, size, generateModel, folderId]);

  // Remove a failed pending generation
  const dismissPendingGeneration = useCallback((id: string) => {
    setPendingGenerations((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleEdit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !sourceImage) return;

    // Create a pending generation placeholder
    const pendingId = crypto.randomUUID();
    const currentPrompt = prompt;
    const currentModel = editModel;
    const currentSourceImage = sourceImage;
    const targetFolderId = folderId && folderId !== "root" ? folderId : null;

    // Add placeholder and clear form immediately
    setPendingGenerations((prev) => [
      {
        id: pendingId,
        prompt: `[Variation] ${currentPrompt}`,
        model: currentModel,
        status: "pending",
        createdAt: new Date(),
      },
      ...prev,
    ]);
    setPrompt("");
    clearSourceImage();
    setError(null);

    try {
      const res = await fetch("/api/images/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceImage: currentSourceImage,
          prompt: currentPrompt,
          model: currentModel,
          folderId: targetFolderId,
        }),
      });

      if (res.status === 401) {
        window.location.href = "/api/auth/login";
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to edit image");
      }

      const newImage = await res.json();
      
      // Remove placeholder and add real image
      setPendingGenerations((prev) => prev.filter((p) => p.id !== pendingId));
      setImages((prev) => [newImage, ...prev]);
    } catch (err) {
      // Mark placeholder as error
      setPendingGenerations((prev) =>
        prev.map((p) =>
          p.id === pendingId
            ? { ...p, status: "error" as const, error: err instanceof Error ? err.message : "Failed" }
            : p
        )
      );
    }
  }, [prompt, sourceImage, editModel, clearSourceImage, folderId]);

  const handleDownload = useCallback((img: ImageResponse) => {
    fetch(`/api/images/${img.id}/download`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to download");
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `image-${img.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error("Download failed:", err);
        setError("Failed to download image");
      });
  }, []);

  const handleUseAsSource = useCallback((img: ImageResponse) => {
    setIsLoadingSourceImage(true);
    setLoadingSourceImageId(img.id);
    
    // Fetch through our API to avoid CORS issues with S3
    fetch(`/api/images/${img.id}/download`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch image");
        return res.blob();
      })
      .then((blob) => {
        // Create a local URL for preview
        setSourceImagePreview(URL.createObjectURL(blob));
        // Convert to base64 for the API
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          setSourceImage(base64);
          setMode("edit");
          setIsLoadingSourceImage(false);
          setLoadingSourceImageId(null);
        };
        reader.readAsDataURL(blob);
      })
      .catch((err) => {
        console.error("Failed to load image:", err);
        setError("Failed to load image for editing");
        setIsLoadingSourceImage(false);
        setLoadingSourceImageId(null);
      });
  }, []);

  // Selection handlers
  const handleSelectImage = useCallback((image: ImageResponse, selected: boolean) => {
    setSelectedImageIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(image.id);
      } else {
        next.delete(image.id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedImageIds(new Set());
  }, []);

  const selectAll = useCallback(() => {
    setSelectedImageIds(new Set(images.map((img) => img.id)));
  }, [images]);

  // Move images to folder
  const moveImagesToFolder = useCallback(async (imageIds: string[], targetFolderId: string | null) => {
    try {
      const res = await fetch("/api/images/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds, folderId: targetFolderId }),
      });

      if (res.status === 401) {
        window.location.href = "/api/auth/login";
        return false;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to move images");
      }

      // Refresh images after move
      await fetchImages(folderId);
      clearSelection();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move images");
      return false;
    }
  }, [folderId, fetchImages, clearSelection]);

  return {
    // Mode
    mode,
    setMode,
    
    // Shared state
    prompt,
    setPrompt,
    isLoadingImages,
    isLoadingSourceImage,
    loadingSourceImageId,
    images,
    error,
    
    // Pending generations (loading placeholders)
    pendingGenerations,
    dismissPendingGeneration,
    
    // Selection state
    selectedImageIds,
    handleSelectImage,
    clearSelection,
    selectAll,
    
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
    refreshImages: () => fetchImages(folderId),
  };
}
