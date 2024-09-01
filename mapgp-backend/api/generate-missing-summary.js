const express = require("express");
const cors = require("cors");
const {
  handleGenerateSummaryRequest,
} = require("../manualDBManipulation/generateMissingSummary.js");

const handler = (req, res) => {
  handleGenerateSummaryRequest(req, res);
};

const app = express();
app.use(
  cors({
    origin: "*", // Allow only your frontend domain
  })
); // Enable CORS for all routes
app.post("/api/generate-missing-summary", handler); // Define route

module.exports = app;
