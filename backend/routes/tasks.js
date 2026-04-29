const express = require("express");
const { Task, Tag, User } = require("../db");
const router = express.Router();

function normalizeTask(taskDoc) {
  const task = taskDoc.toJSON ? taskDoc.toJSON() : taskDoc;
  const assignedToId =
    task.assigned_to && typeof task.assigned_to === "object"
      ? task.assigned_to.id
      : task.assigned_to;
  const assignee =
    task.assigned_to && typeof task.assigned_to === "object"
      ? task.assigned_to.name
      : null;
  const tags = Array.isArray(task.tag_ids)
    ? task.tag_ids.map((tag) => ({
        id: tag.id || tag._id?.toString(),
        name: tag.name,
      }))
    : [];

  return {
    ...task,
    assigned_to: assignedToId || null,
    assigned_to_id: assignedToId || null,
    assignee,
    tags,
    tag_ids: undefined,
  };
}

router.get("/:id/tasks", async (req, res) => {
  const project_id = req.params.id;
  try {
    const tasks = await Task.find({ project_id })
      .populate("assigned_to", "name")
      .populate("tag_ids", "name");
    if (tasks.length === 0) return res.json([]);
    res.json(tasks.map(normalizeTask));
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.get("/:id/tasks/:taskId", async (req, res) => {
  const { id, taskId } = req.params;
  try {
    const task = await Task.findOne({ _id: taskId, project_id: id })
      .populate("assigned_to", "name")
      .populate("tag_ids", "name");
    if (!task)
      return res.status(404).json({ error: "Task not found." });
    res.status(200).json(normalizeTask(task));
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
    const normalizedAssignee =
      typeof assigned_to === "object" && assigned_to !== null
        ? assigned_to.id
        : assigned_to;
    const tagDocs = tags.length ? await Tag.find({ _id: { $in: tags } }).select("_id") : [];
    const task = await Task.create({
      project_id,
      title,
      description,
      due_date,
      status,
      priority,
      assigned_to: normalizedAssignee || null,
      created_by: created_by || null,
      tag_ids: tagDocs.map((tag) => tag._id),
    });
    res.status(201).json({
      success: "Task created successfully.",
      task: task.toJSON(),
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
    let userId = null;
    if (typeof assigned_to === "object" && assigned_to !== null) {
      userId = assigned_to.id;
    } else if (typeof assigned_to === "string") {
      userId = assigned_to;
    }
    const updatedTagDocs = tags.length
      ? await Tag.find({ _id: { $in: tags } }).select("_id")
      : [];
    const task = await Task.findOneAndUpdate(
      { _id: taskId, project_id: id },
      {
        title,
        description,
        due_date,
        status,
        priority,
        assigned_to: userId,
        tag_ids: updatedTagDocs.map((tag) => tag._id),
      },
      { new: true },
    );
    if (!task)
      return res.status(404).json({ error: "Task not found." });
    res.status(200).json({
      success: `Updated Task of ID ${taskId} for Project ${id} Successfully`,
      task: task.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to edit Task." });
  }
});

router.delete("/:id/tasks/:taskId", async (req, res) => {
  const { id, taskId } = req.params;
  try {
    const task = await Task.findOneAndDelete({ _id: taskId, project_id: id });
    if (!task)
      return res.status(404).json({ error: "Task not found." });
    res.status(200).json({
      success: `Deleted Task of ID ${taskId} from Project ${id} Successfully.`,
      task: task.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete Task." });
  }
});

module.exports = router;
