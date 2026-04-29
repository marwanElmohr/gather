const express = require("express");
const { Client } = require("../db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const clients = await Client.find();
    if (clients.length === 0)
      return res.status(404).json({ error: "There are no clients yet." });
    res.json(clients.map((client) => client.toJSON()));
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client)
      return res.status(404).json({ error: "Client not found." });
    res.status(200).json(client.toJSON());
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, contact_name, contact_email, contact_phone, industry, logo } =
      req.body;
    const client = await Client.create({
      name,
      contact_name,
      contact_email,
      contact_phone,
      industry,
      logo,
    });
    res.status(200).json({
      success: `Created Client Successfully`,
      client: client.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create Client." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, contact_name, contact_email, contact_phone, industry, logo } =
      req.body;
    const id = req.params.id;
    const client = await Client.findByIdAndUpdate(
      id,
      { name, contact_name, contact_email, contact_phone, industry, logo },
      { new: true },
    );
    if (!client)
      return res.status(404).json({ error: "Client not found." });
    res.status(200).json({
      success: `Updated Client of ID ${id} Successfully`,
      client: client.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to edit Client." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const client = await Client.findByIdAndDelete(id);
    if (!client)
      return res.status(404).json({ error: "Client not found." });
    res.status(200).json({
      success: `Deleted Client of ID ${id} Successfully.`,
      client: client.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete Client." });
  }
});

module.exports = router;
