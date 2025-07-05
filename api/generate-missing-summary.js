/*  /api/generate-missing-summary.js  – no Express, ready for Vercel  */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const {
  handleGenerateSummaryRequest,
} = require("../mapgp-backend/manualDBManipulation/generateMissingSummary.js");

/* ────────── CORS setup ────────── */
const allowedOrigins = [
  "https://www.mapgp.co",
  "https://mapgp.co",
  "https://mapgp.vercel.app",
  "https://map-gp.vercel.app",
  "http://localhost:3000",
];

/* ────────── helper: read JSON body ────────── */
async function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
  });
}

/* ────────── main handler ────────── */
module.exports = async (req, res) => {
  /* CORS & pre-flight */
  res.setHeader(
    "Access-Control-Allow-Origin",
    allowedOrigins.includes(req.headers.origin) ? req.headers.origin : "null"
  );
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  /* Only POST allowed */
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).end("Method Not Allowed");
  }

  /* Parse JSON and attach to req.body so the existing helper keeps working */
  try {
    req.body = await readJson(req);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  /* Delegate to your existing generator */
  try {
    await handleGenerateSummaryRequest(req, res);
  } catch (err) {
    console.error("generate-missing-summary error:", err);
    if (!res.headersSent)
      return res.status(500).json({ error: "Internal server error" });
  }
};
