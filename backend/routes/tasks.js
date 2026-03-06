const express = require("express");
const db = require("../db");
const router = express.Router();

router.get("/:id/tasks", async (req, res) => {
  const project_id = req.params.id;
  try {
    const tasks = await db.query(
      `SELECT tasks.*, 
        json_agg(
          json_build_object('id', tags.id, 'name', tags.name)
        ) FILTER (WHERE tags.id IS NOT NULL) AS tags
       FROM tasks
       LEFT JOIN task_tags ON tasks.id = task_tags.task_id
       LEFT JOIN tags ON task_tags.tag_id = tags.id
       WHERE tasks.project_id = $1
       GROUP BY tasks.id`,
      [project_id],
    );
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
      `SELECT tasks.*, 
        json_agg(
          json_build_object('id', tags.id, 'name', tags.name)
        ) FILTER (WHERE tags.id IS NOT NULL) AS tags
       FROM tasks
       LEFT JOIN task_tags ON tasks.id = task_tags.task_id
       LEFT JOIN tags ON task_tags.tag_id = tags.id
       WHERE tasks.project_id = $1 AND tasks.id = $2
       GROUP BY tasks.id`,
      [id, taskId],
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
      tags = [],
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
    for (const tag of tags) {
      await db.query(
        "INSERT INTO task_tags (task_ID, tag_ID) VALUES ($1, $2)",
        [task.rows[0].id, tag],
      );
    }
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
    const {
      title,
      description,
      due_date,
      status,
      priority,
      assigned_to,
      tags = [],
    } = req.body;
    const task = await db.query(
      "UPDATE tasks SET title=$1, description=$2, due_date=$3, status=$4, priority=$5, assigned_to=$6 WHERE ID=$7 AND project_ID=$8 RETURNING *",
      [title, description, due_date, status, priority, assigned_to, taskId, id],
    );
    if (!task.rows[0])
      return res.status(404).json({ error: "Task not found." });
    await db.query("DELETE FROM task_tags WHERE task_id = $1", [taskId]);
    for (const tag_id of tags) {
      await db.query(
        "INSERT INTO task_tags (task_id, tag_id) VALUES ($1, $2)",
        [taskId, tag_id],
      );
    }
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
