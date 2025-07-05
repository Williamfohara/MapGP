/*  /api/generate-all-events.js  – no Express, ready for Vercel  */
const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const {
  populateDatabase,
} = require("../manualDBManipulation/populateDatabaseEvents.js");

/* ────────── config ────────── */
const mongoUri = process.env.MONGO_URI;
const allowedOrigins = ["https://www.mapgp.co", "https://mapgp.vercel.app"];

/* ────────── reuse one Mongo connection across invocations ────────── */
let cachedClient;
async function getDb() {
  if (!cachedClient) cachedClient = await new MongoClient(mongoUri).connect();
  return cachedClient.db("testingData1");
}

/* ────────── helper: read JSON body (for POST) ────────── */
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
  /* CORS (incl. pre-flight) */
  res.setHeader(
    "Access-Control-Allow-Origin",
    allowedOrigins.includes(req.headers.origin) ? req.headers.origin : "null"
  );
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  /* Accept POST only */
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).end("Method Not Allowed");
  }

  /* Parse body */
  let body;
  try {
    body = await readJson(req);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  const { country1, country2 } = body;
  if (!country1 || !country2)
    return res
      .status(400)
      .json({ error: "country1 and country2 are required" });

  try {
    const db = await getDb();

    /* fetch existing timeline years */
    const timelineYears = await db
      .collection("timelineData")
      .find({ country1, country2 })
      .project({ year: 1 })
      .toArray();

    if (!timelineYears.length)
      return res
        .status(404)
        .json({ error: "No timeline data found for these countries." });

    const allYears = timelineYears.map((e) => +e.year);
    const first = Math.min(...allYears);
    const last = Math.max(...allYears);
    const range = Array.from({ length: last - first + 1 }, (_, i) =>
      String(first + i)
    );

    /* fetch already-generated event years */
    const existingEvents = await db
      .collection("eventDetails")
      .find({ country1, country2 })
      .project({ year: 1 })
      .toArray();
    const doneYears = existingEvents.map((e) => e.year);

    /* figure out which years still need events */
    const toGenerate = range.filter((year) => !doneYears.includes(year));
    if (!toGenerate.length)
      return res
        .status(200)
        .json({ message: "All events are already generated!" });

    /* generate missing events */
    for (const year of toGenerate) {
      const text = `Event description for ${country1} and ${country2} in ${year}`; // placeholder
      await populateDatabase(country1, country2, text, year);
    }

    return res
      .status(200)
      .json({ message: "All missing events generated successfully" });
  } catch (err) {
    console.error("Error generating all events:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
