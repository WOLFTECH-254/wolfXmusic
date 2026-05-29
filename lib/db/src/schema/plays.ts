import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const playsTable = pgTable("plays", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  trackId: text("track_id").notNull(),
  trackTitle: text("track_title").notNull(),
  trackArtist: text("track_artist").notNull(),
  thumbnail: text("thumbnail"),
  playedAt: timestamp("played_at").defaultNow().notNull(),
});

export type Play = typeof playsTable.$inferSelect;
