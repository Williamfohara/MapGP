const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");

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

  const { country1, country2, year } = req.query;

  if (!country1 || !country2 || !year) {
    return res.status(400).json({
      error: "Missing required query parameters: country1, country2, year",
    });
  }

  try {
    const collection = db.collection("eventDetails");
    let event = await collection.findOne({
      country1: country1,
      country2: country2,
      year: year,
    });

    if (!event) {
      event = await collection.findOne({
        country1: country2,
        country2: country1,
        year: year,
      });
    }

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({ _id: event._id });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

const app = express();
app.use(cors()); // Enable CORS
module.exports = app.use(handler);
