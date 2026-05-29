import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { JWT_SECRET } from "../middleware/auth.js";
const router = Router();

function isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function validateRegister(body: unknown): { email: string; displayName: string; password: string } | null {
  if (!body || typeof body !== "object") return null;
  const { email, displayName, password } = body as Record<string, unknown>;
  if (typeof email !== "string" || !isValidEmail(email)) return null;
  if (typeof displayName !== "string" || displayName.length < 2 || displayName.length > 40) return null;
  if (typeof password !== "string" || password.length < 6) return null;
  return { email, displayName, password };
}

function validateLogin(body: unknown): { email: string; password: string } | null {
  if (!body || typeof body !== "object") return null;
  const { email, password } = body as Record<string, unknown>;
  if (typeof email !== "string" || !isValidEmail(email)) return null;
  if (typeof password !== "string" || password.length < 1) return null;
  return { email, password };
}

function makeToken(user: { id: number; email: string; displayName: string; role: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

router.post("/auth/register", async (req, res) => {
  const parsed = validateRegister(req.body);
  if (!parsed) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, displayName, password } = parsed;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const [{ total }] = await db.select({ total: count() }).from(usersTable);
  const role = total === 0 ? "admin" : "user";

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(usersTable)
    .values({ email: email.toLowerCase(), passwordHash, displayName, role })
    .returning();

  res.status(201).json({ token: makeToken(user), user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role } });
});

router.post("/auth/login", async (req, res) => {
  const parsed = validateLogin(req.body);
  if (!parsed) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, password } = parsed;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  res.json({ token: makeToken(user), user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role } });
});

router.get("/auth/me", (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }
  res.json({ user: req.user });
});

export default router;
