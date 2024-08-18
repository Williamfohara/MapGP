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
  handleGenerateSummaryRequest,
} = require("./manualDBManipulation/generateMissingSummary");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri);

let db;

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

// New route to fetch event details ID by country1, country2, and year
app.get("/api/getEventDetailsId", async (req, res) => {
  const { country1, country2, year } = req.query;

  if (!country1 || !country2 || !year) {
    return res
      .status(400)
      .json({
        error: "Missing required query parameters: country1, country2, year",
      });
  }

  try {
    const collection = db.collection("eventDetails");
    const event = await collection.findOne({
      country1: country1,
      country2: country2,
      year: year,
    });

    if (!event) {
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

    const allEvents = await collection.find().sort({ year: 1 }).toArray();
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
