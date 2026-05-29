import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, playsTable, playlistsTable, favoritesTable } from "@workspace/db";
import { count, desc } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAdmin);

router.get("/admin/stats", async (_req, res) => {
  const [[users], [playlists], [plays], [favorites]] = await Promise.all([
    db.select({ total: count() }).from(usersTable),
    db.select({ total: count() }).from(playlistsTable),
    db.select({ total: count() }).from(playsTable),
    db.select({ total: count() }).from(favoritesTable),
  ]);
  res.json({
    users: users.total,
    playlists: playlists.total,
    plays: plays.total,
    favorites: favorites.total,
  });
});

router.get("/admin/users", async (_req, res) => {
  const users = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      displayName: usersTable.displayName,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt))
    .limit(100);
  res.json(users);
});

router.get("/admin/plays", async (_req, res) => {
  const plays = await db
    .select()
    .from(playsTable)
    .orderBy(desc(playsTable.playedAt))
    .limit(100);
  res.json(plays);
});

router.get("/admin/playlists", async (_req, res) => {
  const playlists = await db
    .select()
    .from(playlistsTable)
    .orderBy(desc(playlistsTable.createdAt))
    .limit(100);
  res.json(playlists);
});

export default router;
