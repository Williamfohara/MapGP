const express = require("express");
const cors = require("cors");
const {
  handleGenerateSummaryRequest,
} = require("../mapgp-backend/manualDBManipulation/generateMissingSummary.js");

const handler = (req, res) => {
  handleGenerateSummaryRequest(req, res);
};

const app = express();
app.use(express.json()); // To parse JSON body

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked CORS origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Handle preflight requests for CORS
app.options("*", cors()); // Enable pre-flight for all routes

// Define route
app.post("/api/generate-missing-summary", handler);

module.exports = app;
