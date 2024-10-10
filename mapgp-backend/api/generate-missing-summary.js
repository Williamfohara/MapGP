const express = require("express");
const cors = require("cors");
const {
  handleGenerateSummaryRequest,
} = require("../manualDBManipulation/generateMissingSummary.js");

const handler = (req, res) => {
  handleGenerateSummaryRequest(req, res);
};

const app = express();
app.use(express.json()); // To parse JSON body

// Updated CORS setup
app.use(
  cors({
    origin: "https://www.mapgp.co", // Allow requests only from your frontend domain
    methods: ["GET", "POST"], // Specify allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
    credentials: true, // Allow sending cookies and authorization headers
  })
);

// Define route
app.post("/api/generate-missing-summary", handler);

module.exports = app;
