const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");

// Load environment variables from the .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();

// Define allowed origins
const allowedOrigins = [
  "https://www.mapgp.co", // production domain
  "https://mapgp.vercel.app", // Vercel production fallback
  "https://map-aeoy9ja19-williamfoharas-projects.vercel.app", // Vercel preview deploy
];

// Enable CORS for all routes with dynamic origin checking
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

// Handle preflight requests
app.options("*", cors());

// Define the route handler for serving the API keys
const handler = (req, res) => {
  res.json({
    mapboxApiKey: process.env.MAPBOX_API_KEY,
    backendUrl: process.env.BACKEND_URL,
    openAiApiKey: process.env.OPENAI_API_KEY,
  });
};

// Define the API route
app.get("/api/configMAPBOX_API", handler);

// Export the Express app instance
module.exports = app;
