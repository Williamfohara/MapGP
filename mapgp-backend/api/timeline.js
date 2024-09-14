const express = require("express");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const handler = async (req, res) => {
  const mongoUri = process.env.MONGO_URI;
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db("testingData1");
    const collection = db.collection("timelineData");

    const { country1, country2 } = req.query;
    if (!country1 || !country2) {
      return res
        .status(400)
        .send("country1 and country2 query parameters are required.");
    }

    const timelineData = await collection
      .find({ country1, country2 })
      .project({ year: 1, text: 1 })
      .sort({ year: 1 }) // Sort by 'year' in ascending order
      .toArray();

    res.json(timelineData);
  } catch (error) {
    console.error("Error fetching timeline data:", error);
    res.status(500).send("Error fetching timeline data.");
  } finally {
    await client.close();
  }
};

const app = express();
app.use(
  cors({
    origin: "https://www.mapgp.co", // Allow requests only from your frontend domain
    methods: ["GET", "POST"], // Specify allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
  })
);
app.get("/api/timeline", handler); // Define route

module.exports = app;
