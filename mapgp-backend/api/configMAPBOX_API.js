const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");

// Load environment variables from the .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();

// Enable CORS for all routes with specific settings
app.use(
  cors({
    origin: "*", // Allow requests only from your frontend domain
    methods: ["GET", "POST"], // Specify allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
  })
);

// Define the route handler for serving the Mapbox API key
const handler = (req, res) => {
  res.json({
    mapboxAccessToken: process.env.MAPBOX_API_KEY,
  });
};

// Define the API route
app.get("/api/configMAPBOX_API", handler);

// Export the Express app instance
module.exports = app;
