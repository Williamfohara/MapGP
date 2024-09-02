const { MongoClient, ObjectId } = require("mongodb");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from the .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Initialize MongoDB client
const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let db; // To store the database connection

// Connect to MongoDB function
async function connectToMongoDB() {
  if (!db) {
    console.log("Connecting to MongoDB...");
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

  // Ensure MongoDB is connected
  await connectToMongoDB();

  const { _id } = req.query;

  if (!_id) {
    console.error("Missing required query parameter: _id");
    return res
      .status(400)
      .json({ error: "Missing required query parameter: _id" });
  }

  try {
    const objectId = new ObjectId(_id);
    const collection = db.collection("eventDetails");

    // Fetch the event by its ID
    const event = await collection.findOne({ _id: objectId });

    if (!event) {
      console.log("Event not found for ID:", _id);
      return res.status(404).json({ error: "Event not found" });
    }

    // Fetch all events related to the same countries
    const allEvents = await collection
      .find({
        $or: [
          { country1: event.country1, country2: event.country2 },
          { country1: event.country2, country2: event.country1 },
        ],
      })
      .sort({ year: 1 })
      .toArray();

    // Map to get all event IDs as strings
    const allEventIDs = allEvents.map((event) => event._id.toString());

    res.json({
      eventDetails: event.details,
      eventYear: event.year,
      allEventIDs: allEventIDs, // Return all relevant event IDs
    });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
};
