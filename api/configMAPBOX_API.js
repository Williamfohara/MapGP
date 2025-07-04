// /api/configMAPBOX_API.js
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");

// Load env vars
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();

/* ----- CORS ------------------------------------------------------------ */
const allowedOrigins = [
  "https://www.mapgp.co",
  "https://mapgp.co",
  "https://mapgp.vercel.app",
  "https://map-gp.vercel.app",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, cb) =>
      !origin || allowedOrigins.includes(origin)
        ? cb(null, true)
        : cb(new Error("Not allowed by CORS")),
    methods: ["GET", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("*", cors());
/* ---------------------------------------------------------------------- */

// Serve keys
app.get("/", (req, res) => {
  res.json({
    mapboxApiKey: process.env.MAPBOX_API_KEY,
    openAiApiKey: process.env.OPENAI_API_KEY, // keep if you really need it
  });
});

module.exports = app;
