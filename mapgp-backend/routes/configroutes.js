const express = require("express");
const router = express.Router();

router.get("/config", (req, res) => {
  res.json({
    featureFlag: process.env.FEATURE_FLAG, // example variable
    mapboxAccessToken: process.env.MAPBOX_API_KEY, // Add this line
  });
});

module.exports = router;
