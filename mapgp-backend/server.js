// server.js
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const dotenv = require("dotenv");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const configRoutes = require("./routes/configroutes.js"); // Adjust the path as needed
const timelineRoutes = require("./routes/timelineRoutes"); // New timeline route

// Load environment variables from the .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let db;

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    db = client.db("testingData1"); // Ensure this matches your actual database name
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
  }
}

connectToMongoDB().catch(console.error);

// Use CORS middleware
app.use(cors());

// Serve static files from the html directory
app.use(express.static("../html"));

// Use the newly defined routes
app.use("/api", configRoutes);
app.use("/api", timelineRoutes); // Add timeline routes

app.get("/event-details", async (req, res) => {
  const { _id } = req.query;

  if (!_id) {
    return res
      .status(400)
      .json({ error: "Missing required query parameter: _id" });
  }

  try {
    const objectId = new ObjectId(_id);
    const collection = db.collection("testingData");
    const event = await collection.findOne({ _id: objectId });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const allEvents = await collection.find().sort({ year: 1 }).toArray();
    const allEventIDs = allEvents.map((event) => event._id.toString());

    res.json({
      eventDetails: event.eventDetails,
      eventYear: event.year,
      allEventIDs: allEventIDs,
    });
  } catch (err) {
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
