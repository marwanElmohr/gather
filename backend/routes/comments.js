const express = require("express");
const { Comment } = require("../db");
const router = express.Router();

router.get("/:id/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ task_id: req.params.id }).populate(
      "user_id",
      "name",
    );
    if (comments.length === 0)
      return res.status(404).json({ error: "There are no comments yet." });
    res.status(200).json(
      comments.map((comment) => {
        const data = comment.toJSON();
        return {
          ...data,
          user_name: data.user_id?.name || null,
          user_id: data.user_id?.id || data.user_id || null,
        };
      }),
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to Get Comments." });
  }
});

router.get("/:id/comments/:commentId", async (req, res) => {
  try {
    const comment = await Comment.findOne({
      _id: req.params.commentId,
      task_id: req.params.id,
    }).populate("user_id", "name");
    if (!comment)
      return res.status(404).json({ error: "Comment not found." });
    const data = comment.toJSON();
    res.status(200).json({
      ...data,
      user_name: data.user_id?.name || null,
      user_id: data.user_id?.id || data.user_id || null,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.post("/:id/comments", async (req, res) => {
  const task_id = req.params.id;
  try {
    const { content, user_id } = req.body;
    const comment = await Comment.create({ task_id, content, user_id });
    res.status(201).json({
      success: "Comment created successfully.",
      comment: comment.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.put("/:id/comments/:commentId", async (req, res) => {
  try {
    const { content } = req.body;
    const { id, commentId } = req.params;
    const comment = await Comment.findOneAndUpdate(
      { _id: commentId, task_id: id },
      { content },
      { new: true },
    );
    if (!comment)
      return res.status(404).json({ error: "Comment not found." });
    res.status(200).json({
      success: `Updated Comment Successfully`,
      comment: comment.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to edit Comment." });
  }
});

router.delete("/:id/comments/:commentId", async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const comment = await Comment.findOneAndDelete({
      _id: commentId,
      task_id: id,
    });
    if (!comment)
      return res.status(404).json({ error: "Comment not found." });
    res.status(200).json({
      success: `Deleted Comment Successfully`,
      comment: comment.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete Comment." });
  }
});

module.exports = router;
