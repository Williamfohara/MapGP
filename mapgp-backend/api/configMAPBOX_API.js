const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const handler = (req, res) => {
  res.json({
    mapboxAccessToken: process.env.MAPBOX_API_KEY,
  });
};

module.exports = express().get(handler);
