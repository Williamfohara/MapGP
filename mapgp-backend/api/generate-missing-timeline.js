const { exec } = require("child_process");
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// Add this middleware to parse JSON body
app.use(express.json());

const handler = (req, res) => {
  const { country1, country2 } = req.body;

  if (!country1 || !country2) {
    return res
      .status(400)
      .json({ success: false, message: "Both countries must be provided." });
  }

  const command = `node ${path.resolve(
    __dirname,
    "../manualDBManipulation/generateMissingTimeline.js"
  )} "${country1}" "${country2}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${stderr}`);
      return res
        .status(500)
        .json({ success: false, message: "Error generating timeline." });
    }

    console.log(`Output: ${stdout}`);
    res
      .status(200)
      .json({ success: true, message: "Timeline generated successfully." });
  });
};

// Add CORS middleware
app.use(
  cors({
    origin: "https://www.mapgp.co", // Allow requests only from your frontend domain
    methods: ["GET", "POST"], // Specify allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
  })
);

// Define the route for generating missing timeline
app.post("/api/generate-missing-timeline", handler);

module.exports = app;
