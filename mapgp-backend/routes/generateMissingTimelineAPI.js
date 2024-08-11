const { exec } = require("child_process");
const express = require("express");
const path = require("path"); // Add this line to import the path module
const router = express.Router();

router.post("/generate-missing-timeline", (req, res) => {
  const { country1, country2 } = req.body;

  if (!country1 || !country2) {
    return res
      .status(400)
      .json({ success: false, message: "Both countries must be provided." });
  }

  // Wrap country names with quotes to handle spaces
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
});

module.exports = router;
