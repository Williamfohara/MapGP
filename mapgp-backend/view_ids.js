const { MongoClient } = require("mongodb");
const axios = require("axios");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Specify the path to your .env file, assuming populateDatabase.js is not in the root directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });

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
