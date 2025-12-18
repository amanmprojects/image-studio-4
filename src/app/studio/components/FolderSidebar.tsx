"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { FolderTree } from "./FolderTree";
import type { FolderResponse } from "@/lib/types";

type FolderSidebarProps = {
  folders: FolderResponse[];
  rootImageCount: number;
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onCreateFolder: (name: string, parentId: string | null) => Promise<FolderResponse | null>;
  onRenameFolder: (id: string, name: string) => Promise<boolean>;
  onDeleteFolder: (id: string) => Promise<boolean>;
  onUpdateFolderColor: (id: string, color: string) => Promise<boolean>;
  isLoading?: boolean;
};

export function FolderSidebar({
  folders,
  rootImageCount,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onUpdateFolderColor,
  isLoading,
}: FolderSidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);

  const { setNodeRef: setRootDropRef, isOver: isOverRoot } = useDroppable({
    id: "folder-root",
    data: { type: "folder", folderId: null },
  });

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    const result = await onCreateFolder(newFolderName.trim(), newFolderParentId);
    if (result) {
      setNewFolderName("");
      setIsCreating(false);
      setNewFolderParentId(null);
    }
  };

  const startCreatingFolder = (parentId: string | null = null) => {
    setNewFolderParentId(parentId);
    setIsCreating(true);
    setNewFolderName("");
  };

  const totalImageCount = folders.reduce(
    (acc, f) => acc + (f.imageCount || 0) + countNestedImages(f),
    rootImageCount
  );

  return (
    <div className="w-64 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-zinc-200">Folders</h2>
          <button
            onClick={() => startCreatingFolder(null)}
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            title="New Folder"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* New folder input */}
        {isCreating && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder();
                if (e.key === "Escape") setIsCreating(false);
              }}
              placeholder="Folder name"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              autoFocus
            />
            <button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white rounded text-sm transition-colors"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Folder list */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <div className="space-y-1">
            {/* All Images */}
            <button
              onClick={() => onSelectFolder(null)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                selectedFolderId === null
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              <svg className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="flex-1 text-sm">All Images</span>
              <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                {totalImageCount}
              </span>
            </button>

            {/* Uncategorized (root) */}
            <div
              ref={setRootDropRef}
              onClick={() => onSelectFolder("root")}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left cursor-pointer transition-colors ${
                selectedFolderId === "root"
                  ? "bg-zinc-700 text-white"
                  : isOverRoot
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              <svg className="h-4 w-4 text-zinc-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              <span className="flex-1 text-sm">Uncategorized</span>
              <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                {rootImageCount}
              </span>
            </div>

            {/* Folder tree */}
            {folders.length > 0 && (
              <div className="pt-2 border-t border-zinc-800 mt-2">
                <FolderTree
                  folders={folders}
                  selectedFolderId={selectedFolderId}
                  onSelectFolder={onSelectFolder}
                  onCreateFolder={startCreatingFolder}
                  onRenameFolder={onRenameFolder}
                  onDeleteFolder={onDeleteFolder}
                  onUpdateFolderColor={onUpdateFolderColor}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with tips */}
      <div className="p-3 border-t border-zinc-800 text-xs text-zinc-500">
        <p>Drag images onto folders to organize.</p>
        <p className="mt-1">Right-click folders for more options.</p>
      </div>
    </div>
  );
}

function countNestedImages(folder: FolderResponse): number {
  if (!folder.children) return 0;
  return folder.children.reduce(
    (acc, child) => acc + (child.imageCount || 0) + countNestedImages(child),
    0
  );
}
