const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const handler = (req, res) => {
  res.json({
    mapboxAccessToken: process.env.MAPBOX_API_KEY,
  });
};

const app = express();
app.use(cors()); // Enable CORS
module.exports = app.get(handler);
