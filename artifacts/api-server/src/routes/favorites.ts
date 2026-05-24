import { Router } from "express";
import { db, favoritesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { AddFavoriteBody } from "@workspace/api-zod";

const router = Router();

router.get("/favorites", async (req, res) => {
  try {
    const rows = await db.select().from(favoritesTable).orderBy(favoritesTable.createdAt);
    res.json(rows.map(r => ({
      id: r.id,
      trackId: r.trackId,
      title: r.title,
      artist: r.artist,
      album: r.album,
      thumbnail: r.thumbnail,
      duration: r.duration,
      duration_ms: r.durationMs,
      previewUrl: r.previewUrl,
      spotifyUrl: r.spotifyUrl,
      createdAt: r.createdAt.toISOString(),
    })));
  } catch (err: unknown) {
    req.log.error({ err }, "get favorites failed");
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
});

router.post("/favorites", async (req, res) => {
  const parsed = AddFavoriteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const b = parsed.data;
  try {
    const [row] = await db
      .insert(favoritesTable)
      .values({
        trackId: b.trackId,
        title: b.title,
        artist: b.artist,
        album: b.album,
        thumbnail: b.thumbnail,
        duration: b.duration,
        durationMs: b.duration_ms,
        previewUrl: b.previewUrl ?? null,
        spotifyUrl: b.spotifyUrl,
      })
      .onConflictDoNothing()
      .returning();
    if (!row) {
      const existing = await db.select().from(favoritesTable).where(eq(favoritesTable.trackId, b.trackId)).limit(1);
      res.status(201).json({
        id: existing[0].id,
        trackId: existing[0].trackId,
        title: existing[0].title,
        artist: existing[0].artist,
        album: existing[0].album,
        thumbnail: existing[0].thumbnail,
        duration: existing[0].duration,
        duration_ms: existing[0].durationMs,
        previewUrl: existing[0].previewUrl,
        spotifyUrl: existing[0].spotifyUrl,
        createdAt: existing[0].createdAt.toISOString(),
      });
      return;
    }
    res.status(201).json({
      id: row.id,
      trackId: row.trackId,
      title: row.title,
      artist: row.artist,
      album: row.album,
      thumbnail: row.thumbnail,
      duration: row.duration,
      duration_ms: row.durationMs,
      previewUrl: row.previewUrl,
      spotifyUrl: row.spotifyUrl,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (err: unknown) {
    req.log.error({ err }, "add favorite failed");
    res.status(500).json({ error: "Failed to add favorite" });
  }
});

router.delete("/favorites/:trackId", async (req, res) => {
  try {
    await db.delete(favoritesTable).where(eq(favoritesTable.trackId, req.params.trackId));
    res.json({ success: true });
  } catch (err: unknown) {
    req.log.error({ err }, "remove favorite failed");
    res.status(500).json({ error: "Failed to remove favorite" });
  }
});

export default router;
