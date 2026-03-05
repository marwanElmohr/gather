const express = require("express");
const db = require("../db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const clients = await db.query("SELECT * FROM clients");
    if (clients.rows.length === 0)
      return res.status(404).json({ error: "There are no clients yet." });
    res.json(clients.rows);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const client = await db.query("SELECT * FROM clients WHERE ID = $1", [
      req.params.id,
    ]);
    if (!client.rows[0])
      return res.status(404).json({ error: "Client not found." });
    res.status(200).json(client.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, contact_name, contact_email, contact_phone, industry, logo } =
      req.body;
    const client = await db.query(
      "INSERT INTO clients (name, contact_name, contact_email, contact_phone, industry, logo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, contact_name, contact_email, contact_phone, industry, logo],
    );
    res.status(200).json({
      success: `Created Client Successfully`,
      client: client.rows[0],
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
    const client = await db.query(
      "UPDATE clients SET name=$1, contact_name=$2, contact_email=$3, contact_phone=$4, industry=$5, logo=$6 WHERE ID=$7 RETURNING *",
      [name, contact_name, contact_email, contact_phone, industry, logo, id],
    );
    if (!client.rows[0])
      return res.status(404).json({ error: "Client not found." });
    res.status(200).json({
      success: `Updated Client of ID ${id} Successfully`,
      client: client.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to edit Client." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const client = await db.query(
      "DELETE FROM clients WHERE ID = $1 RETURNING *",
      [id],
    );
    if (!client.rows[0])
      return res.status(404).json({ error: "Client not found." });
    res.status(200).json({
      success: `Deleted Client of ID ${id} Successfully.`,
      client: client.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete Client." });
  }
});

module.exports = router;
