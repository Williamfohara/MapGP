// /api/timeline.js  – no Express
const { MongoClient } = require("mongodb");
const axios = require("axios");
require("dotenv").config();

const mongoUri = process.env.MONGO_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const allowedOrigins = ["https://www.mapgp.co", "https://mapgp.vercel.app"];

// ──────────  re-use one Mongo connection across invocations
let cachedClient;
async function getDb() {
  if (!cachedClient) cachedClient = await new MongoClient(mongoUri).connect();
  return cachedClient.db("testingData1");
}

// ──────────  helper to read JSON body
async function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (e) {
        reject(new Error("Invalid JSON body"));
      }
    });
  });
}

// ──────────  timeline generator (same as before)
async function generateTimeline(country1, country2) {
  const prompt = `You are a historian of international geopolitics. Create a detailed timeline with excruciating granularity (in regards to the decision of whether or not to add a timeline event) explaining the geopolitical relationship between ${country1} and ${country2} from when they first recognized each other up to the present day. Ensure the criteria for deciding whether or not to include the timeline entry includes whether the entry will provide rich context, including key figures, political contexts, specific actions, and consequences. Avoid generalizations and instead include concrete events, treaties, wars, diplomatic missions, and significant political and economic changes. Each entry should begin with the year, followed by a concise but detailed description. Do not use bullet points. EACH ENTRY MUST BE LESS THAN 230 CHARACTERS. Make sure the entries don't end in periods. Here are some examples: "1821 Mexico gains independence from Spain 1822 Joel Robert Poinsett embarks on a special mission to Mexico, publishing an account of his experiences in 'Notes on Mexico'". This is one entry: "1821 Mexico gains independence from Spain". Do not acknowledge me in your response.`;
  const { data } = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: 10_500,
      temperature: 0.4,
      top_p: 0.9,
    },
    { headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }, timeout: 200_000 }
  );

  return data.choices[0].message.content
    .trim()
    .split(/\n+/)
    .filter(Boolean)
    .map((line) => {
      const [year, ...rest] = line.split(" ");
      return { year, text: rest.join(" "), country1, country2 };
    });
}

// ──────────  single export Vercel expects
module.exports = async (req, res) => {
  // CORS (incl. pre-flight)
  res.setHeader(
    "Access-Control-Allow-Origin",
    allowedOrigins.includes(req.headers.origin) ? req.headers.origin : "null"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  // GET  /api/timeline?country1=A&country2=B
  if (req.method === "GET") {
    const { country1, country2 } = req.query;
    if (!country1 || !country2)
      return res.status(400).send("country1 and country2 required");
    try {
      const db = await getDb();
      const data = await db
        .collection("timelineData")
        .find({ country1, country2 })
        .project({ year: 1, text: 1 })
        .sort({ year: 1 })
        .toArray();
      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).send("Error fetching timeline");
    }
  }

  // POST /api/timeline   { country1, country2 }
  if (req.method === "POST") {
    let body;
    try {
      body = await readJson(req);
    } catch (e) {
      return res.status(400).send(e.message);
    }
    const { country1, country2 } = body;
    if (!country1 || !country2)
      return res
        .status(400)
        .json({ success: false, message: "Both countries required" });

    try {
      const db = await getDb();
      const coll = db.collection("timelineData");
      const exists = await coll.findOne({ country1, country2 });
      if (exists)
        return res.json({ success: true, message: "Timeline already exists" });

      const entries = await generateTimeline(country1, country2);
      await coll.insertMany(entries);
      return res.json({ success: true, message: "Timeline generated" });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ success: false, message: "Error generating timeline" });
    }
  }

  // Anything else
  res.setHeader("Allow", "GET, POST, OPTIONS");
  return res.status(405).end("Method Not Allowed");
};
