const express = require("express");
const db = require("../db");
const router = express.Router();

router.get("/:id/members", async (req, res) => {
  try {
    const members = await db.query(
      "SELECT users.*, project_members.role AS project_role FROM project_members JOIN users ON project_members.user_id = users.id WHERE project_members.project_id = $1",
      [req.params.id],
    );
    if (members.rows.length === 0)
      return res.status(404).json({ error: "No members found." });
    res.status(200).json(members.rows);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.post("/:id/members", async (req, res) => {
  try {
    const { user_id, role } = req.body;
    const member = await db.query(
      "INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) RETURNING *",
      [req.params.id, user_id, role],
    );
    res.status(201).json({
      success: "Member added successfully.",
      member: member.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.delete("/:id/members/:userId", async (req, res) => {
  try {
    const { id, userId } = req.params;
    const member = await db.query(
      "DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING *",
      [id, userId],
    );
    if (!member.rows[0])
      return res.status(404).json({ error: "Member not found." });
    res.status(200).json({
      success: "Member removed successfully.",
      member: member.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

module.exports = router;
