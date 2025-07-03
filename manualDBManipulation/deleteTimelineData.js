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

async function clearCollection() {
  const db = client.db("testingData1");
  const collection = db.collection("timelineData");

  try {
    const result = await collection.deleteMany({});
    console.log(
      `Cleared ${result.deletedCount} documents from the collection.`
    );
  } catch (error) {
    console.error("Error clearing the collection:", error);
  }
}

connectToMongoDB()
  .then(async () => {
    await clearCollection();
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  })
  .finally(async () => {
    await client.close();
    console.log("Disconnected from MongoDB");
  });
