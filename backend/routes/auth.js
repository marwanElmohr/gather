const express = require("express");
const bcrypt = require("bcryptjs");
const { User } = require("../db");
const { signToken } = require("../auth");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: "username, password, and role are required" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: "password must be at least 6 characters" });
    }

    const normalizedRole = String(role).trim().toLowerCase();
    if (!["user", "organization"].includes(normalizedRole)) {
      return res.status(400).json({ error: "role must be either user or organization" });
    }

    const normalizedUsername = String(username).trim().toLowerCase();
    const existing = await User.findOne({ username: normalizedUsername });
    if (existing) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      username: normalizedUsername,
      name: normalizedUsername,
      email: `${normalizedUsername.toLowerCase()}@gather.local`,
      password: passwordHash,
      role: normalizedRole,
      avatar_color: "#6C63FF",
    });

    const token = signToken(user._id);

    return res.status(201).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        avatar_color: user.avatar_color,
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: "Username already taken" });
    }
    return res.status(500).json({ error: "Internal server error", detail: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "username and password are required" });
    }

    const user = await User.findOne({ username: String(username).trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(String(password), user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken(user._id);

    return res.status(200).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        avatar_color: user.avatar_color,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error", detail: error.message });
  }
});

module.exports = router;
