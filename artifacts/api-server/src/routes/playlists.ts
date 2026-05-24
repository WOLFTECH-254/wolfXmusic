import { Router } from "express";
import { db, playlistsTable, playlistTracksTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  CreatePlaylistBody,
  UpdatePlaylistBody,
  AddTrackToPlaylistBody,
} from "@workspace/api-zod";

const router = Router();

function fmtPlaylist(p: typeof playlistsTable.$inferSelect, trackCount = 0) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    thumbnail: p.thumbnail,
    trackCount,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

router.get("/playlists", async (req, res) => {
  try {
    const rows = await db
      .select({
        playlist: playlistsTable,
        trackCount: sql<number>`cast(count(${playlistTracksTable.id}) as int)`,
      })
      .from(playlistsTable)
      .leftJoin(playlistTracksTable, eq(playlistTracksTable.playlistId, playlistsTable.id))
      .groupBy(playlistsTable.id)
      .orderBy(playlistsTable.createdAt);
    res.json(rows.map(r => fmtPlaylist(r.playlist, r.trackCount ?? 0)));
  } catch (err: unknown) {
    req.log.error({ err }, "get playlists failed");
    res.status(500).json({ error: "Failed to fetch playlists" });
  }
});

router.post("/playlists", async (req, res) => {
  const parsed = CreatePlaylistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  try {
    const [row] = await db
      .insert(playlistsTable)
      .values({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
      })
      .returning();
    res.status(201).json(fmtPlaylist(row, 0));
  } catch (err: unknown) {
    req.log.error({ err }, "create playlist failed");
    res.status(500).json({ error: "Failed to create playlist" });
  }
});

router.get("/playlists/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [playlist] = await db.select().from(playlistsTable).where(eq(playlistsTable.id, id)).limit(1);
    if (!playlist) { res.status(404).json({ error: "Not found" }); return; }
    const tracks = await db
      .select()
      .from(playlistTracksTable)
      .where(eq(playlistTracksTable.playlistId, id))
      .orderBy(playlistTracksTable.position);
    res.json({
      ...fmtPlaylist(playlist, tracks.length),
      tracks: tracks.map(t => ({
        id: t.id,
        playlistId: t.playlistId,
        trackId: t.trackId,
        title: t.title,
        artist: t.artist,
        album: t.album,
        thumbnail: t.thumbnail,
        duration: t.duration,
        duration_ms: t.durationMs,
        previewUrl: t.previewUrl,
        spotifyUrl: t.spotifyUrl,
        position: t.position,
        addedAt: t.addedAt.toISOString(),
      })),
    });
  } catch (err: unknown) {
    req.log.error({ err }, "get playlist failed");
    res.status(500).json({ error: "Failed to fetch playlist" });
  }
});

router.patch("/playlists/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdatePlaylistBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  try {
    const updates: Partial<typeof playlistsTable.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.description !== undefined) updates.description = parsed.data.description;
    if (parsed.data.thumbnail !== undefined) updates.thumbnail = parsed.data.thumbnail;
    const [row] = await db.update(playlistsTable).set(updates).where(eq(playlistsTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    const tracks = await db.select().from(playlistTracksTable).where(eq(playlistTracksTable.playlistId, id));
    res.json(fmtPlaylist(row, tracks.length));
  } catch (err: unknown) {
    req.log.error({ err }, "update playlist failed");
    res.status(500).json({ error: "Failed to update playlist" });
  }
});

router.delete("/playlists/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db.delete(playlistTracksTable).where(eq(playlistTracksTable.playlistId, id));
    await db.delete(playlistsTable).where(eq(playlistsTable.id, id));
    res.json({ success: true });
  } catch (err: unknown) {
    req.log.error({ err }, "delete playlist failed");
    res.status(500).json({ error: "Failed to delete playlist" });
  }
});

router.post("/playlists/:id/tracks", async (req, res) => {
  const playlistId = parseInt(req.params.id, 10);
  if (isNaN(playlistId)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = AddTrackToPlaylistBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  try {
    const existing = await db
      .select({ position: playlistTracksTable.position })
      .from(playlistTracksTable)
      .where(eq(playlistTracksTable.playlistId, playlistId))
      .orderBy(sql`${playlistTracksTable.position} desc`)
      .limit(1);
    const nextPos = existing.length > 0 ? (existing[0].position + 1) : 0;
    await db.insert(playlistTracksTable).values({
      playlistId,
      trackId: parsed.data.trackId,
      title: parsed.data.title,
      artist: parsed.data.artist,
      album: parsed.data.album,
      thumbnail: parsed.data.thumbnail,
      duration: parsed.data.duration,
      durationMs: parsed.data.duration_ms,
      previewUrl: parsed.data.previewUrl ?? null,
      spotifyUrl: parsed.data.spotifyUrl,
      position: nextPos,
    });
    await db.update(playlistsTable).set({ updatedAt: new Date() }).where(eq(playlistsTable.id, playlistId));
    res.status(201).json({ success: true });
  } catch (err: unknown) {
    req.log.error({ err }, "add track to playlist failed");
    res.status(500).json({ error: "Failed to add track" });
  }
});

router.delete("/playlists/:id/tracks/:trackId", async (req, res) => {
  const playlistId = parseInt(req.params.id, 10);
  if (isNaN(playlistId)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db
      .delete(playlistTracksTable)
      .where(
        sql`${playlistTracksTable.playlistId} = ${playlistId} AND ${playlistTracksTable.trackId} = ${req.params.trackId}`
      );
    res.json({ success: true });
  } catch (err: unknown) {
    req.log.error({ err }, "remove track from playlist failed");
    res.status(500).json({ error: "Failed to remove track" });
  }
});

export default router;
