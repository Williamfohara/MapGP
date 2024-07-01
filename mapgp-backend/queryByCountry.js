const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from the .env file
dotenv.config({ path: path.resolve(__dirname, ".env") });

const mongoUri =
  process.env.MONGO_URI ||
  "mongodb+srv://billlyoharaa:zoxubQy5qtCk9pzq@cluster0.dukt8dv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    // Switch to the specific database
    const db = client.db("mapgpTesting1");

    // Query the collection by country1 and country2
    const collection = db.collection("relationshipData");
    const document = await collection.findOne({
      country1: "United States of America",
      country2: "Mexico",
    });
    console.log("Document:", document);

    // If no document found, inform the user
    if (!document) {
      console.log("No document found for the given countries.");
    }
  } catch (error) {
    console.error("Error connecting to MongoDB or fetching data:", error);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

connectToMongoDB();
