const { MongoClient } = require("mongodb");
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

  const { country1, country2 } = req.query; // Removed 'year' as it is not needed now

  if (!country1 || !country2) {
    console.error("Missing required query parameters: country1, country2");
    return res.status(400).json({
      error: "Missing required query parameters: country1, country2",
    });
  }

  try {
    const collection = db.collection("eventDetails");

    // Fetch all events related to the specified countries, regardless of the year
    const allEvents = await collection
      .find({
        $or: [
          { country1: country1, country2: country2 },
          { country1: country2, country2: country1 },
        ],
      })
      .sort({ year: 1 })
      .toArray();

    if (allEvents.length === 0) {
      console.log("No events found for the specified countries:", {
        country1,
        country2,
      });
      return res.status(404).json({ error: "No events found" });
    }

    // Map to get all event IDs as strings
    const allEventIDs = allEvents.map((event) => event._id.toString());

    res.json({ allEventIDs: allEventIDs }); // Return all relevant event IDs
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Database error" });
  }
};
