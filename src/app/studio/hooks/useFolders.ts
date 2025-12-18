"use client";

import { useState, useEffect, useCallback } from "react";
import type { FolderResponse } from "@/lib/types";

type UseFoldersReturn = {
  folders: FolderResponse[];
  rootImageCount: number;
  isLoading: boolean;
  error: string | null;
  selectedFolderId: string | null; // null = all, "root" = uncategorized
  setSelectedFolderId: (id: string | null) => void;
  createFolder: (name: string, parentId?: string | null, color?: string) => Promise<FolderResponse | null>;
  updateFolder: (id: string, updates: Partial<{ name: string; parentId: string | null; color: string; icon: string }>) => Promise<boolean>;
  deleteFolder: (id: string) => Promise<boolean>;
  refreshFolders: () => Promise<void>;
};

/**
 * Custom hook for managing folders
 */
export function useFolders(): UseFoldersReturn {
  const [folders, setFolders] = useState<FolderResponse[]>([]);
  const [rootImageCount, setRootImageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const fetchFolders = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/folders");
      if (res.status === 401) {
        window.location.href = "/api/auth/login";
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch folders");
      const data = await res.json();
      setFolders(data.folders || []);
      setRootImageCount(data.rootImageCount || 0);
    } catch (err) {
      console.error("Error fetching folders:", err);
      setError(err instanceof Error ? err.message : "Failed to load folders");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const createFolder = useCallback(async (
    name: string,
    parentId?: string | null,
    color?: string
  ): Promise<FolderResponse | null> => {
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId, color }),
      });

      if (res.status === 401) {
        window.location.href = "/api/auth/login";
        return null;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create folder");
      }

      const newFolder = await res.json();
      await fetchFolders(); // Refresh the tree
      return newFolder;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create folder");
      return null;
    }
  }, [fetchFolders]);

  const updateFolder = useCallback(async (
    id: string,
    updates: Partial<{ name: string; parentId: string | null; color: string; icon: string }>
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/folders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.status === 401) {
        window.location.href = "/api/auth/login";
        return false;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update folder");
      }

      await fetchFolders(); // Refresh the tree
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update folder");
      return false;
    }
  }, [fetchFolders]);

  const deleteFolder = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/folders/${id}`, {
        method: "DELETE",
      });

      if (res.status === 401) {
        window.location.href = "/api/auth/login";
        return false;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete folder");
      }

      // If we deleted the currently selected folder, go back to all
      if (selectedFolderId === id) {
        setSelectedFolderId(null);
      }

      await fetchFolders(); // Refresh the tree
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete folder");
      return false;
    }
  }, [fetchFolders, selectedFolderId]);

  return {
    folders,
    rootImageCount,
    isLoading,
    error,
    selectedFolderId,
    setSelectedFolderId,
    createFolder,
    updateFolder,
    deleteFolder,
    refreshFolders: fetchFolders,
  };
}
