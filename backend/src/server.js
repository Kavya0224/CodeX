const express = require("express");
const cors = require("cors");
const solveRoute = require("./routes/solveRoute");
const explainRoute = require("./routes/explainRoute");
const { PORT } = require("./config/env");
const { cleanupOldWorkspaceFiles } = require("./execution/fileManager");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running successfully"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    server: "running"
  });
});

app.use("/solve", solveRoute);
app.use("/explain", explainRoute);

cleanupOldWorkspaceFiles({ maxAgeMs: 60 * 60 * 1000 });

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});