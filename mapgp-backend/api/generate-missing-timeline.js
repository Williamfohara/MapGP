const { exec } = require("child_process");
const express = require("express");
const cors = require("cors");
const path = require("path");

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

const app = express();
app.use(cors()); // Enable CORS for all routes
app.post("/api/generate-missing-timeline", handler); // Define route

module.exports = app;
