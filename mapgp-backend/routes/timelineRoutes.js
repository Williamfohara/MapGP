// routes/timelineRoutes.js
const express = require("express");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config();

const router = express.Router();

const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri);

async function connectToMongoDB() {
  await client.connect();
  console.log("Connected to MongoDB");
}

router.get("/timeline", async (req, res) => {
  const { country1, country2 } = req.query;

  if (!country1 || !country2) {
    return res
      .status(400)
      .send("country1 and country2 query parameters are required.");
  }

  try {
    const db = client.db("testingData1");
    const collection = db.collection("timelineData");

    const timelineData = await collection
      .find({ country1, country2 })
      .project({ year: 1, text: 1 }) // Only include the fields you need
      .toArray();

    res.json(timelineData);
  } catch (error) {
    console.error("Error fetching timeline data:", error);
    res.status(500).send("Error fetching timeline data.");
  }
});

connectToMongoDB().catch(console.error);

module.exports = router;
