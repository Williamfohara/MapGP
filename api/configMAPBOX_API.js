/*  /api/configMAPBOX_API.js  – no Express, ready for Vercel  */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

/* ────────── CORS setup ────────── */
const allowedOrigins = [
  "https://www.mapgp.co",
  "https://mapgp.co",
  "https://mapgp.vercel.app",
  "https://map-gp.vercel.app",
  "http://localhost:3000",
];

/* ────────── main handler ────────── */
module.exports = async (req, res) => {
  /* CORS & pre-flight */
  res.setHeader(
    "Access-Control-Allow-Origin",
    allowedOrigins.includes(req.headers.origin) ? req.headers.origin : "null"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  /* Only GET (all paths) */
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).end("Method Not Allowed");
  }

  /* Log prefix but never full key */
  console.log(
    "MAPBOX_API_KEY prefix:",
    process.env.MAPBOX_API_KEY
      ? process.env.MAPBOX_API_KEY.slice(0, 6)
      : "undefined"
  );

  /* Respond with the key */
  return res.json({
    mapboxApiKey: process.env.MAPBOX_API_KEY || null,
  });
};
