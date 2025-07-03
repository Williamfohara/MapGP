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
    origin: "https://www.mapgp.co", // Allow requests only from your frontend domain
    methods: ["GET", "POST"], // Specify allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
  })
);

// Define the route handler for serving the API keys
const handler = (req, res) => {
  res.json({
    mapboxApiKey: process.env.MAPBOX_API_KEY,
    backendUrl: process.env.BACKEND_URL,
    openAiApiKey: process.env.OPENAI_API_KEY,
  });
};

// Define the API route
app.get("/api/configAPIs", handler);

// Export the Express app instance
module.exports = app;
