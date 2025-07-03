const { MongoClient, ObjectId } = require("mongodb");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Specify the path to your .env file, assuming updateEventYears.js is not in the root directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri);

// Read events with year from events.json
const eventsWithYears = JSON.parse(
  fs.readFileSync("../data/eventsWithYears.json", "utf-8")
);

async function connectToMongoDB() {
  await client.connect();
  console.log("Connected to MongoDB");
}

async function updateEventYears() {
  const db = client.db("mapgpTesting1");
  const collection = db.collection("testingData");

  for (const event of eventsWithYears) {
    const { _id, year } = event;

    // Convert _id string to ObjectId
    const objectId = new ObjectId(_id);

    // Update the document with the new eventYear field
    await collection.updateOne(
      { _id: objectId },
      { $set: { eventYear: year } }
    );

    console.log(`Updated event with _id: ${_id} to include year: ${year}`);
  }

  console.log("All events updated with year");
}

connectToMongoDB()
  .then(async () => {
    await updateEventYears();
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  })
  .finally(async () => {
    await client.close();
    console.log("Disconnected from MongoDB");
  });
