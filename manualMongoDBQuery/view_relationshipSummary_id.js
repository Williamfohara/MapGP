const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const path = require("path");

// Specify the path to your .env file, assuming the script is in the mapgp-backend/manualQuery directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function listIds() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("mapgpTesting1");
    const collection = db.collection("relationshipData");

    const cursor = collection.find(
      { relationshipSummary: { $exists: true } },
      { projection: { _id: 1 } }
    );

    await cursor.forEach((doc) => {
      console.log(doc._id);
    });
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

listIds();

//run this node view_relationshipSummary_id.js
