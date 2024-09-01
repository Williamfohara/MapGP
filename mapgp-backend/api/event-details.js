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

  const { _id } = req.query;

  if (!_id) {
    return res
      .status(400)
      .json({ error: "Missing required query parameter: _id" });
  }

  try {
    const objectId = new ObjectId(_id);
    const collection = db.collection("eventDetails");
    const event = await collection.findOne({ _id: objectId });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const allEvents = await collection
      .find({
        $or: [
          { country1: event.country1, country2: event.country2 },
          { country1: event.country2, country2: event.country1 },
        ],
      })
      .sort({ year: 1 })
      .toArray();

    const allEventIDs = allEvents.map((event) => event._id.toString());

    res.json({
      eventDetails: event.details,
      eventYear: event.year,
      allEventIDs: allEventIDs,
    });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

const app = express();
app.use(
  cors({
    origin: "https://www.mapgp.co", // Allow only your frontend domain
  })
); // Enable CORS for all routes
app.get("/api/event-details", handler); // Define route

module.exports = app;
