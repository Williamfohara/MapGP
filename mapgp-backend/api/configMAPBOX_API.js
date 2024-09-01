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
app.use(
  cors({
    origin: "https://www.mapgp.co", // Allow only your frontend domain
  })
); // Enable CORS for all routes
app.get("/api/configMAPBOX_API", handler); // Set the correct path for the endpoint

module.exports = app;
