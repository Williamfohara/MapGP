// /api/timeline.js  ― ONE Vercel function, two HTTP methods
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// ────── config ──────
const mongoUri = process.env.MONGO_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const allowedOrigins = ["https://www.mapgp.co", "https://mapgp.vercel.app"];

const client = new MongoClient(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function connectToMongo() {
  if (!client.topology?.isConnected()) await client.connect();
  return client.db("testingData1");
}

// ────── helper: generate timeline via OpenAI ──────
async function generateRelationshipTimeline(country1, country2) {
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
    {
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      timeout: 200_000,
    }
  );

  const raw = data.choices[0].message.content.trim();
  return raw
    .split(/\n+/)
    .filter(Boolean)
    .map((line) => {
      const [year, ...rest] = line.split(" ");
      return { year, text: rest.join(" "), country1, country2 };
    });
}

// ────── express app ──────
const app = express();
app.use(express.json());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      console.log("❌ Blocked CORS origin:", origin);
      cb(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// one OPTIONS handler for all
app.options("*", cors());

// ───────────  GET  /api/timeline  ───────────
// returns stored timeline documents
app.get("/", async (req, res) => {
  const { country1, country2 } = req.query;
  if (!country1 || !country2)
    return res.status(400).send("country1 and country2 are required.");

  try {
    const db = await connectToMongo();
    const data = await db
      .collection("timelineData")
      .find({ country1, country2 })
      .project({ year: 1, text: 1 })
      .sort({ year: 1 })
      .toArray();

    return res.json(data);
  } catch (err) {
    console.error("Error fetching timeline:", err);
    res.status(500).send("Error fetching timeline.");
  }
});

// ───────────  POST /api/timeline  ───────────
// generates timeline if missing, idempotent
app.post("/", async (req, res) => {
  const { country1, country2 } = req.body;
  if (!country1 || !country2)
    return res
      .status(400)
      .json({ success: false, message: "Both countries required." });

  try {
    const db = await connectToMongo();
    const coll = db.collection("timelineData");

    const existing = await coll.findOne({ country1, country2 });
    if (existing) {
      return res.json({ success: true, message: "Timeline already exists." });
    }

    const entries = await generateRelationshipTimeline(country1, country2);
    if (!entries.length) throw new Error("OpenAI returned empty timeline.");

    await coll.insertMany(entries);
    return res.json({ success: true, message: "Timeline generated." });
  } catch (err) {
    console.error("Error generating timeline:", err);
    res
      .status(500)
      .json({ success: false, message: "Error generating timeline." });
  }
});

// Important for Vercel: export the express app
module.exports = app;
