const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

const prisma = require("../db");
const validate = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");

const rateLimit = require("express-rate-limit");
const crypto = require("crypto");

// Slows down password guessing: 30 attempts per 15 minutes per IP address
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test", // keep the automated tests deterministic
  message: { error: "Too many attempts, please try again later" },
});

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores"),
    password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  inviteCode: z.string().max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

// Compares two strings in constant time. Hashing first makes them the same
// length, which timingSafeEqual requires.
function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function signToken(user) {
  return jwt.sign(
    { sub: String(user.id), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
  };
}

// POST /api/auth/register
router.post("/register", authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const { email, username, password, inviteCode } = req.body;

    // When INVITE_CODE is set, only people who know it can create accounts.
    // This check comes before any database work.
    const required = process.env.INVITE_CODE;
    if (required && !safeEqual(inviteCode || "", required)) {
      return res
        .status(403)
        .json({ error: "A valid invite code is required to register" });
    }
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, username, passwordHash },
    });

    res.status(201).json({ user: publicUser(user), token: signToken(user) });
  } catch (err) {
    if (err.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Email or username already in use" });
    }
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    const valid = user && (await bcrypt.compare(password, user.passwordHash));

    // Same message for "no such user" and "wrong password"
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({ user: publicUser(user), token: signToken(user) });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me  (protected)
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/config  (lets the register page know if an invite code is needed)
router.get("/config", (req, res) => {
  res.json({ inviteRequired: Boolean(process.env.INVITE_CODE) });
});

module.exports = router;