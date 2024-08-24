// Import necessary modules and routes
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const dotenv = require("dotenv");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const configRoutes = require("./routes/configroutes.js");
const timelineRoutes = require("./routes/timelineRoutes");
const generateMissingTimelineAPI = require("./routes/generateMissingTimelineAPI");
const {
  generateEventDetails,
  populateDatabase,
} = require("./manualDBManipulation/populateDatabaseEvents.js");

const {
  handleGenerateSummaryRequest,
} = require("./manualDBManipulation/generateMissingSummary.js");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri);

let db;

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    db = client.db("testingData1");
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
  }
}

connectToMongoDB().catch(console.error);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../html")));
app.use(
  "/data/countryCoordinates",
  express.static(path.join(__dirname, "../data/countryCoordinates"))
);
app.use("/api", configRoutes);
app.use("/api", timelineRoutes);
app.use("/api", generateMissingTimelineAPI);

app.get("/api/getEventDetailsId", async (req, res) => {
  const { country1, country2, year } = req.query;

  console.log("Received request to find event with:", {
    country1,
    country2,
    year,
  }); // Log the query parameters

  if (!country1 || !country2 || !year) {
    return res.status(400).json({
      error: "Missing required query parameters: country1, country2, year",
    });
  }

  try {
    const collection = db.collection("eventDetails");

    // First attempt to find the event with the given parameters
    let event = await collection.findOne({
      country1: country1,
      country2: country2,
      year: year,
    });

    // If no event is found, attempt to find with flipped countries
    if (!event) {
      event = await collection.findOne({
        country1: country2,
        country2: country1,
        year: year,
      });
    }

    if (!event) {
      console.error("No matching event found for:", {
        country1,
        country2,
        year,
      }); // Log if no event is found
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({ _id: event._id });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/event-details", async (req, res) => {
  const { _id } = req.query;

  console.log("Received request for event details with ID:", _id);

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
      console.log("Event not found for ID:", _id);
      return res.status(404).json({ error: "Event not found" });
    }

    // Fetch all events related to the selected countries
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
});

const MAPBOX_API_KEY = process.env.MAPBOX_API_KEY;

app.get("/mapbox/:endpoint", async (req, res) => {
  const endpoint = req.params.endpoint;
  const mapboxUrl = `https://api.mapbox.com/${endpoint}?access_token=${MAPBOX_API_KEY}`;

  try {
    const response = await axios.get(mapboxUrl, {
      params: req.query,
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).send("Error fetching data from Mapbox");
  }
});

app.post("/api/generate-missing-summary", handleGenerateSummaryRequest);

// Route for generating events
app.post("/api/generateEvent", async (req, res) => {
  const { country1, country2, text, year } = req.body;

  console.log(
    "Received request to generate event for:",
    country1,
    country2,
    text,
    year
  );

  if (!country1 || !country2 || !text || !year) {
    console.error("country1, country2, text, or year missing in request");
    return res
      .status(400)
      .json({ error: "country1, country2, text, and year are required" });
  }

  try {
    await connectToMongoDB();
    await populateDatabase(country1, country2, text, year);
    res.status(200).json({ message: "Events generated successfully" });
  } catch (error) {
    console.error("Error occurred while generating events:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
