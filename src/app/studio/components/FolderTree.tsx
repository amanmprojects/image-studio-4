"use client";

import { useState, useRef } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import type { FolderResponse } from "@/lib/types";

type FolderTreeProps = {
  folders: FolderResponse[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onUpdateFolderColor: (id: string, color: string) => void;
  level?: number;
};

const FOLDER_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
];

type FolderItemProps = {
  folder: FolderResponse;
  isSelected: boolean;
  onSelect: () => void;
  onCreateSubfolder: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onUpdateColor: (color: string) => void;
  children?: React.ReactNode;
  level: number;
};

function FolderItem({
  folder,
  isSelected,
  onSelect,
  onCreateSubfolder,
  onRename,
  onDelete,
  onUpdateColor,
  children,
  level,
}: FolderItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
    data: { type: "folder", folderId: folder.id },
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    isDragging,
  } = useDraggable({
    id: `draggable-folder-${folder.id}`,
    data: { type: "folder", folder },
  });

  const hasChildren = folder.children && folder.children.length > 0;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowContextMenu(true);
  };

  const handleRename = () => {
    if (editName.trim() && editName !== folder.name) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setEditName(folder.name);
      setIsEditing(false);
    }
  };

  return (
    <div className={`${isDragging ? "opacity-50" : ""}`}>
      <div
        ref={(node) => {
          setDroppableRef(node);
          setDraggableRef(node);
        }}
        {...attributes}
        {...listeners}
        className={`group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
          isSelected
            ? "bg-zinc-700 text-white"
            : isOver
            ? "bg-emerald-500/20 text-emerald-400"
            : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={onSelect}
        onContextMenu={handleContextMenu}
      >
        {/* Expand/collapse button */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-zinc-600 rounded"
          >
            <svg
              className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        ) : (
          <span className="w-4" />
        )}

        {/* Folder icon */}
        <svg
          className="h-4 w-4 flex-shrink-0"
          style={{ color: folder.color }}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>

        {/* Folder name */}
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-zinc-700 border border-zinc-600 rounded px-1 py-0.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            autoFocus
          />
        ) : (
          <span className="flex-1 truncate text-sm">{folder.name}</span>
        )}

        {/* Image count badge */}
        {folder.imageCount !== undefined && folder.imageCount > 0 && (
          <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
            {folder.imageCount}
          </span>
        )}

        {/* Context menu */}
        {showContextMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowContextMenu(false)}
            />
            <div
              ref={contextMenuRef}
              className="absolute right-0 top-full mt-1 z-50 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl py-1 min-w-[160px]"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateSubfolder();
                  setShowContextMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700"
              >
                New Subfolder
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                  setShowContextMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700"
              >
                Rename
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPicker(true);
                  setShowContextMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700"
              >
                Change Color
              </button>
              <div className="border-t border-zinc-700 my-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setShowContextMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-zinc-700"
              >
                Delete
              </button>
            </div>
          </>
        )}

        {/* Color picker */}
        {showColorPicker && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowColorPicker(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-50 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl p-2">
              <div className="grid grid-cols-3 gap-1">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateColor(color);
                      setShowColorPicker(false);
                    }}
                    className={`w-6 h-6 rounded-full border-2 ${
                      folder.color === color ? "border-white" : "border-transparent"
                    } hover:scale-110 transition-transform`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-2">{children}</div>
      )}
    </div>
  );
}

export function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onUpdateFolderColor,
  level = 0,
}: FolderTreeProps) {
  return (
    <div className="space-y-0.5">
      {folders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          isSelected={selectedFolderId === folder.id}
          onSelect={() => onSelectFolder(folder.id)}
          onCreateSubfolder={() => onCreateFolder(folder.id)}
          onRename={(name) => onRenameFolder(folder.id, name)}
          onDelete={() => onDeleteFolder(folder.id)}
          onUpdateColor={(color) => onUpdateFolderColor(folder.id, color)}
          level={level}
        >
          {folder.children && folder.children.length > 0 && (
            <FolderTree
              folders={folder.children}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onCreateFolder={onCreateFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onUpdateFolderColor={onUpdateFolderColor}
              level={level + 1}
            />
          )}
        </FolderItem>
      ))}
    </div>
  );
}
