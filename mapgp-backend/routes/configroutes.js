const express = require("express");
const router = express.Router();
const { MongoClient } = require("mongodb");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables from the .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

router.get("/config", (req, res) => {
  res.json({ mapboxAccessToken: process.env.MAPBOX_API_KEY });
});

const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect().then(() => {
  const db = client.db("mapgpTesting1");
  const collection = db.collection("relationshipData");

  router.get("/relationship-summary", async (req, res) => {
    let { country1, country2 } = req.query;
    country1 = country1.trim();
    country2 = country2.trim();
    console.log("Query parameters:", country1, country2); // Debug log

    try {
      const query = { country1: country1, country2: country2 };
      console.log("Query to MongoDB:", query); // Debug log
      const result = await collection.findOne(query, {
        projection: { relationshipSummary: 1 },
      });

      console.log("Result from MongoDB:", result); // Debug log

      if (result) {
        res.json({ relationshipSummary: result.relationshipSummary });
      } else {
        console.log("No matching document found"); // Debug log
        res.json({ relationshipSummary: null });
      }
    } catch (error) {
      console.error("Error fetching relationship summary:", error);
      res.status(500).json({
        error: "An error occurred while fetching the relationship summary.",
      });
    }
  });
});

module.exports = router;
