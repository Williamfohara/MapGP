const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const path = require("path");
const {
  populateDatabase,
} = require("../manualDBManipulation/populateDatabaseEvents.js");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri);

let db;

// Connect to MongoDB function
async function connectToMongoDB() {
  if (!db) {
    await client.connect();
    db = client.db("testingData1");
  }
}

// Serverless function handler
module.exports = async (req, res) => {
  // Enable CORS for this endpoint
  res.setHeader("Access-Control-Allow-Origin", "https://www.mapgp.co");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end(); // Preflight request handling
    return;
  }

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
