const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");

// Load environment variables from the .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();

/* ----- CORS CONFIG ----------------------------------------------------- */
const allowedOrigins = [
  "https://www.mapgp.co", // prod (www)
  "https://mapgp.co", // prod (bare)
  "https://mapgp.vercel.app", // Vercel prod
  "https://map-gp.vercel.app", // Vercel prod (dashed)
  "https://map-aeoy9ja19-williamfoharas-projects.vercel.app", // preview deploy
  "http://localhost:3000", // local dev
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow tools like curl/Postman (no Origin header)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.log("❌ Blocked CORS origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Handle pre-flight requests
app.options("*", cors());
/* ---------------------------------------------------------------------- */

// Route handler for serving the API keys
const handler = (req, res) => {
  res.json({
    mapboxApiKey: process.env.MAPBOX_API_KEY,
    backendUrl: process.env.BACKEND_URL,
    openAiApiKey: process.env.OPENAI_API_KEY,
  });
};

// API route
app.get("/api/configMAPBOX_API", handler);

// Export the Express app instance
module.exports = app;
