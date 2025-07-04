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
  "https://www.mapgp.co", // production (www)
  "https://mapgp.co", // production (bare)
  "https://mapgp.vercel.app", // Vercel production
  "https://map-gp.vercel.app", // Vercel production (dashed)
  "http://localhost:3000", // local dev
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

app.options("*", cors()); // handle pre-flight
/* ---------------------------------------------------------------------- */

// Catch any path / any method
app.all("*", (req, res) => {
  // 👇 print the first 6 characters so we don't leak the whole key
  console.log(
    "MAPBOX_API_KEY prefix:",
    process.env.MAPBOX_API_KEY
      ? process.env.MAPBOX_API_KEY.slice(0, 6)
      : "undefined"
  );

  res.json({
    mapboxApiKey: process.env.MAPBOX_API_KEY || null,
  });
});

module.exports = app;
