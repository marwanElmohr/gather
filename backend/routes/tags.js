const express = require("express");
const db = require("../db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const tags = await db.query("SELECT * FROM tags");
    if (tags.rows.length === 0)
      return res.status(404).json({ error: "No tags found." });
    res.status(200).json(tags.rows);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const tag = await db.query("SELECT * FROM tags WHERE id = $1", [
      req.params.id,
    ]);
    if (!tag.rows[0]) return res.status(404).json({ error: "Tag not found." });
    res.status(200).json(tag.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    const tag = await db.query(
      "INSERT INTO tags (name) VALUES ($1) RETURNING *",
      [name],
    );
    res.status(201).json({
      success: "Tag created successfully.",
      tag: tag.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    const tag = await db.query(
      "UPDATE tags SET name = $1 WHERE id = $2 RETURNING *",
      [name, req.params.id],
    );
    if (!tag.rows[0]) return res.status(404).json({ error: "Tag not found." });
    res.status(200).json({
      success: "Tag updated successfully.",
      tag: tag.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const tag = await db.query("DELETE FROM tags WHERE id = $1 RETURNING *", [
      req.params.id,
    ]);
    if (!tag.rows[0]) return res.status(404).json({ error: "Tag not found." });
    res.status(200).json({
      success: "Tag deleted successfully.",
      tag: tag.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

module.exports = router;
