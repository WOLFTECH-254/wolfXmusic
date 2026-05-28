import { Router } from "express";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// Simple in-memory cache: query → { url, expires }
const streamCache = new Map<string, { url: string; expires: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function getYtStreamUrl(query: string): Promise<string | null> {
  const cached = streamCache.get(query);
  if (cached && cached.expires > Date.now()) return cached.url;

  try {
    const { stdout } = await execFileAsync("yt-dlp", [
      `ytsearch1:${query}`,
      "--get-url",
      "-f", "bestaudio[ext=m4a]/bestaudio/best",
      "--no-playlist",
      "--no-warnings",
      "--quiet",
    ], { timeout: 30000 });

    const url = stdout.trim().split("\n")[0];
    if (!url) return null;
    streamCache.set(query, { url, expires: Date.now() + CACHE_TTL_MS });
    return url;
  } catch {
    return null;
  }
}

const router = Router();

const BASE = "https://spotify.xwolf.space/api";
const DOWNLOAD_BASE = "https://apis.xwolf.space/api/spotify/download";
const DOWNLOAD_KEY = "wxa_u_xwk7sch6xj";

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

// Returns a proxy URL the browser can stream from
router.get("/music/stream", async (req, res) => {
  const { q } = req.query as Record<string, string>;
  if (!q) {
    res.status(400).json({ error: "q is required" });
    return;
  }
  try {
    const url = await getYtStreamUrl(q);
    if (!url) {
      res.status(404).json({ error: "No stream found" });
      return;
    }
    // Return a proxy URL — the browser will stream via our server
    const proxyPath = `/api/music/proxy?q=${encodeURIComponent(q)}`;
    res.json({ stream_url: proxyPath });
  } catch (err: unknown) {
    req.log.error({ err }, "stream extraction failed");
    res.status(500).json({ error: "Stream extraction failed" });
  }
});

// Proxy the YouTube audio stream so browser can play it (YouTube URLs are IP-locked)
router.get("/music/proxy", async (req, res) => {
  const { q } = req.query as Record<string, string>;
  if (!q) { res.status(400).end(); return; }

  try {
    const ytUrl = await getYtStreamUrl(q);
    if (!ytUrl) { res.status(404).end(); return; }

    const rangeHeader = req.headers["range"];
    const upstreamRes = await fetch(ytUrl, {
      headers: rangeHeader ? { Range: rangeHeader } : {},
    });

    res.status(upstreamRes.status);
    const contentType = upstreamRes.headers.get("content-type");
    const contentLength = upstreamRes.headers.get("content-length");
    const contentRange = upstreamRes.headers.get("content-range");
    const acceptRanges = upstreamRes.headers.get("accept-ranges");

    if (contentType) res.setHeader("Content-Type", contentType);
    if (contentLength) res.setHeader("Content-Length", contentLength);
    if (contentRange) res.setHeader("Content-Range", contentRange);
    if (acceptRanges) res.setHeader("Accept-Ranges", acceptRanges);
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (upstreamRes.body) {
      const reader = upstreamRes.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) { res.end(); break; }
          const ok = res.write(value);
          if (!ok) await new Promise(r => res.once("drain", r));
        }
      };
      req.on("close", () => reader.cancel());
      await pump();
    } else {
      res.end();
    }
  } catch (err: unknown) {
    req.log.error({ err }, "proxy stream failed");
    if (!res.headersSent) res.status(500).end();
  }
});

router.get("/music/download", async (req, res) => {
  const { q } = req.query as Record<string, string>;
  if (!q) {
    res.status(400).json({ error: "q is required" });
    return;
  }
  try {
    const url = `${DOWNLOAD_BASE}?q=${encodeURIComponent(q)}&key=${DOWNLOAD_KEY}`;
    const data = await proxyFetch(url) as Record<string, unknown>;
    const streamUrl =
      (data.downloadUrl as string) ??
      (data.download_url as string) ??
      (data.stream_url as string) ??
      (data.audio_url as string) ??
      (data.url as string) ??
      null;
    res.json({ ...data, stream_url: streamUrl });
  } catch (err: unknown) {
    req.log.error({ err }, "download failed");
    res.status(500).json({ error: "Download failed" });
  }
});

export default router;
