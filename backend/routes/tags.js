const express = require("express");
const { Tag } = require("../db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const tags = await Tag.find();
    if (tags.length === 0)
      return res.status(404).json({ error: "No tags found." });
    res.status(200).json(tags.map((tag) => tag.toJSON()));
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) return res.status(404).json({ error: "Tag not found." });
    res.status(200).json(tag.toJSON());
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    const tag = await Tag.create({ name });
    res.status(201).json({
      success: "Tag created successfully.",
      tag: tag.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    const tag = await Tag.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true },
    );
    if (!tag) return res.status(404).json({ error: "Tag not found." });
    res.status(200).json({
      success: "Tag updated successfully.",
      tag: tag.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const tag = await Tag.findByIdAndDelete(req.params.id);
    if (!tag) return res.status(404).json({ error: "Tag not found." });
    res.status(200).json({
      success: "Tag deleted successfully.",
      tag: tag.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

module.exports = router;
