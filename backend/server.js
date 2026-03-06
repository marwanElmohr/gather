const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Database connected at:", res.rows[0].now);
  }
});

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", require("./routes/users"));
app.use("/api/clients", require("./routes/clients"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/projects", require("./routes/tasks"));
app.use("/api/tasks", require("./routes/comments"));
app.use("/api/projects", require("./routes/members"));
app.use("/api/tags", require("./routes/tags"));
app.use("/api/tasks", require("./routes/attachments"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const port = process.env.PORT || 5000;

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ error: "Internal Server Error.", detail: err.message });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
