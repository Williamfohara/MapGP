/*  /api/getEventDetailsId.js  – no Express, ready for Vercel  */
const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

/* ────────── config ────────── */
const mongoUri = process.env.MONGO_URI;
const allowedOrigins = ["https://www.mapgp.co", "https://mapgp.vercel.app"];

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

  /* Only GET supported */
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).end("Method Not Allowed");
  }

  const { country1, country2, year } = req.query;
  if (!country1 || !country2 || !year)
    return res
      .status(400)
      .json({ error: "country1, country2 and year query params required" });

  try {
    const db = await getDb();
    const coll = db.collection("eventDetails");

    /* try original order, then swapped */
    const event =
      (await coll.findOne({ country1, country2, year })) ||
      (await coll.findOne({ country1: country2, country2: country1, year }));

    if (!event) return res.status(404).json({ error: "Event not found" });

    return res.json({ _id: event._id });
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ error: "Database error" });
  }
};
