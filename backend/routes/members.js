const express = require("express");
const { ProjectMember } = require("../db");
const router = express.Router();

router.get("/:id/members", async (req, res) => {
  try {
    const members = await ProjectMember.find({ project_id: req.params.id }).populate(
      "user_id",
    );
    if (members.length === 0)
      return res.status(404).json({ error: "No members found." });
    res.status(200).json(
      members.map((member) => {
        const data = member.toJSON();
        const user = data.user_id || {};
        return {
          ...user,
          project_role: data.role,
        };
      }),
    );
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.post("/:id/members", async (req, res) => {
  try {
    const { user_id, role } = req.body;
    const member = await ProjectMember.create({
      project_id: req.params.id,
      user_id,
      role,
    });
    res.status(201).json({
      success: "Member added successfully.",
      member: member.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.delete("/:id/members/:userId", async (req, res) => {
  try {
    const { id, userId } = req.params;
    const member = await ProjectMember.findOneAndDelete({
      project_id: id,
      user_id: userId,
    });
    if (!member)
      return res.status(404).json({ error: "Member not found." });
    res.status(200).json({
      success: "Member removed successfully.",
      member: member.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

module.exports = router;
