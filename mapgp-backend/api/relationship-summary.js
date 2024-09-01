const { MongoClient } = require("mongodb");
const path = require("path");
const dotenv = require("dotenv");
const cors = require("cors");

// Load environment variables from the .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Initialize MongoDB client
const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Serverless function handler
module.exports = async (req, res) => {
  // Enable CORS for this endpoint
  res.setHeader("Access-Control-Allow-Origin", "https://www.mapgp.co");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end(); // Preflight request handling
    return;
  }

  let { country1, country2 } = req.query;
  console.log("Received parameters:", { country1, country2 });

  if (!country1 || !country2) {
    return res.status(400).json({
      error: "Missing required query parameters: country1 and country2",
    });
  }

  country1 = country1.trim();
  country2 = country2.trim();

  try {
    if (!client.isConnected()) await client.connect();
    const db = client.db("testingData1");
    const collection = db.collection("relationshipData");

    const query = { country1, country2 };
    console.log("Query to MongoDB:", query);
    const result = await collection.findOne(query, {
      projection: { relationshipSummary: 1 },
    });

    if (result) {
      res.json({ relationshipSummary: result.relationshipSummary });
    } else {
      res.json({ relationshipSummary: null });
    }
  } catch (error) {
    console.error("Error fetching relationship summary:", error);
    res.status(500).json({
      error: "An error occurred while fetching the relationship summary.",
    });
  }
};
