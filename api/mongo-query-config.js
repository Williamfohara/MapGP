/*  /api/mongo-query-config.js  – no Express, ready for Vercel  */
const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

/* ────────── config ────────── */
const mongoUri = process.env.MONGO_URI;
const allowedOrigins = [
  "https://www.mapgp.co",
  "https://mapgp.co",
  "https://mapgp.vercel.app",
  "https://map-gp.vercel.app",
  "http://localhost:3000",
];

/* ────────── reuse one Mongo connection across invocations ────────── */
let cachedClient;
async function getDb() {
  if (!cachedClient) cachedClient = await new MongoClient(mongoUri).connect();
  return cachedClient.db("testingData1");
}

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

  /* Only GET allowed */
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).end("Method Not Allowed");
  }

  const { country1, country2 } = req.query;
  if (!country1 || !country2)
    return res
      .status(400)
      .json({ error: "country1 and country2 query params required" });

  try {
    const db = await getDb();
    const coll = db.collection("relationshipData");

    const doc = await coll.findOne(
      { country1: country1.trim(), country2: country2.trim() },
      { projection: { relationshipSummary: 1 } }
    );

    return res.json({
      relationshipSummary: doc ? doc.relationshipSummary : null,
    });
  } catch (err) {
    console.error("Error fetching relationship summary:", err);
    return res.status(500).json({
      error: "An error occurred while fetching the relationship summary.",
    });
  }
};
