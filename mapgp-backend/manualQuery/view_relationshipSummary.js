const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Specify the path to your .env file, assuming the script is in the mapgp-backend/manualQuery directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function listRelationshipSummaries() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("mapgpTesting1");
    const collection = db.collection("relationshipData");

    const cursor = collection.find(
      { relationshipSummary: { $exists: true } },
      { projection: { relationshipSummary: 1 } }
    );

    const relationshipSummaries = [];

    await cursor.forEach((doc) => {
      relationshipSummaries.push({
        relationshipSummary: doc.relationshipSummary,
      });
    });

    // Write the results to a JSON file
    fs.writeFileSync(
      path.resolve(__dirname, "relationshipSummariesNA.json"),
      JSON.stringify(relationshipSummaries, null, 2),
      "utf-8"
    );

    console.log("relationshipSummariesNA.json file has been created.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

listRelationshipSummaries();

// Run this node script using `node manualQuery/view_relationshipSummary.js`
