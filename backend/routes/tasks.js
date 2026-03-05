const express = require("express");
const db = require("../db");
const router = express.Router();

router.get("/:id/tasks", async (req, res) => {
  const project_id = req.params.id;
  try {
    const tasks = await db.query("SELECT * FROM tasks WHERE project_ID = $1", [
      project_id,
    ]);
    if (tasks.rows.length === 0)
      return res.status(404).json({ error: "There are no tasks yet." });
    res.json(tasks.rows);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.get("/:id/tasks/:taskId", async (req, res) => {
  const { id, taskId } = req.params;
  try {
    const task = await db.query(
      "SELECT * FROM tasks WHERE ID = $1 AND project_ID = $2",
      [taskId, id],
    );
    if (!task.rows[0])
      return res.status(404).json({ error: "Task not found." });
    res.status(200).json(task.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.post("/:id/tasks", async (req, res) => {
  const project_id = req.params.id;
  try {
    const {
      title,
      description,
      due_date,
      status,
      priority,
      assigned_to,
      created_by,
    } = req.body;
    const task = await db.query(
      "INSERT INTO tasks (project_ID, title, description, due_date, status, priority, assigned_to, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [
        project_id,
        title,
        description,
        due_date,
        status,
        priority,
        assigned_to,
        created_by,
      ],
    );
    res.status(201).json({
      success: "Task created successfully.",
      task: task.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.put("/:id/tasks/:taskId", async (req, res) => {
  const { id, taskId } = req.params;
  try {
    const { title, description, due_date, status, priority, assigned_to } =
      req.body;
    const task = await db.query(
      "UPDATE tasks SET title=$1, description=$2, due_date=$3, status=$4, priority=$5, assigned_to=$6 WHERE ID=$7 AND project_ID=$8 RETURNING *",
      [title, description, due_date, status, priority, assigned_to, taskId, id],
    );
    if (!task.rows[0])
      return res.status(404).json({ error: "Task not found." });
    res.status(200).json({
      success: `Updated Task of ID ${taskId} for Project ${id} Successfully`,
      task: task.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to edit Task." });
  }
});

router.delete("/:id/tasks/:taskId", async (req, res) => {
  const { id, taskId } = req.params;
  try {
    const task = await db.query(
      "DELETE FROM tasks WHERE ID = $1 AND project_ID = $2 RETURNING *",
      [taskId, id],
    );
    if (!task.rows[0])
      return res.status(404).json({ error: "Task not found." });
    res.status(200).json({
      success: `Deleted Task of ID ${taskId} from Project ${id} Successfully.`,
      task: task.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete Task." });
  }
});

module.exports = router;
