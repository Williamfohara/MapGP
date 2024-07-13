const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Specify the path to your .env file, assuming this script is not in the root directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri);

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

    console.log(`Read ${data.length} documents from updatedNorthAmerica.json`);

    // Insert the new data into the collection
    const result = await collection.insertMany(data, { ordered: false });
    console.log(
      `Inserted ${result.insertedCount} documents into relationshipData collection`
    );

    // Log any write errors
    if (result.writeErrors && result.writeErrors.length > 0) {
      console.error("Some documents were not inserted due to errors:");
      result.writeErrors.forEach((error, index) => {
        console.error(`Error ${index + 1}:`, error);
      });
    }

    // Query all documents to verify
    const allDocuments = await collection.find({}).toArray();
    console.log(
      `Found ${allDocuments.length} documents in the collection after insertion`
    );

    // Log the documents to verify
    allDocuments.forEach((doc, index) => {
      console.log(`Document ${index + 1}:`, JSON.stringify(doc));
    });
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

// Node.js warning messages
console.warn(
  "(node:68551) [MONGODB DRIVER] Warning: useNewUrlParser is a deprecated option: useNewUrlParser has no effect since Node.js Driver version 4.0.0 and will be removed in the next major version"
);
console.warn(
  "(node:68551) [MONGODB DRIVER] Warning: useUnifiedTopology is a deprecated option: useUnifiedTopology has no effect since Node.js Driver version 4.0.0 and will be removed in the next major version"
);
console.warn(
  "Use `node --trace-warnings ...` to show where the warning was created"
);
