const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Specify the path to your .env file, assuming this script is not in the root directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function connectToMongoDB() {
  await client.connect();
  console.log("Connected to MongoDB");
}

async function updateDatabase() {
  const db = client.db("testingData1");
  const collection = db.collection("relationshipData");

  try {
    // Delete all existing documents in the collection
    await collection.deleteMany({});
    console.log("Deleted all documents from relationshipData collection");

    // Read the updatedNorthAmerica.json file
    const data = JSON.parse(
      fs.readFileSync(
        path.resolve(
          __dirname,
          "../../data/countryPairs/updatedNorthAmerica.json"
        ),
        "utf8"
      )
    );

    // Insert the new data into the collection
    await collection.insertMany(data);
    console.log("Inserted new data into relationshipData collection");
  } catch (error) {
    console.error("Error updating the database:", error);
  }
}

async function main() {
  await connectToMongoDB();
  await updateDatabase();
}

main()
  .catch((error) => {
    console.error("Error:", error);
  })
  .finally(async () => {
    await client.close();
    console.log("Disconnected from MongoDB");
  });
