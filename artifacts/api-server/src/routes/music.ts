import { Router } from "express";

const router = Router();

const BASE = "https://spotify.xwolf.space/api";

async function proxyFetch(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) {
    throw Object.assign(new Error(`Upstream error: ${res.status}`), { status: res.status });
  }
  return res.json();
}

function normaliseTrack(t: Record<string, unknown>) {
  return {
    id: t.id,
    title: t.title ?? t.name,
    artist: t.artist ?? t.artists ?? "",
    artists: t.artists ?? [],
    album: t.album ?? "",
    thumbnail: t.thumbnail ?? "",
    duration: t.duration ?? "0:00",
    duration_ms: t.duration_ms ?? 0,
    explicit: t.explicit ?? false,
    preview_url: t.preview_url ?? null,
    url: t.url ?? "",
  };
}

router.get("/music/search", async (req, res) => {
  const { q, type = "track", limit = "20" } = req.query as Record<string, string>;
  if (!q) {
    res.status(400).json({ error: "q is required" });
    return;
  }
  try {
    const data = await proxyFetch(`${BASE}/search?q=${encodeURIComponent(q)}&type=${type}&limit=${limit}`) as Record<string, unknown>;
    res.json({
      query: data.query,
      type: data.type,
      total: data.total,
      results: data.results,
    });
  } catch (err: unknown) {
    req.log.error({ err }, "music search failed");
    res.status(500).json({ error: "Search failed" });
  }
});

router.get("/music/track/:id", async (req, res) => {
  try {
    const data = await proxyFetch(`${BASE}/track/${req.params.id}`) as Record<string, unknown>;
    const t = (data.track ?? data) as Record<string, unknown>;
    res.json(normaliseTrack(t));
  } catch (err: unknown) {
    req.log.error({ err }, "get track failed");
    res.status(500).json({ error: "Failed to fetch track" });
  }
});

router.get("/music/album/:id", async (req, res) => {
  try {
    const data = await proxyFetch(`${BASE}/album/${req.params.id}`) as Record<string, unknown>;
    const album = (data.album ?? data) as Record<string, unknown>;
    const tracks = Array.isArray(album.tracks) ? album.tracks.map((t: Record<string, unknown>) => normaliseTrack(t)) : [];
    res.json({
      id: album.id,
      name: album.name,
      artist: album.artist ?? "",
      artists: album.artists ?? [],
      thumbnail: album.thumbnail ?? "",
      release_date: album.release_date ?? "",
      total_tracks: album.total_tracks ?? tracks.length,
      type: album.type ?? "album",
      url: album.url ?? "",
      tracks,
    });
  } catch (err: unknown) {
    req.log.error({ err }, "get album failed");
    res.status(500).json({ error: "Failed to fetch album" });
  }
});

router.get("/music/artist/:id", async (req, res) => {
  try {
    const data = await proxyFetch(`${BASE}/artist/${req.params.id}`) as Record<string, unknown>;
    const artist = (data.artist ?? data) as Record<string, unknown>;
    res.json({
      id: artist.id,
      name: artist.name,
      thumbnail: artist.thumbnail ?? "",
      followers: artist.followers ?? 0,
      genres: artist.genres ?? [],
      verified: artist.verified ?? false,
      url: artist.url ?? "",
    });
  } catch (err: unknown) {
    req.log.error({ err }, "get artist failed");
    res.status(500).json({ error: "Failed to fetch artist" });
  }
});

router.get("/music/artist/:id/top-tracks", async (req, res) => {
  try {
    const data = await proxyFetch(`${BASE}/artist/${req.params.id}/top-tracks`) as Record<string, unknown>;
    const tracks = Array.isArray(data.tracks) ? data.tracks.map((t: Record<string, unknown>) => normaliseTrack(t)) : [];
    res.json(tracks);
  } catch (err: unknown) {
    req.log.error({ err }, "get artist top tracks failed");
    res.status(500).json({ error: "Failed to fetch top tracks" });
  }
});

router.get("/music/artist/:id/albums", async (req, res) => {
  try {
    const data = await proxyFetch(`${BASE}/artist/${req.params.id}/albums`) as Record<string, unknown>;
    const albums = Array.isArray(data.albums) ? data.albums : [];
    res.json(albums.map((a: Record<string, unknown>) => ({
      id: a.id,
      name: a.name,
      type: a.type ?? "album",
      release_date: a.release_date ?? "",
      total_tracks: a.total_tracks ?? 0,
      thumbnail: a.thumbnail ?? "",
      artist: a.artist ?? "",
      url: a.url ?? "",
    })));
  } catch (err: unknown) {
    req.log.error({ err }, "get artist albums failed");
    res.status(500).json({ error: "Failed to fetch albums" });
  }
});

router.get("/music/playlist/:id", async (req, res) => {
  try {
    const data = await proxyFetch(`${BASE}/playlist/${req.params.id}`) as Record<string, unknown>;
    const playlist = (data.playlist ?? data) as Record<string, unknown>;
    const tracks = Array.isArray(playlist.tracks) ? playlist.tracks.map((t: Record<string, unknown>) => normaliseTrack(t)) : [];
    res.json({
      id: playlist.id,
      name: playlist.name ?? "",
      description: playlist.description ?? "",
      thumbnail: playlist.thumbnail ?? "",
      total_tracks: playlist.total_tracks ?? tracks.length,
      tracks,
    });
  } catch (err: unknown) {
    req.log.error({ err }, "get playlist failed");
    res.status(500).json({ error: "Failed to fetch playlist" });
  }
});

export default router;
