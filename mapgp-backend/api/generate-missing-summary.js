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

// Update in the handleGenerateSummaryRequest function
async function handleGenerateSummaryRequest(req, res) {
  const { country1, country2 } = req.body;

  if (!country1 || !country2) {
    return res
      .status(400)
      .json({ success: false, message: "Both countries must be provided." });
  }

  try {
    const result = await generateAndStoreSummary(country1, country2);
    res.json(result);
  } catch (error) {
    // Set the CORS headers manually if not applied
    res.setHeader("Access-Control-Allow-Origin", "https://www.mapgp.co");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    console.error("Error handling generate summary request:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
