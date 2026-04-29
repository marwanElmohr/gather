const express = require("express");
const router = express.Router();
const { Attachment } = require("../db");

router.get("/:id/attachments", async (req, res) => {
  try {
    const attachments = await Attachment.find({ task_id: req.params.id });
    if (attachments.length === 0)
      return res.status(404).json({ error: "No attachments found." });
    res.status(200).json(attachments.map((attachment) => attachment.toJSON()));
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.post("/:id/attachments", async (req, res) => {
  try {
    const { file_name, file_path, uploaded_by } = req.body;
    const attachment = await Attachment.create({
      task_id: req.params.id,
      file_name,
      file_path,
      uploaded_by,
    });
    res.status(201).json({
      success: "Attachment added successfully.",
      attachment: attachment.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.put("/:id/attachments/:attachmentId", async (req, res) => {
  try {
    const { file_name, file_path, uploaded_by } = req.body;
    const { id, attachmentId } = req.params;
    const attachment = await Attachment.findOneAndUpdate(
      { task_id: id, _id: attachmentId },
      { file_name, file_path, uploaded_by },
      { new: true },
    );
    if (!attachment)
      return res.status(404).json({ error: "Attachment not found." });
    res.status(200).json({
      success: "Attachment updated successfully.",
      attachment: attachment.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.delete("/:id/attachments/:attachmentId", async (req, res) => {
  try {
    const { id, attachmentId } = req.params;
    const attachment = await Attachment.findOneAndDelete({
      task_id: id,
      _id: attachmentId,
    });
    if (!attachment)
      return res.status(404).json({ error: "Attachment not found." });
    res.status(200).json({
      success: "Attachment deleted successfully.",
      attachment: attachment.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

module.exports = router;
