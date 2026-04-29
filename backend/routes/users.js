const express = require("express");
const { User } = require("../db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const users = await User.find().lean();
    if (users.length === 0)
      return res.status(404).json({ error: "There are no users yet." });
    res.json(users.map((u) => ({ id: u._id.toString(), ...u, _id: undefined })));
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user)
      return res.status(404).json({ error: "User not found." });
    res.status(200).json({ id: user._id.toString(), ...user, _id: undefined });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await User.create({ name, email, password, role });
    res
      .status(201)
      .json({ Success: "Created User Successfully.", user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: "Failed to Create User." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ error: "User not found." });
    if (user.password !== password)
      return res.status(401).json({ error: "Invalid password." });
    res.status(200).json({
      success: "Logged in successfully.",
      user: user.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const id = req.params.id;
    const user = await User.findByIdAndUpdate(
      id,
      { name, email, password, role },
      { new: true },
    );
    if (!user)
      return res.status(404).json({ error: "User not found." });
    res.status(200).json({
      success: `Updated User of ID ${id} Successfully`,
      user: user.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to edit User." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findByIdAndDelete(id);
    if (!user)
      return res.status(404).json({ error: "User not found." });
    res.status(200).json({
      success: `Deleted User of ID ${id} Successfully.`,
      user: user.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete User." });
  }
});

module.exports = router;
