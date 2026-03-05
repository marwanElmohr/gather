const express = require("express");
const db = require("../db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const projects = await db.query("SELECT * FROM projects");
    if (projects.rows.length === 0)
      return res.status(404).json({ error: "There are no projects yet." });
    res.json(projects.rows);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const project = await db.query("SELECT * FROM projects WHERE ID = $1", [
      req.params.id,
    ]);
    if (!project.rows[0])
      return res.status(404).json({ error: "Project not found." });
    res.status(200).json(project.rows[0]);
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
    const project = await db.query(
      "INSERT INTO projects (client_ID, owner_ID, name, description, start_date, end_date, status, priority, type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [
        client_id,
        owner_id,
        name,
        description,
        start_date,
        end_date,
        status,
        priority,
        type,
      ],
    );
    res.status(201).json({
      success: "Project created successfully.",
      project: project.rows[0],
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
    const project = await db.query(
      "UPDATE projects SET client_ID=$1, owner_ID=$2, name=$3, description=$4, start_date=$5, end_date=$6, status=$7, priority=$8, type=$9 WHERE ID=$10 RETURNING *",
      [
        client_id,
        owner_id,
        name,
        description,
        start_date,
        end_date,
        status,
        priority,
        type,
        id,
      ],
    );
    if (!project.rows[0])
      return res.status(404).json({ error: "Project not found." });
    res.status(200).json({
      success: `Updated Project of ID ${id} Successfully`,
      project: project.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to edit Project." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const project = await db.query(
      "DELETE FROM projects WHERE ID = $1 RETURNING *",
      [id],
    );
    if (!project.rows[0])
      return res.status(404).json({ error: "Project not found." });
    res.status(200).json({
      success: `Deleted Project of ID ${id} Successfully.`,
      project: project.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete Project." });
  }
});

module.exports = router;
