/**
 * Shared type definitions for the Image Studio application
 */

import type { Image, Folder } from "./db/schema";

/**
 * Image data returned from API endpoints
 */
export type ImageResponse = {
  id: string;
  prompt: string;
  width: number;
  height: number;
  model: string;
  provider: string;
  url: string;
  thumbnailUrl?: string;
  folderId?: string | null;
  createdAt: Date;
};

/**
 * Folder data returned from API endpoints
 */
export type FolderResponse = {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
  children?: FolderResponse[];
  imageCount?: number;
};

/**
 * Parameters for saving a generated image
 */
export type SaveImageParams = {
  userId: string;
  prompt: string;
  base64: string;
  width: number;
  height: number;
  model: string;
  provider: string;
  folderId?: string;
};

/**
 * Result of saving an image to storage and database
 */
export type SaveImageResult = {
  image: Image;
  url: string;
  thumbnailUrl?: string;
};

/**
 * User data from authentication
 */
export type AuthUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};
