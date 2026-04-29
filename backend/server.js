const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const { connectDB } = require("./db");
const { registerRoomHandler } = require("./socket/roomHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", require("./routes/users"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/clients", require("./routes/clients"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/projects", require("./routes/tasks"));
app.use("/api/tasks", require("./routes/comments"));
app.use("/api/projects", require("./routes/members"));
app.use("/api/tags", require("./routes/tags"));
app.use("/api/tasks", require("./routes/attachments"));
app.use("/api/orgs", require("./routes/orgs"));
app.use("/api/rooms", require("./routes/rooms"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const port = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});
registerRoomHandler(io);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ error: "Internal Server Error.", detail: err.message });
});

async function startServer() {
  try {
    await connectDB();
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
}

startServer();
