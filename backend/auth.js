const jwt = require("jsonwebtoken");
const { User } = require("./db");
const JWT_SECRET = process.env.JWT_SECRET || "changeme";

function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select("-password_hash -password");

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch (_error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = {
  signToken,
  verifyToken,
  requireAuth,
};
