const express = require("express");
const { Project } = require("../db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const projects = await Project.find();
    if (projects.length === 0)
      return res.status(404).json({ error: "There are no projects yet." });
    res.json(projects.map((project) => project.toJSON()));
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project)
      return res.status(404).json({ error: "Project not found." });
    res.status(200).json(project.toJSON());
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      client_id,
      owner_id,
      name,
      description,
      start_date,
      end_date,
      status,
      priority,
      type,
    } = req.body;
    const project = await Project.create({
      client_id,
      owner_id,
      name,
      description,
      start_date,
      end_date,
      status,
      priority,
      type,
    });
    res.status(201).json({
      success: "Project created successfully.",
      project: project.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const {
      client_id,
      owner_id,
      name,
      description,
      start_date,
      end_date,
      status,
      priority,
      type,
    } = req.body;
    const id = req.params.id;
    const project = await Project.findByIdAndUpdate(
      id,
      {
        client_id,
        owner_id,
        name,
        description,
        start_date,
        end_date,
        status,
        priority,
        type,
      },
      { new: true },
    );
    if (!project)
      return res.status(404).json({ error: "Project not found." });
    res.status(200).json({
      success: `Updated Project of ID ${id} Successfully`,
      project: project.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to edit Project." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const project = await Project.findByIdAndDelete(id);
    if (!project)
      return res.status(404).json({ error: "Project not found." });
    res.status(200).json({
      success: `Deleted Project of ID ${id} Successfully.`,
      project: project.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete Project." });
  }
});

module.exports = router;
