import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playlistsTable = pgTable("playlists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  thumbnail: text("thumbnail"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const playlistTracksTable = pgTable("playlist_tracks", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlist_id").notNull(),
  trackId: text("track_id").notNull(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album").notNull(),
  thumbnail: text("thumbnail").notNull(),
  duration: text("duration").notNull(),
  durationMs: integer("duration_ms").notNull(),
  previewUrl: text("preview_url"),
  spotifyUrl: text("spotify_url").notNull(),
  position: integer("position").notNull().default(0),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const insertPlaylistSchema = createInsertSchema(playlistsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlaylistTrackSchema = createInsertSchema(playlistTracksTable).omit({
  id: true,
  addedAt: true,
});

export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type Playlist = typeof playlistsTable.$inferSelect;
export type PlaylistTrack = typeof playlistTracksTable.$inferSelect;
