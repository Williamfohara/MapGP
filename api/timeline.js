// api/timeline.js
import { MongoClient } from "mongodb";
import axios from "axios";

// ─────────────────────────── Config ────────────────────────────
const allowedOrigins = [
  "https://www.mapgp.co",
  "https://mapgp.vercel.app",
  // add more domains as needed
];

let cachedClient; // shared across invocations
let cachedDb; // ditto

async function getCollection() {
  if (!cachedDb) {
    cachedClient = new MongoClient(process.env.MONGO_URI);
    await cachedClient.connect();
    cachedDb = cachedClient.db("testingData1");
  }
  return cachedDb.collection("timelineData");
}

// ─────────────────────────── Utilities ─────────────────────────
function sendCORS(res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function formatTimeline(raw) {
  return raw
    .replace(
      /(#+)\s*(.*?)\n/g,
      (_, __, txt) => `<strong>${txt.trim()}</strong><br>`
    )
    .replace(/#/g, "")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/<br>\s*\n|\n\s*<br>/g, "<br>")
    .replace(/\n/g, "<br>");
}

function parseTimelineToJSON(html, country1, country2) {
  return html
    .split("<br>")
    .map((line) => {
      const m = line.match(/^(\d{4}(-\d{4}s?)?)/);
      if (!m) return null;
      const year = m[1];
      const text = line.replace(/^(\d{4}(-\d{4}s?)?)\s*/, "").trim();
      return { year, text, country1, country2 };
    })
    .filter(Boolean);
}

// ───────────────────── Timeline generation ─────────────────────
async function generateTimeline(country1, country2) {
  const prompt = `You are a historian of international geopolitics. Create a detailed timeline with excruciating granularity ... ${country1} ... ${country2} ...`; // unchanged prompt

  const { data } = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: 10500,
      temperature: 0.4,
      top_p: 0.9,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 200_000,
    }
  );

  return formatTimeline(data.choices[0].message.content.trim());
}

// ───────────────────────── Main handler ────────────────────────
export default async function handler(req, res) {
  // CORS pre-flight
  if (req.method === "OPTIONS") {
    sendCORS(res);
    return res.status(204).end();
  }

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  sendCORS(res);

  const isGet = req.method === "GET";
  const isPost = req.method === "POST";
  const { country1, country2 } = isGet ? req.query : req.body || {};

  if (!country1 || !country2) {
    return res
      .status(400)
      .json({ error: "country1 and country2 are required" });
  }

  try {
    const col = await getCollection();

    if (isGet) {
      // READ ───────────────────────────────────────────────
      const timeline = await col
        .find({ country1, country2 })
        .project({ year: 1, text: 1, _id: 0 })
        .sort({ year: 1 })
        .toArray();

      return res.json(timeline);
    }

    if (isPost) {
      // GENERATE + WRITE ──────────────────────────────────
      const exists = await col.findOne({ country1, country2 });
      if (exists) {
        return res.json({ message: "Timeline already exists" });
      }

      const html = await generateTimeline(country1, country2);
      const events = parseTimelineToJSON(html, country1, country2);

      if (events.length) await col.insertMany(events);
      return res.json({ inserted: events.length });
    }

    // Unsupported verb
    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(405).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

// Give the function more breathing room for the OpenAI call
export const config = { maxDuration: 60 };
