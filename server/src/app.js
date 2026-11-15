const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");
const { notFound, errorHandler } = require("./middleware/errors");
const problemRoutes = require("./routes/problems");
const submissionRoutes = require("./routes/submissions");

const app = express();

app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/submissions", submissionRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;