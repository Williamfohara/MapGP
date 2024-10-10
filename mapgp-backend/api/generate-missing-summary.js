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

// CORS setup
app.use(
  cors({
    origin: "https://www.mapgp.co", // Allow requests only from your frontend domain
    methods: ["GET", "POST", "OPTIONS"], // Specify allowed methods, including OPTIONS
    allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
    credentials: true, // Allow sending cookies and authorization headers
  })
);

// Handle preflight requests for CORS
app.options("*", cors()); // Enable pre-flight for all routes

// Define route
app.post("/api/generate-missing-summary", handler);

module.exports = app;
