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

  const { country1, country2, year } = req.query;

  if (!country1 || !country2 || !year) {
    console.error(
      "Missing required query parameters: country1, country2, year"
    );
    return res.status(400).json({
      error: "Missing required query parameters: country1, country2, year",
    });
  }

  try {
    const collection = db.collection("eventDetails");

    // Try to find the event with the given parameters
    let event = await collection.findOne({ country1, country2, year });

    // If not found, search with countries swapped
    if (!event) {
      event = await collection.findOne({
        country1: country2,
        country2: country1,
        year,
      });
    }

    if (!event) {
      console.log("Event not found for query parameters:", {
        country1,
        country2,
        year,
      });
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({ _id: event._id });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Database error" });
  }
};
