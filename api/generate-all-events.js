const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const path = require("path");
const {
  populateDatabase,
} = require("../manualDBManipulation/populateDatabaseEvents.js");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri);

let db;

// Function to connect to MongoDB
async function connectToMongoDB() {
  if (!db) {
    await client.connect();
    db = client.db("testingData1");
  }
}

async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "https://www.mapgp.co");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Check if the request method is POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await connectToMongoDB();

  const { country1, country2 } = req.body;

  if (!country1 || !country2) {
    return res.status(400).json({
      error: "country1 and country2 are required",
    });
  }

  try {
    // Fetch the timeline data to determine the range of years
    const timelineCollection = db.collection("timelineData");
    const timelineData = await timelineCollection
      .find({ country1, country2 })
      .project({ year: 1 })
      .toArray();

    if (timelineData.length === 0) {
      return res
        .status(404)
        .json({ error: "No timeline data found for these countries." });
    }

    // Extract the range of years from the timeline data
    const allTimelineYears = timelineData.map((event) => parseInt(event.year));
    const firstYear = Math.min(...allTimelineYears);
    const lastYear = Math.max(...allTimelineYears);
    const allYearsInRange = [];
    for (let year = firstYear; year <= lastYear; year++) {
      allYearsInRange.push(year.toString());
    }

    // Determine which years have fully populated event details
    const eventDetailsCollection = db.collection("eventDetails");
    const existingEvents = await eventDetailsCollection
      .find({ country1, country2 })
      .project({ year: 1 })
      .toArray();
    const existingEventYears = existingEvents.map((event) => event.year);

    // Calculate the years that still need events generated
    const yearsToGenerate = allYearsInRange.filter(
      (year) => !existingEventYears.includes(year)
    );

    if (yearsToGenerate.length === 0) {
      return res
        .status(200)
        .json({ message: "All events are already generated!" });
    }

    // Iterate over each year and generate events
    for (const year of yearsToGenerate) {
      const text = `Event description for ${country1} and ${country2} in ${year}`; // Example text, replace with actual data
      await populateDatabase(country1, country2, text, year);
    }

    res
      .status(200)
      .json({ message: "All missing events generated successfully" });
  } catch (error) {
    console.error("Error occurred while generating all events:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await client.close();
  }
}

// Export the handler function
module.exports = handler;
