const express = require("express");
const db = require("../db");
const router = express.Router();

router.get("/:id/comments", async (req, res) => {
  try {
    const comments = await db.query(
      "SELECT comments.*, users.name AS user_name FROM comments JOIN users ON comments.user_id = users.id WHERE comments.task_id = $1",
      [req.params.id],
    );
    if (comments.rows.length === 0)
      return res.status(404).json({ error: "There are no comments yet." });
    res.status(200).json(comments.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to Get Comments." });
  }
});

router.get("/:id/comments/:commentId", async (req, res) => {
  try {
    const comment = await db.query(
      "SELECT comments.*, users.name AS user_name FROM comments JOIN users ON comments.user_id = users.id WHERE comments.id = $1 AND comments.task_id = $2",
      [req.params.commentId, req.params.id],
    );
    if (!comment.rows[0])
      return res.status(404).json({ error: "Comment not found." });
    res.status(200).json(comment.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.post("/:id/comments", async (req, res) => {
  const task_id = req.params.id;
  try {
    const { content, user_id } = req.body;
    const comment = await db.query(
      "INSERT INTO comments (task_ID, content, user_ID) VALUES ($1, $2, $3) RETURNING *",
      [task_id, content, user_id],
    );
    res.status(201).json({
      success: "Comment created successfully.",
      comment: comment.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.put("/:id/comments/:commentId", async (req, res) => {
  try {
    const { content } = req.body;
    const { id, commentId } = req.params;
    const comment = await db.query(
      "UPDATE comments SET content = $1 WHERE ID = $2 AND task_ID = $3 RETURNING *",
      [content, commentId, id],
    );
    if (!comment.rows[0])
      return res.status(404).json({ error: "Comment not found." });
    res.status(200).json({
      success: `Updated Comment Successfully`,
      comment: comment.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to edit Comment." });
  }
});

router.delete("/:id/comments/:commentId", async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const comment = await db.query(
      "DELETE FROM comments WHERE ID = $1 AND task_ID = $2 RETURNING *",
      [commentId, id],
    );
    if (!comment.rows[0])
      return res.status(404).json({ error: "Comment not found." });
    res.status(200).json({
      success: `Deleted Comment Successfully`,
      comment: comment.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete Comment." });
  }
});

module.exports = router;
