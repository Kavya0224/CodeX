const express = require("express");
const cors = require("cors");
const solveRoute = require("./routes/solveRoute");
const { PORT } = require("./config/env");

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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});