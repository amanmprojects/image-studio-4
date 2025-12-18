import { pgTable, text, timestamp, integer, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // WorkOS user ID
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const folders = pgTable("folders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  parentId: uuid("parent_id"), // null = root level folder
  name: text("name").notNull(),
  color: text("color").default("#6366f1"),
  icon: text("icon").default("folder"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const images = pgTable("images", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  folderId: uuid("folder_id").references(() => folders.id), // null = root/uncategorized
  prompt: text("prompt").notNull(),
  s3Key: text("s3_key").notNull(),
  thumbnailS3Key: text("thumbnail_s3_key"), // WebP thumbnail for gallery
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  model: text("model").notNull().default("FLUX-1.1-pro"),
  provider: text("provider").notNull().default("azure-openai"),
  cachedUrl: text("cached_url"),
  cachedUrlExpiry: timestamp("cached_url_expiry"),
  cachedThumbnailUrl: text("cached_thumbnail_url"),
  cachedThumbnailUrlExpiry: timestamp("cached_thumbnail_url_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;
