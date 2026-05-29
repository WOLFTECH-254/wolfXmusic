import { Router } from "express";
import { db } from "@workspace/db";
import { playsTable } from "@workspace/db";

const router = Router();

router.post("/plays", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  if (typeof body?.trackId !== "string" || typeof body?.trackTitle !== "string" || typeof body?.trackArtist !== "string") {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  await db.insert(playsTable).values({
    userId: req.user?.id ?? null,
    trackId: body.trackId,
    trackTitle: body.trackTitle,
    trackArtist: body.trackArtist,
    thumbnail: typeof body.thumbnail === "string" ? body.thumbnail : null,
  });
  res.status(201).json({ ok: true });
});

export default router;
