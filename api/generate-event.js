const express = require("express");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const {
  populateDatabase,
} = require("../mapgp-backend/manualDBManipulation/populateDatabaseEvents.js");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri);

let db;

async function connectToMongoDB() {
  if (!db) {
    await client.connect();
    db = client.db("testingData1");
  }
}

const handler = async (req, res) => {
  await connectToMongoDB();

  const { country1, country2, text, year } = req.body;

  if (!country1 || !country2 || !text || !year) {
    return res
      .status(400)
      .json({ error: "country1, country2, text, and year are required" });
  }

  try {
    await populateDatabase(country1, country2, text, year);
    res.status(200).json({ message: "Events generated successfully" });
  } catch (error) {
    console.error("Error occurred while generating events:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const app = express();

// Enable CORS with specific settings
app.use(
  cors({
    origin: "https://www.mapgp.co", // Allow requests only from your frontend domain
    methods: ["GET", "POST", "OPTIONS"], // Include OPTIONS for preflight
    allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  })
);

// Add middleware to parse JSON bodies
app.use(express.json());

app.post("/api/generate-event", handler); // Define route

module.exports = app;
