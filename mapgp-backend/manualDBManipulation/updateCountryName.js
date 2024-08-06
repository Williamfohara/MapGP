const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const path = require("path");

// Specify the path to your .env file, assuming this script is not in the root directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri);

async function connectToMongoDB() {
  await client.connect();
  console.log("Connected to MongoDB");
}

async function updateCountryName() {
  const database = client.db("testingData1");
  const relationshipData = database.collection("relationshipData");
  const timelineData = database.collection("timelineData");

  try {
    // Update in relationshipData collection
    const updateRelationshipData = await relationshipData.updateMany(
      { country1: "Congo, Democratic Republic of the" },
      { $set: { country1: "Democratic Republic of the Congo" } }
    );
    console.log(
      `Updated ${updateRelationshipData.modifiedCount} documents in relationshipData where country1`
    );

    const updateRelationshipDataCountry2 = await relationshipData.updateMany(
      { country2: "Congo, Democratic Republic of the" },
      { $set: { country2: "Democratic Republic of the Congo" } }
    );
    console.log(
      `Updated ${updateRelationshipDataCountry2.modifiedCount} documents in relationshipData where country2`
    );

    // Update in timelineData collection
    const updateTimelineData = await timelineData.updateMany(
      { country1: "Congo, Democratic Republic of the" },
      { $set: { country1: "Democratic Republic of the Congo" } }
    );
    console.log(
      `Updated ${updateTimelineData.modifiedCount} documents in timelineData where country1`
    );

    const updateTimelineDataCountry2 = await timelineData.updateMany(
      { country2: "Congo, Democratic Republic of the" },
      { $set: { country2: "Democratic Republic of the Congo" } }
    );
    console.log(
      `Updated ${updateTimelineDataCountry2.modifiedCount} documents in timelineData where country2`
    );
  } catch (error) {
    console.error("Error updating the database:", error);
  }
}

async function main() {
  await connectToMongoDB();
  await updateCountryName();
}

main()
  .catch((error) => {
    console.error("Error:", error);
  })
  .finally(async () => {
    await client.close();
    console.log("Disconnected from MongoDB");
  });
