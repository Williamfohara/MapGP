const express = require("express");
const { MongoClient } = require("mongodb");
const path = require("path");
const dotenv = require("dotenv");
const cors = require("cors");

// Load environment variables from the .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();

// Enable CORS for all routes by placing this before any route definitions
app.use(
  cors({
    origin: "https://www.mapgp.co", // Allow requests only from your frontend domain
    methods: ["GET", "POST"], // Specify allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
  })
);

// Define the route handler for fetching relationship summary from MongoDB
const handler = async (req, res) => {
  const mongoUri = process.env.MONGO_URI;
  const client = new MongoClient(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const db = client.db("testingData1");
    const collection = db.collection("relationshipData");

    const { country1, country2 } = req.query;
    if (!country1 || !country2) {
      return res.status(400).json({
        error: "Missing required query parameters: country1 and country2",
      });
    }

    const result = await collection.findOne(
      { country1: country1.trim(), country2: country2.trim() },
      { projection: { relationshipSummary: 1 } }
    );

    res.json({
      relationshipSummary: result ? result.relationshipSummary : null,
    });
  } catch (error) {
    console.error("Error fetching relationship summary:", error);
    res.status(500).json({
      error: "An error occurred while fetching the relationship summary.",
    });
  } finally {
    await client.close();
  }
};

// Define the API route
app.get("/api/mongo-query-config", handler);

// Export the Express app instance
module.exports = app;
