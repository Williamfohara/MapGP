/*  /api/generate-event.js  – no Express, ready for Vercel  */
const { MongoClient } = require("mongodb");
const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

/* ────────── config ────────── */
const mongoUri = process.env.MONGO_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const allowedOrigins = ["https://www.mapgp.co", "https://mapgp.vercel.app"];

/* ────────── reuse one Mongo connection across invocations ────────── */
let cachedClient;
async function getDb() {
  if (!cachedClient) cachedClient = await new MongoClient(mongoUri).connect();
  return cachedClient.db("testingData1");
}

/* ────────── helpers ────────── */
function formatEventDetails(details) {
  return details
    .replace(/USTYPE="external_link">/g, "")
    .replace(
      /(#+)\s*(.*?)\n/g,
      (_, __, t) => `<strong>${t.trim()}</strong><br>`
    )
    .replace(/#/g, "")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*\*/g, "<em>$1</em>")
    .replace(/(\b\d)\.(?=\s|$)/g, "<strong>$1</strong>")
    .replace(/(\b\d\b)(?!<\/strong>|,)/g, "<strong>$1</strong>")
    .replace(/<br>\s*\n|\n\s*<br>/g, "<br>")
    .replace(/\n/g, "<br>");
}

async function generateEventDetails(country1, country2, text) {
  const prompt = `I am a student trying to learn about geopolitical history who needs granular explanations. As an expert historian, write me an in-depth geopolitical explanation of ${text} and how it affected the relationship between ${country1} and ${country2} as if you are writing a non-fiction book about it (make it flow like a book but do not mention chapters). Start each response with a title that summarizes your response (10 words or less, no colons). Don't explain any events that happened after the year of the quote.`;

  const { data } = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: 10_500,
      temperature: 0.75,
      top_p: 0.9,
    },
    {
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      timeout: 60_000,
    }
  );

  return formatEventDetails(data.choices[0].message.content.trim());
}

/* read JSON body (for POST) */
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

  /* Only POST allowed */
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

  const { country1, country2, text, year } = body;
  if (!country1 || !country2 || !text || !year)
    return res
      .status(400)
      .json({ error: "country1, country2, text, year required" });

  try {
    /* connect once, reuse */
    const db = await getDb();
    const coll = db.collection("eventDetails");

    /* avoid duplicate insert */
    const exists = await coll.findOne({ country1, country2, year });
    if (exists)
      return res.status(200).json({ message: "Event already exists" });

    const details = await generateEventDetails(country1, country2, text);
    await coll.insertOne({ country1, country2, year, details });

    return res.status(200).json({ message: "Event generated successfully" });
  } catch (err) {
    console.error("Error generating event:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
