const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const path = require("path");

// Specify the path to your .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri);

async function connectToMongoDB() {
  await client.connect();
  console.log("Connected to MongoDB");
}

async function clearEventDetailsCollection() {
  const db = client.db("testingData1");
  const collection = db.collection("eventDetails");

  try {
    // Query to match documents where country1 and country2 are either USA/Mexico or Mexico/USA
    const filter = {
      $or: [
        { country1: "United States", country2: "Morocco" },
        { country1: "Morocco", country2: "United States" },
      ],
    };

    // Delete the matching documents
    const result = await collection.deleteMany(filter);
    console.log(
      `Cleared ${result.deletedCount} documents from the collection.`
    );
  } catch (error) {
    console.error("Error clearing the collection:", error);
  }
}

connectToMongoDB()
  .then(async () => {
    await clearEventDetailsCollection();
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  })
  .finally(async () => {
    await client.close();
    console.log("Disconnected from MongoDB");
  });
