---
name: Image Performance and Folders
overview: Implement browser caching, lazy loading, thumbnail generation for cheaper S3 bandwidth, and a full nested folder system with drag-and-drop organization.
todos:
  - id: lazy-loading
    content: Add lazy loading to ImageCard with loading="lazy" and Intersection Observer
    status: completed
  - id: cache-headers
    content: Add Cache-Control headers to /api/images response
    status: completed
  - id: install-deps
    content: Install sharp and @dnd-kit/core dependencies
    status: completed
  - id: thumbnail-schema
    content: Update schema with thumbnail fields and folders table
    status: completed
  - id: thumbnail-generation
    content: Generate WebP thumbnails on image upload in S3
    status: completed
  - id: thumbnail-api
    content: Return thumbnail URLs from API, update ImageCard to use them
    status: completed
  - id: folders-api
    content: Create CRUD API routes for folders
    status: completed
  - id: images-move-api
    content: Create bulk move API for images to folders
    status: completed
  - id: folder-sidebar
    content: Create FolderSidebar component with recursive tree
    status: completed
  - id: folder-filtering
    content: Filter gallery by selected folder
    status: completed
  - id: drag-drop
    content: Implement drag-and-drop for images and folders
    status: completed
---

# Image Performance and Folders Plan

## 1. Browser Caching and Performance

### Next.js Image Optimization (already partially in place)

- Add `loading="lazy"` to `ImageCard` component for native lazy loading
- Configure `placeholder="blur"` with `blurDataURL` for better perceived performance

### API Response Caching

- Add `Cache-Control` headers to `/api/images` response
- Use `stale-while-revalidate` pattern for instant subsequent loads
```typescript
// Add to GET response headers
headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' }
```


---

## 2. Thumbnail Generation (Reduce S3 Costs)

### Server-side Thumbnail Generation

- Install `sharp` for image processing
- Generate 400px width WebP thumbnails on upload (90%+ smaller than originals)
- Store at `users/{userId}/thumbnails/{imageId}.webp`

### Schema Changes ([src/lib/db/schema.ts](src/lib/db/schema.ts))

```typescript
// Add to images table
thumbnailS3Key: text("thumbnail_s3_key"),
cachedThumbnailUrl: text("cached_thumbnail_url"),
cachedThumbnailUrlExpiry: timestamp("cached_thumbnail_url_expiry"),
```



### S3 Updates ([src/lib/s3.ts](src/lib/s3.ts))

```typescript
export function generateThumbnailKey(userId: string, imageId: string): string {
  return `users/${userId}/thumbnails/${imageId}.webp`;
}
```



### Gallery Uses Thumbnails

- `ImageCard` displays thumbnail URL in gallery
- Full resolution only on download/edit

---

## 3. Lazy Loading with Intersection Observer

### Create `LazyImage` component

- Use Intersection Observer to defer loading until image enters viewport
- Show skeleton placeholder while loading
- Batch load images in viewport + 1 row buffer

### Update `ImageGallery` ([src/app/studio/components/ImageGallery.tsx](src/app/studio/components/ImageGallery.tsx))

- Wrap images in lazy loading container
- Add virtual scrolling for very large galleries (50+ images)

---

## 4. Nested Folder System

### Database Schema

**New `folders` table:**

```typescript
export const folders = pgTable("folders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  parentId: uuid("parent_id").references(() => folders.id), // null = root
  name: text("name").notNull(),
  color: text("color").default("#6366f1"), // folder color
  icon: text("icon").default("folder"), // icon name
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Update `images` table:**

```typescript
folderId: uuid("folder_id").references(() => folders.id), // null = root/uncategorized
```



### New API Routes

- `POST /api/folders` - Create folder
- `GET /api/folders` - List folders (tree structure)
- `PATCH /api/folders/[id]` - Update folder (rename, recolor, move)
- `DELETE /api/folders/[id]` - Delete folder (images move to parent)
- `POST /api/images/move` - Move images to folder (bulk)

### UI Components

**FolderSidebar:**

- Collapsible tree view with nested folders
- Click to filter images by folder
- Right-click context menu (rename, delete, change color)

**FolderTree:**

- Recursive component for nested display
- Drag-and-drop folders to reorganize
- Expand/collapse animations

**ImageGallery updates:**

- Drag images to folders in sidebar
- Multi-select for bulk move
- "Move to folder" context menu

### Drag and Drop

- Use `@dnd-kit/core` for drag-and-drop (better than react-dnd for this use case)
- Drag images onto folders
- Drag folders to reorder/nest

---

## File Changes Summary

| File | Change ||------|--------|| `src/lib/db/schema.ts` | Add folders table, update images || `drizzle/0001_*.sql` | New migration || `src/lib/s3.ts` | Add thumbnail helpers || `src/app/api/images/generate/route.ts` | Generate thumbnails || `src/app/api/images/route.ts` | Return thumbnail URLs, add caching || `src/app/api/folders/route.ts` | New - CRUD for folders || `src/app/api/folders/[id]/route.ts` | New - Single folder operations || `src/app/api/images/move/route.ts` | New - Bulk move images || `src/lib/types.ts` | Add folder types || `src/app/studio/components/FolderSidebar.tsx` | New - Folder tree UI || `src/app/studio/components/FolderTree.tsx` | New - Recursive tree || `src/app/studio/components/ImageCard.tsx` | Use thumbnails, lazy load || `src/app/studio/components/ImageGallery.tsx` | Drag targets, multi-select || `src/app/studio/hooks/useStudio.ts` | Folder state, selection state || `src/app/studio/hooks/useFolders.ts` | New - Folder management || `src/app/studio/page.tsx` | Add sidebar layout || `package.json` | Add sharp, @dnd-kit/core |---

## Implementation Order

1. **Phase 1: Quick Wins** - Lazy loading + cache headers (immediate perf boost)
2. **Phase 2: Thumbnails** - Schema + generation + gallery update (S3 cost reduction)
3. **Phase 3: Folders DB** - Schema + API routes