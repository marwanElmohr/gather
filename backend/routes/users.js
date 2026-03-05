const express = require("express");
const db = require("../db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const users = await db.query("SELECT * FROM users");
    if (users.rows.length === 0)
      return res.status(404).json({ error: "There are no users yet." });
    res.json(users.rows);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await db.query("SELECT * FROM users WHERE ID = $1", [
      req.params.id,
    ]);
    if (!user.rows[0])
      return res.status(404).json({ error: "User not found." });
    res.status(200).json(user.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await db.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, password, role],
    );
    res
      .status(201)
      .json({ Success: "Created User Successfully.", user: user.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to Create User." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const id = req.params.id;
    const user = await db.query(
      "UPDATE users SET name=$1, email=$2, password=$3, role=$4 WHERE ID=$5 RETURNING *",
      [name, email, password, role, id],
    );
    if (!user.rows[0])
      return res.status(404).json({ error: "User not found." });
    res.status(200).json({
      success: `Updated User of ID ${id} Successfully`,
      user: user.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to edit User." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const user = await db.query("DELETE FROM users WHERE ID = $1 RETURNING *", [
      id,
    ]);
    if (!user.rows[0])
      return res.status(404).json({ error: "User not found." });
    res.status(200).json({
      success: `Deleted User of ID ${id} Successfully.`,
      user: user.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete User." });
  }
});

module.exports = router;
