const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/:id/attachments", async (req, res) => {
  try {
    const attachments = await db.query(
      "SELECT * FROM attachments WHERE task_id = $1",
      [req.params.id],
    );
    if (attachments.rows.length === 0)
      return res.status(404).json({ error: "No attachments found." });
    res.status(200).json(attachments.rows);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.post("/:id/attachments", async (req, res) => {
  try {
    const { file_name, file_path, uploaded_by } = req.body;
    const attachment = await db.query(
      "INSERT INTO attachments (task_id, file_name, file_path, uploaded_by) VALUES ($1, $2, $3, $4) RETURNING *",
      [req.params.id, file_name, file_path, uploaded_by],
    );
    res.status(201).json({
      success: "Attachment added successfully.",
      attachment: attachment.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.put("/:id/attachments/:attachmentId", async (req, res) => {
  try {
    const { file_name, file_path, uploaded_by } = req.body;
    const { id, attachmentId } = req.params;
    const attachment = await db.query(
      "UPDATE attachments SET file_name = $1, file_path = $2, uploaded_by = $3 WHERE task_id = $4 AND id = $5 RETURNING *",
      [file_name, file_path, uploaded_by, id, attachmentId],
    );
    if (!attachment.rows[0])
      return res.status(404).json({ error: "Attachment not found." });
    res.status(200).json({
      success: "Attachment updated successfully.",
      attachment: attachment.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.delete("/:id/attachments/:attachmentId", async (req, res) => {
  try {
    const { id, attachmentId } = req.params;
    const attachment = await db.query(
      "DELETE FROM attachments WHERE task_id = $1 AND id = $2 RETURNING *",
      [id, attachmentId],
    );
    if (!attachment.rows[0])
      return res.status(404).json({ error: "Attachment not found." });
    res.status(200).json({
      success: "Attachment deleted successfully.",
      attachment: attachment.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

module.exports = router;
