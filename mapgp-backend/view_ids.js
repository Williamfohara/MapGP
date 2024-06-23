// Use this file to view the event IDs in MongoDB
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config();

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
    const collection = db.collection("testingData");

    const cursor = collection.find({}, { projection: { _id: 1 } });

    await cursor.forEach((doc) => {
      console.log(doc._id);
    });
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

listIds();
