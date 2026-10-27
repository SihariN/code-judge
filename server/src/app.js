const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/health");
const { notFound, errorHandler } = require("./middleware/errors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.use("/api/health", healthRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;